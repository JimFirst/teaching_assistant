"""Health check endpoints."""

from fastapi import APIRouter

from app.config import get_settings
from app.core.events import is_model_ready
from app.schemas.ocr import HealthResponse

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with model status."""
    model_ready = is_model_ready()

    return HealthResponse(
        status="healthy" if model_ready else "degraded",
        model_ready=model_ready,
        version=settings.version,
    )


@router.get("/health/ready")
async def readiness_check():
    """Readiness check for Kubernetes probes."""
    model_ready = is_model_ready()

    if not model_ready:
        return {"status": "not_ready", "model_ready": False}

    return {"status": "ready", "model_ready": True}


@router.get("/health/live")
async def liveness_check():
    """Liveness check for Kubernetes probes."""
    return {"status": "alive"}
