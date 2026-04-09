"""Tests for OCR service."""

import io
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from PIL import Image

from app.schemas.ocr import OCRResponse


def create_test_image(format="PNG", size=(100, 100), color=(255, 255, 255)) -> bytes:
    """Create a test image in memory."""
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()


class TestOCRSchemas:
    """Test OCR schemas."""

    def test_ocr_text_model(self):
        """Test OCRText model."""
        from app.schemas.ocr import OCRText

        text = OCRText(text="test", confidence=0.95, bbox=[[0, 0], [100, 0], [100, 20], [0, 20]])
        assert text.text == "test"
        assert text.confidence == 0.95
        assert text.bbox == [[0, 0], [100, 0], [100, 20], [0, 20]]

    def test_ocr_result_model(self):
        """Test OCRResult model."""
        from app.schemas.ocr import OCRResult

        result = OCRResult(
            texts=[{"text": "test", "confidence": 0.95, "bbox": [[0, 0], [100, 0], [100, 20], [0, 20]]}],
            full_text="test",
            elapsed_ms=100.0,
        )
        assert len(result.texts) == 1
        assert result.full_text == "test"
        assert result.elapsed_ms == 100.0

    def test_ocr_response_model(self):
        """Test OCRResponse model."""
        response = OCRResponse(success=True, data={"texts": [], "full_text": "", "elapsed_ms": 0})
        assert response.success is True


class TestHealthEndpoint:
    """Test health endpoint."""

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test health check endpoint."""
        from fastapi.testclient import TestClient
        from app.main import app

        with patch("app.core.events.is_model_ready", return_value=True):
            client = TestClient(app)
            response = client.get("/api/v1/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"


class TestOCRService:
    """Test OCR service."""

    @pytest.mark.asyncio
    async def test_validate_image_valid(self):
        """Test validate_image with valid image."""
        from app.services.paddle_ocr import OCRService

        service = OCRService()
        image_bytes = create_test_image()
        result = await service.validate_image(image_bytes)
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_image_invalid_format(self):
        """Test validate_image with invalid format."""
        from app.services.paddle_ocr import OCRService
        from app.utils.exceptions import UnsupportedFormatError

        service = OCRService()
        with pytest.raises(UnsupportedFormatError):
            await service.validate_image(b"not an image")

    @pytest.mark.asyncio
    async def test_validate_image_too_large(self):
        """Test validate_image with file too large."""
        from app.services.paddle_ocr import OCRService
        from app.utils.exceptions import FileTooLargeError

        service = OCRService()
        large_data = b"x" * (11 * 1024 * 1024)  # 11MB
        with pytest.raises(FileTooLargeError):
            await service.validate_image(large_data)

    def test_check_file_size_limit(self):
        """Test file size limit check."""
        from app.services.paddle_ocr import OCRService

        service = OCRService()
        # Normal file
        assert service.check_file_size_limit(1024 * 1024) is True
        # Too large file
        assert service.check_file_size_limit(11 * 1024 * 1024) is False

    def test_check_file_format_valid(self):
        """Test file format check with valid formats."""
        from app.services.paddle_ocr import OCRService

        service = OCRService()
        # JPEG
        jpeg_bytes = create_test_image(format="JPEG")
        assert service.check_file_format(jpeg_bytes) is True
        # PNG
        png_bytes = create_test_image(format="PNG")
        assert service.check_file_format(png_bytes) is True


class TestConfig:
    """Test configuration."""

    def test_settings_defaults(self):
        """Test default settings."""
        from app.config import Settings

        settings = Settings()
        assert settings.host == "0.0.0.0"
        assert settings.port == 8000
        assert settings.max_file_size == 10485760
        assert settings.ocr_use_gpu is True
        assert settings.ocr_lang == "ch"

    def test_settings_from_env(self):
        """Test settings from environment."""
        from app.config import Settings

        settings = Settings(host="127.0.0.1", port=9000, debug=True)
        assert settings.host == "127.0.0.1"
        assert settings.port == 9000
        assert settings.debug is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
