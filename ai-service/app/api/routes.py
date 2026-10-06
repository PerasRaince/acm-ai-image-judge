"""
FastAPI Route Handlers for AI Scoring Engine.
Endpoints:
- GET /health
- POST /v1/score (multipart/form-data upload)
- POST /v1/score/json (JSON payload with URLs or Base64)
- GET /v1/models/status
- POST /v1/cache/clear
"""

import base64
import json
import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
import httpx
import torch

from app.core.config import get_settings
from app.models.registry import ModelRegistry
from app.preprocessing.pipeline import (
    preprocess_image_bytes,
    ImageValidationError
)
from app.scoring.engine import score_images
from app.schemas.score_schema import (
    ScoringResponse,
    ComponentScores,
    ScoringRequestJson,
    HealthResponse
)

logger = logging.getLogger("ai_judge.api")
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check reporting device and model initialization state."""
    settings = get_settings()
    registry = ModelRegistry.get_instance()
    cuda_avail = torch.cuda.is_available()

    models_state = {
        "dreamsim": registry._dreamsim_model is not None,
        "dino": registry._dino_model is not None,
        "clip": registry._clip_model is not None,
        "lpips": registry._lpips_model is not None,
    }

    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.VERSION,
        device=str(registry.device),
        cuda_available=cuda_avail,
        models_initialized=models_state
    )


@router.post("/v1/score", response_model=ScoringResponse)
async def score_image_files(
    reference_file: UploadFile = File(..., description="The official competition reference image"),
    candidate_file: UploadFile = File(..., description="Participant's AI-generated recreation attempt"),
    required_aspect_ratio: Optional[str] = Form("any"),
    weights_json: Optional[str] = Form(None),
    scoring_version: Optional[str] = Form(None)
):
    """
    Primary scoring endpoint receiving multipart/form-data image uploads.
    Validates images, executes the multi-metric ensemble, and produces
    the transparent 0-100 Reference Similarity Score.
    """
    settings = get_settings()

    # Read uploaded bytes
    ref_bytes = await reference_file.read()
    cand_bytes = await candidate_file.read()

    if len(ref_bytes) > settings.MAX_IMAGE_SIZE_BYTES or len(cand_bytes) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size exceeds maximum limit of {settings.MAX_IMAGE_SIZE_BYTES // (1024*1024)}MB."
        )

    # Preprocess reference image
    try:
        ref_preprocessed = preprocess_image_bytes(
            ref_bytes,
            required_aspect_ratio="any",  # Reference image defines standard
            min_dimension=settings.MIN_IMAGE_DIMENSION,
            max_dimension=settings.MAX_IMAGE_DIMENSION
        )
    except ImageValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reference image error: {str(e)}"
        )

    # Preprocess candidate recreation image
    try:
        cand_preprocessed = preprocess_image_bytes(
            cand_bytes,
            required_aspect_ratio=required_aspect_ratio,
            min_dimension=settings.MIN_IMAGE_DIMENSION,
            max_dimension=settings.MAX_IMAGE_DIMENSION
        )
    except ImageValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Candidate recreation error: {str(e)}"
        )

    # Parse optional custom weights
    parsed_weights = None
    if weights_json:
        try:
            parsed_weights = json.loads(weights_json)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid weights_json format. Must be a valid JSON dictionary."
            )

    # Score candidate against reference
    try:
        result = score_images(
            reference=ref_preprocessed,
            candidate=cand_preprocessed,
            weights=parsed_weights,
            scoring_version=scoring_version
        )
    except Exception as e:
        logger.error(f"Inference pipeline failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scoring pipeline execution error: {str(e)}"
        )

    return ScoringResponse(
        final_score=result.final_score,
        component_scores=ComponentScores(
            dreamsim=result.dreamsim_score,
            dino=result.dino_score,
            clip=result.clip_score,
            lpips=result.lpips_score,
            color=result.color_score,
            quality=result.quality_score
        ),
        raw_metrics=result.raw_metrics,
        inference_duration_ms=result.inference_duration_ms,
        device=result.device,
        scoring_version=result.scoring_version,
        is_exact_reference_match=result.is_exact_reference_match,
        reference_sha256=ref_preprocessed.sha256,
        candidate_sha256=cand_preprocessed.sha256,
        aspect_ratio=round(cand_preprocessed.aspect_ratio, 3)
    )


@router.post("/v1/score/json", response_model=ScoringResponse)
async def score_image_json(payload: ScoringRequestJson):
    """
    Alternative scoring endpoint receiving URLs or Base64 payloads.
    Fetches remote images or decodes base64, then evaluates them.
    """
    settings = get_settings()

    # Resolve reference image bytes
    if payload.reference_base64:
        ref_bytes = base64.b64decode(payload.reference_base64)
    elif payload.reference_url:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(payload.reference_url)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to download reference image from URL.")
            ref_bytes = resp.content
    else:
        raise HTTPException(status_code=400, detail="Must provide reference_base64 or reference_url.")

    # Resolve candidate image bytes
    if payload.candidate_base64:
        cand_bytes = base64.b64decode(payload.candidate_base64)
    elif payload.candidate_url:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(payload.candidate_url)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to download candidate recreation from URL.")
            cand_bytes = resp.content
    else:
        raise HTTPException(status_code=400, detail="Must provide candidate_base64 or candidate_url.")

    # Preprocess reference
    try:
        ref_preprocessed = preprocess_image_bytes(
            ref_bytes,
            required_aspect_ratio="any",
            min_dimension=settings.MIN_IMAGE_DIMENSION,
            max_dimension=settings.MAX_IMAGE_DIMENSION
        )
    except ImageValidationError as e:
        raise HTTPException(status_code=400, detail=f"Reference image error: {str(e)}")

    # Preprocess candidate
    try:
        cand_preprocessed = preprocess_image_bytes(
            cand_bytes,
            required_aspect_ratio=payload.required_aspect_ratio,
            min_dimension=settings.MIN_IMAGE_DIMENSION,
            max_dimension=settings.MAX_IMAGE_DIMENSION
        )
    except ImageValidationError as e:
        raise HTTPException(status_code=400, detail=f"Candidate recreation error: {str(e)}")

    # Score
    result = score_images(
        reference=ref_preprocessed,
        candidate=cand_preprocessed,
        weights=payload.custom_weights,
        scoring_version=payload.scoring_version
    )

    return ScoringResponse(
        final_score=result.final_score,
        component_scores=ComponentScores(
            dreamsim=result.dreamsim_score,
            dino=result.dino_score,
            clip=result.clip_score,
            lpips=result.lpips_score,
            color=result.color_score,
            quality=result.quality_score
        ),
        raw_metrics=result.raw_metrics,
        inference_duration_ms=result.inference_duration_ms,
        device=result.device,
        scoring_version=result.scoring_version,
        is_exact_reference_match=result.is_exact_reference_match,
        reference_sha256=ref_preprocessed.sha256,
        candidate_sha256=cand_preprocessed.sha256,
        aspect_ratio=round(cand_preprocessed.aspect_ratio, 3)
    )


@router.get("/v1/models/status")
async def models_status():
    """Returns model registry status and reference cache metrics."""
    registry = ModelRegistry.get_instance()
    with registry._cache_lock:
        cache_size = len(registry._reference_cache)
        cached_keys = list(registry._reference_cache.keys())

    return {
        "device": str(registry.device),
        "cached_reference_images_count": cache_size,
        "cached_reference_hashes": cached_keys,
        "models": {
            "dreamsim": registry._dreamsim_model is not None,
            "dino": registry._dino_model is not None,
            "clip": registry._clip_model is not None,
            "lpips": registry._lpips_model is not None
        }
    }


@router.post("/v1/cache/clear")
async def clear_cache():
    """Clears reference image embeddings cache."""
    registry = ModelRegistry.get_instance()
    registry.clear_cache()
    return {"message": "Reference cache cleared successfully."}

