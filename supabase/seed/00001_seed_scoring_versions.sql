-- 00001_seed_scoring_versions.sql
-- AI Image Judge Platform - Initial Scoring Version Seed (v1.0.0)
-- Immutable configuration of model weights, preprocessing, and normalization parameters.

INSERT INTO public.scoring_versions (
    id,
    name,
    version,
    model_versions,
    preprocessing_version,
    metric_weights,
    normalization_config,
    is_active
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'AI Image Judge Standard Ensemble v1.0',
    'v1.0.0',
    '{
        "dreamsim": "dino_vitb16",
        "dino": "dinov2_vits14",
        "clip": "ViT-B-32-openai",
        "lpips": "alex",
        "color": "lab_histogram_wasserstein_v1",
        "quality": "laplacian_contrast_v1"
    }'::jsonb,
    'v1',
    '{
        "dreamsim": 0.35,
        "dino": 0.30,
        "clip": 0.15,
        "lpips": 0.10,
        "color": 0.05,
        "quality": 0.05
    }'::jsonb,
    '{
        "dreamsim": { "type": "distance_to_similarity", "scale": 1.0, "min": 0.0, "max": 1.0 },
        "dino": { "type": "cosine_similarity", "min_clip": 0.0, "max_clip": 1.0 },
        "clip": { "type": "cosine_similarity", "min_clip": 0.0, "max_clip": 1.0 },
        "lpips": { "type": "distance_to_similarity", "scale": 1.0, "min": 0.0, "max": 1.0 },
        "color": { "type": "similarity_score", "min_clip": 0.0, "max_clip": 1.0 },
        "quality": { "type": "quality_heuristic", "min_clip": 0.0, "max_clip": 1.0 }
    }'::jsonb,
    true
)
ON CONFLICT (version) DO UPDATE SET
    name = EXCLUDED.name,
    model_versions = EXCLUDED.model_versions,
    metric_weights = EXCLUDED.metric_weights,
    normalization_config = EXCLUDED.normalization_config,
    is_active = EXCLUDED.is_active;

