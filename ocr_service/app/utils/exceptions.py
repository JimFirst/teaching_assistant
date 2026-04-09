"""Custom exceptions for OCR service."""

from typing import Any


class OCRServiceError(Exception):
    """Base exception for OCR service."""

    def __init__(self, message: str, code: str = "OCR_ERROR", details: Any = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)


class ImageProcessError(OCRServiceError):
    """Exception raised when image processing fails."""

    def __init__(self, message: str = "图像处理失败", details: Any = None):
        super().__init__(message, code="IMAGE_PROCESS_ERROR", details=details)


class ModelLoadError(OCRServiceError):
    """Exception raised when model loading fails."""

    def __init__(self, message: str = "模型加载失败", details: Any = None):
        super().__init__(message, code="MODEL_LOAD_ERROR", details=details)


class ModelNotReadyError(OCRServiceError):
    """Exception raised when model is not ready."""

    def __init__(self, message: str = "模型未就绪", details: Any = None):
        super().__init__(message, code="MODEL_NOT_READY", details=details)


class FileTooLargeError(OCRServiceError):
    """Exception raised when file is too large."""

    def __init__(self, message: str = "文件过大", details: Any = None):
        super().__init__(message, code="FILE_TOO_LARGE", details=details)


class UnsupportedFormatError(OCRServiceError):
    """Exception raised when file format is not supported."""

    def __init__(self, message: str = "不支持的文件格式", details: Any = None):
        super().__init__(message, code="UNSUPPORTED_FORMAT", details=details)


class OCRRecognitionError(OCRServiceError):
    """Exception raised when OCR recognition fails."""

    def __init__(self, message: str = "OCR识别失败", details: Any = None):
        super().__init__(message, code="OCR_RECOGNITION_ERROR", details=details)
