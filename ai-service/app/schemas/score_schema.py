"""
Pydantic schemas for AI Scoring Service API.
Ensures strong typing, request validation, and transparent explainable response structure.
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class ComponentScores(BaseModel):
    dreamsim: float = Field(..., description="Human perceptual similarity (0-100)", ge=0.0, le=100.0)
    dino: float = Field(..., description="Structural / visual correspondence (0-100)", ge=0.0, le=100.0)
    clip: float = Field(..., description="Semantic / conceptual similarity (0-100)", ge=0.0, le=100.0)
    lpips: float = Field(..., description="Patch-level perceptual detail fidelity (0-100)", ge=0.0, le=100.0)
    color: float = Field(..., description="Color histogram & Lab space similarity (0-100)", ge=0.0, le=100.0)
    quality: float = Field(..., description="Technical quality, sharpness & dynamic range (0-100)", ge=0.0, le=100.0)


class ScoringResponse(BaseModel):
    final_score: float = Field(..., description="Composite Reference Similarity Score (0-100)", ge=0.0, le=100.0)
    component_scores: ComponentScores
    raw_metrics: Dict[str, Any] = Field(default_factory=dict, description="Raw unnormalized model outputs")
    inference_duration_ms: int = Field(..., description="Total inference time in milliseconds")
    device: str = Field(..., description="Hardware device utilized (cuda / cpu)")
    scoring_version: str = Field(..., description="Version of the scoring engine used")
    is_exact_reference_match: bool = Field(False, description="Flag indicating identical byte match with reference")
    reference_sha256: str = Field(..., description="SHA-256 hash of reference image")
    candidate_sha256: str = Field(..., description="SHA-256 hash of candidate recreation")
    aspect_ratio: float = Field(..., description="Candidate image aspect ratio (width/height)")


class ScoringRequestJson(BaseModel):
    reference_base64: Optional[str] = Field(None, description="Base64 encoded reference image bytes")
    candidate_base64: Optional[str] = Field(None, description="Base64 encoded candidate recreation bytes")
    reference_url: Optional[str] = Field(None, description="Public / signed URL for reference image")
    candidate_url: Optional[str] = Field(None, description="Public / signed URL for candidate image")
    required_aspect_ratio: Optional[str] = Field("any", description="Required aspect ratio e.g. '1:1', '16:9'")
    custom_weights: Optional[Dict[str, float]] = Field(None, description="Optional custom weights override")
    scoring_version: Optional[str] = Field(None, description="Target scoring version identifier")


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    device: str
    cuda_available: bool
    models_initialized: Dict[str, bool]


class CalibrationEntry(BaseModel):
    reference_id: str
    candidate_id: str
    human_score: Optional[float] = None
    human_rank: Optional[int] = None
    dreamsim: float
    dino: float
    clip: float
    lpips: float
    color: float
    quality: float
    final_score: float

