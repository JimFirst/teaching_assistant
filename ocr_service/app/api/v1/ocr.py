"""OCR API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas.ocr import BatchOCRResponse, OCRResponse
from app.services.ocr_engine import ocr_service

router = APIRouter()


@router.post("/ocr/recognize", response_model=OCRResponse)
async def recognize_text(
    file: UploadFile = File(..., description="Image file for OCR"),
    language: Optional[str] = Form(None, description="Language: ch, en"),
):
    """
    Recognize text from a single image.

    Supported formats: JPEG, PNG, BMP, TIFF, WebP
    Max file size: 10MB
    """
    # Read file content
    content = await file.read()

    # Validate file size on read
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    # Perform OCR
    result = await ocr_service.recognize(content, lang=language)

    return OCRResponse(
        success=True,
        data=result,
    )


@router.post("/ocr/recognize/batch", response_model=BatchOCRResponse)
async def recognize_text_batch(
    files: List[UploadFile] = File(..., description="Multiple image files for OCR"),
):
    """
    Recognize text from multiple images in batch.

    Supported formats: JPEG, PNG, BMP, TIFF, WebP
    Max file size: 10MB per file
    Max files per request: 10
    """
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Too many files (max 10)")

    results = []

    for file in files:
        content = await file.read()

        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail=f"File {file.filename} too large (max 10MB)",
            )

        result = await ocr_service.recognize(content)
        results.append(result)

    return BatchOCRResponse(
        success=True,
        data=results,
    )
