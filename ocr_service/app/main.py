"""FastAPI application entry point."""

import structlog
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.api.v1 import ocr, health
from app.config import get_settings
from app.core.events import lifespan, is_model_ready
from app.core.middleware import MonitoringMiddleware
from app.utils.exceptions import OCRServiceError

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan_manager(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan manager."""
    from app.core.events import load_model_warmup

    logger.info("application_starting", version=get_settings().version)
    await load_model_warmup()

    yield

    logger.info("application_shutting_down")
    from app.services.paddle_ocr import paddle_ocr_service
    await paddle_ocr_service.cleanup()


# Create FastAPI application
app = FastAPI(
    title="PaddleOCR Service",
    description="High-performance OCR service powered by PaddleOCR",
    version=get_settings().version,
    lifespan=lifespan if False else lifespan_manager,  # Use lifespan_manager for proper startup
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Add middleware
app.add_middleware(MonitoringMiddleware)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(ocr.router, prefix="/api/v1", tags=["ocr"])


# Exception handlers
@app.exception_handler(OCRServiceError)
async def ocr_service_error_handler(request: Request, exc: OCRServiceError):
    """Handle OCR service errors."""
    status_code_map = {
        "IMAGE_PROCESS_ERROR": 400,
        "MODEL_LOAD_ERROR": 500,
        "MODEL_NOT_READY": 503,
        "FILE_TOO_LARGE": 413,
        "UNSUPPORTED_FORMAT": 400,
        "OCR_RECOGNITION_ERROR": 422,
    }
    status_code = status_code_map.get(exc.code, 500)

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "请求参数验证失败",
                "details": exc.errors(),
            },
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.exception("unhandled_exception", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "服务器内部错误",
            },
            "request_id": getattr(request.state, "request_id", None),
        },
    )


# Prometheus metrics endpoint
@app.get("/metrics", include_in_schema=False)
async def metrics():
    """Prometheus metrics endpoint."""
    from starlette.responses import Response
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    import uvicorn
    _settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=_settings.host,
        port=_settings.port,
        reload=_settings.debug,
        workers=1,
    )
