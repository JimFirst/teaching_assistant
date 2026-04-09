"""OCR Pydantic schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field


class OCRText(BaseModel):
    """Single OCR text result."""

    text: str = Field(..., description="Recognized text")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Recognition confidence")
    bbox: List[List[float]] = Field(..., description="Bounding box coordinates")


class OCRResult(BaseModel):
    """OCR recognition result."""

    texts: List[OCRText] = Field(default_factory=list, description="List of recognized texts")
    full_text: str = Field(..., description="Full concatenated text")
    elapsed_ms: float = Field(..., description="Processing time in milliseconds")


class OCRResponse(BaseModel):
    """OCR API response."""

    success: bool = True
    data: Optional[OCRResult] = None
    request_id: Optional[str] = None


class BatchOCRResponse(BaseModel):
    """Batch OCR API response."""

    success: bool = True
    data: Optional[List[OCRResult]] = None
    request_id: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status: healthy, degraded, unhealthy")
    model_ready: bool = Field(..., description="Whether OCR model is ready")
    version: str = Field(..., description="Service version")


class ErrorDetail(BaseModel):
    """Error detail."""

    code: str
    message: str
    details: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Error response."""

    success: bool = False
    error: ErrorDetail
    request_id: Optional[str] = None
