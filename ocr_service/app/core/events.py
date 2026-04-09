"""Application events: startup and shutdown handlers."""

import asyncio
import structlog
from contextlib import asynccontextmanager
from typing import Optional

from app.config import get_settings
from app.services.ocr_engine import ocr_service, load_model, warmup

logger = structlog.get_logger()

# Global model ready flag
_model_ready: bool = False


def is_model_ready() -> bool:
    """Check if model is ready."""
    return _model_ready


@asynccontextmanager
async def lifespan(app):
    """Application lifespan handler."""
    global _model_ready

    # Startup
    logger.info("application_starting", version=get_settings().version)

    # Start model loading in background
    asyncio.create_task(load_model_warmup())

    yield

    # Shutdown
    logger.info("application_shutting_down")
    from app.services.paddle_ocr import cleanup
    await cleanup()


async def load_model_warmup():
    """Load model and perform warmup."""
    global _model_ready

    try:
        logger.info("model_loading_start")
        await load_model()
        logger.info("model_loaded_success")

        # Perform warmup inference
        logger.info("model_warmup_start")
        warmup_success = await warmup()

        if warmup_success:
            _model_ready = True
            logger.info("model_warmup_success")
        else:
            logger.error("model_warmup_failed")
            _model_ready = False

    except Exception as e:
        logger.error("model_load_failed", error=str(e))
        _model_ready = False
