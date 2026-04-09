"""OCR service using Tesseract."""

import asyncio
import io
import time
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional

import structlog
import pytesseract
from PIL import Image

from app.config import get_settings
from app.schemas.ocr import OCRResult, OCRText
from app.utils.exceptions import (
    FileTooLargeError,
    ImageProcessError,
    ModelNotReadyError,
    OCRRecognitionError,
    UnsupportedFormatError,
)

logger = structlog.get_logger()
settings = get_settings()

# Thread pool for async OCR execution
_ocr_executor = ThreadPoolExecutor(max_workers=2)


class OCRService:
    """Tesseract OCR service wrapper."""

    def __init__(self):
        self.max_file_size = settings.max_file_size
        self.allowed_formats = settings.allowed_formats

    def check_file_size_limit(self, file_size: int) -> bool:
        """Check if file size is within limit."""
        return file_size <= self.max_file_size

    def check_file_format(self, content: bytes) -> bool:
        """Check if file format is supported."""
        try:
            img = Image.open(io.BytesIO(content))
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

        try:
            img = Image.open(io.BytesIO(content))
            img.verify()
        except Exception as e:
            raise ImageProcessError(
                message="图片文件损坏或无法读取",
                details={"error": str(e)},
            )

        return True

    async def recognize(self, content: bytes, lang: Optional[str] = None) -> OCRResult:
        """Perform OCR recognition on image content."""
        start_time = time.perf_counter()

        await self.validate_image(content)

        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                _ocr_executor,
                self._do_recognize,
                content,
                lang,
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

    def _do_recognize(self, content: bytes, lang: Optional[str]) -> dict:
        """Synchronous OCR recognition using Tesseract."""
        img = Image.open(io.BytesIO(content))

        # Convert to RGB if necessary
        if img.mode not in ("L", "RGB"):
            img = img.convert("RGB")

        # Determine language
        if lang == "en":
            tesseract_lang = "eng"
        elif lang == "ch":
            tesseract_lang = "chi_sim+eng"
        else:
            tesseract_lang = "eng"

        # Get detailed OCR data with bounding boxes
        try:
            data = pytesseract.image_to_data(img, lang=tesseract_lang, output_type=pytesseract.Output.DICT)
        except Exception as e:
            logger.warning("tesseract_fallback", error=str(e))
            # Fallback to simple recognition
            text = pytesseract.image_to_string(img, lang=tesseract_lang)
            return {"texts": [], "full_text": text.strip()}

        texts = []
        full_parts = []
        n_boxes = len(data["level"])

        for i in range(n_boxes):
            text = data["text"][i].strip()
            if not text:
                continue

            conf = float(data["conf"][i]) / 100.0
            if conf < 0.3:
                continue

            x = data["left"][i]
            y = data["top"][i]
            w = data["width"][i]
            h = data["height"][i]

            bbox = [[float(x), float(y)], [float(x + w), float(y)],
                    [float(x + w), float(y + h)], [float(x), float(y + h)]]

            texts.append(OCRText(
                text=text,
                confidence=round(conf, 2),
                bbox=bbox,
            ))
            full_parts.append(text)

        return {
            "texts": texts,
            "full_text": " ".join(full_parts),
        }


# Global service instance
ocr_service = OCRService()


async def load_model() -> None:
    """Load/verify Tesseract OCR."""
    try:
        version = pytesseract.get_tesseract_version()
        logger.info("tesseract_loaded", version=str(version))
    except Exception as e:
        logger.error("tesseract_load_failed", error=str(e))
        raise ModelNotReadyError(
            message="Tesseract OCR 加载失败",
            details={"error": str(e)},
        )


async def warmup() -> bool:
    """Warmup with a test image."""
    try:
        img = Image.new("RGB", (200, 50), color=(255, 255, 255))
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            _ocr_executor,
            lambda: pytesseract.image_to_string(img),
        )
        logger.info("ocr_warmup_completed")
        return True
    except Exception as e:
        logger.error("ocr_warmup_failed", error=str(e))
        return False


async def cleanup() -> None:
    """Cleanup resources."""
    _ocr_executor.shutdown(wait=True)
    logger.info("ocr_cleanup_completed")
