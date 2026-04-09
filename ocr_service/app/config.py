"""Application configuration."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    log_level: str = "info"

    # File settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_formats: list = ["jpg", "jpeg", "png", "bmp", "tiff", "webp"]

    # OCR settings
    ocr_use_gpu: bool = False
    ocr_use_angle_cls: bool = True
    ocr_lang: str = "ch"
    ocr_show_log: bool = False
    cls_model_dir: str = "ch_ppocr_mobile_v2.0_cls"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
