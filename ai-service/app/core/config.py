"""
Core configuration settings for AI Scoring Service.
Supports automatic CUDA/CPU detection, model parameters, and environment overrides.
"""

import os
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings
import torch


from pydantic import field_validator

class Settings(BaseSettings):
    # Service Information
    APP_NAME: str = "AI Image Judge - Scoring Engine"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "debug")
        return bool(v)

    # Execution Device (cuda if available else cpu)
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"
    TORCH_THREADS: int = max(1, os.cpu_count() or 4)

    # Scoring Defaults
    DEFAULT_SCORING_VERSION: str = "v1.0.0"

    # Input Limits & Security
    MAX_IMAGE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    MAX_IMAGE_DIMENSION: int = 4096
    MIN_IMAGE_DIMENSION: int = 64
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp"]
    ALLOWED_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    # Pretrained Model Configurations
    CLIP_MODEL_NAME: str = "ViT-B-32"
    CLIP_PRETRAINED: str = "openai"
    DINO_MODEL_NAME: str = "dinov2_vits14"
    DREAMSIM_MODEL_TYPE: str = "dino_vitb16"
    LPIPS_NET: str = "alex"

    # Cache Settings
    ENABLE_REFERENCE_CACHE: bool = True
    MAX_REFERENCE_CACHE_ENTRIES: int = 128

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()

