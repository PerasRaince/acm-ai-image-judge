"""
Main FastAPI entry point for AI Image Judge Scoring Service.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.routes import router as api_router
from app.models.registry import ModelRegistry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_judge.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup warm-up and graceful shutdown."""
    settings = get_settings()
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"Execution Device: {settings.DEVICE}")

    # Initialize model registry and pre-warm models
    registry = ModelRegistry.get_instance()
    try:
        registry.preload_all()
    except Exception as e:
        logger.warning(f"Model pre-warm warning (deferred to first call): {e}")
    logger.info("Model registry ready.")

    yield

    logger.info("Shutting down AI Scoring Service.")
    registry.clear_cache()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="Explainable, versioned multi-metric AI scoring service for image recreation competitions.",
        lifespan=lifespan
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount API router
    app.include_router(api_router)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)

