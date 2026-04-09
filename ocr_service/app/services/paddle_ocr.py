"""PaddleOCR service wrapper."""

import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from typing import List, Optional

import structlog
from PIL import Image

from app.config import get_settings
from app.schemas.ocr import OCRResult, OCRText
from app.utils.exceptions import (
    FileTooLargeError,
    ImageProcessError,
    ModelLoadError,
    ModelNotReadyError,
    OCRRecognitionError,
    UnsupportedFormatError,
)

logger = structlog.get_logger()
settings = get_settings()

# Thread pool for async OCR execution
_ocr_executor = ThreadPoolExecutor(max_workers=2)

# Global OCR model instance
_ocr_model: Optional["PaddleOCR"] = None


class OCRService:
    """PaddleOCR service wrapper."""

    def __init__(self):
        self.max_file_size = settings.max_file_size
        self.allowed_formats = settings.allowed_formats

    def check_file_size_limit(self, file_size: int) -> bool:
        """Check if file size is within limit."""
        return file_size <= self.max_file_size

    def check_file_format(self, content: bytes) -> bool:
        """Check if file format is supported."""
        try:
            img = Image.open(BytesIO(content))
            fmt = img.format.lower() if img.format else ""
            return fmt in self.allowed_formats or fmt in ["jpeg", "jpg"]
        except Exception:
            return False

    async def validate_image(self, content: bytes) -> bool:
        """Validate image content."""
        if not self.check_file_size_limit(len(content)):
            raise FileTooLargeError(
                message=f"文件大小超过限制 ({self.max_file_size / 1024 / 1024:.1f}MB)",
                details={"size": len(content), "limit": self.max_file_size},
            )

        if not self.check_file_format(content):
            raise UnsupportedFormatError(
                message="不支持的图片格式",
                details={"allowed": self.allowed_formats},
            )

        # Try to open and verify image
        try:
            img = Image.open(BytesIO(content))
            img.verify()
        except Exception as e:
            raise ImageProcessError(
                message="图片文件损坏或无法读取",
                details={"error": str(e)},
            )

        return True

    async def recognize(self, content: bytes, **kwargs) -> OCRResult:
        """Perform OCR recognition on image content."""
        from paddleocr import PaddleOCR

        global _ocr_model

        start_time = time.perf_counter()

        # Validate image
        await self.validate_image(content)

        # Check if model is loaded
        if _ocr_model is None:
            raise ModelNotReadyError()

        # Run OCR in executor to avoid blocking
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                _ocr_executor,
                self._do_recognize,
                content,
                kwargs,
            )
        except Exception as e:
            logger.error("ocr_recognition_failed", error=str(e))
            raise OCRRecognitionError(
                message="OCR识别过程出错",
                details={"error": str(e)},
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return OCRResult(
            texts=result["texts"],
            full_text=result["full_text"],
            elapsed_ms=round(elapsed_ms, 2),
        )

    def _do_recognize(self, content: bytes, kwargs) -> dict:
        """Synchronous OCR recognition."""
        from paddleocr import PaddleOCR

        global _ocr_model

        # Use global model
        ocr = _ocr_model

        # Run OCR
        result = ocr.ocr(content, cls=kwargs.get("use_angle_cls", settings.ocr_use_angle_cls))

        if not result or not result[0]:
            return {"texts": [], "full_text": ""}

        texts = []
        full_parts = []

        for line in result[0]:
            if line:
                bbox = line[0] if len(line) > 0 else []
                text = line[1][0] if len(line) > 1 else ""
                confidence = line[1][1] if len(line) > 1 else 0.0

                texts.append(
                    OCRText(
                        text=text,
                        confidence=float(confidence),
                        bbox=[[float(x), float(y)] for x, y in bbox] if bbox else [],
                    )
                )
                full_parts.append(text)

        return {
            "texts": texts,
            "full_text": "\n".join(full_parts),
        }


# Global service instance
paddle_ocr_service = OCRService()


async def load_model() -> None:
    """Load PaddleOCR model."""
    global _ocr_model

    try:
        from paddleocr import PaddleOCR

        logger.info("paddleocr_model_loading", lang=settings.ocr_lang, gpu=settings.ocr_use_gpu)

        _ocr_model = PaddleOCR(
            use_angle_cls=settings.ocr_use_angle_cls,
            lang=settings.ocr_lang,
            use_gpu=settings.ocr_use_gpu,
            show_log=settings.ocr_show_log,
            cls_model_dir=settings.cls_model_dir,
        )

        logger.info("paddleocr_model_loaded")

    except Exception as e:
        logger.error("paddleocr_model_load_failed", error=str(e))
        raise ModelLoadError(
            message="PaddleOCR 模型加载失败",
            details={"error": str(e)},
        )


async def warmup() -> bool:
    """Warmup model with test image."""
    global _ocr_model

    if _ocr_model is None:
        return False

    try:
        # Create a blank test image
        img = Image.new("RGB", (100, 100), color=(200, 200, 200))
        buf = BytesIO()
        img.save(buf, format="PNG")
        test_image = buf.getvalue()

        # Run warmup inference
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            _ocr_executor,
            lambda: _ocr_model.ocr(test_image, cls=settings.ocr_use_angle_cls),
        )

        logger.info("paddleocr_warmup_completed")
        return True

    except Exception as e:
        logger.error("paddleocr_warmup_failed", error=str(e))
        return False


async def cleanup() -> None:
    """Cleanup resources."""
    global _ocr_model

    _ocr_model = None
    _ocr_executor.shutdown(wait=True)
    logger.info("paddleocr_cleanup_completed")
