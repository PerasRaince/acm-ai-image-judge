"""
Singleton Model Registry for AI Scoring Engine.
Manages lazy-loading, device placement (CUDA/CPU), inference mode, and reference caching.
"""

import logging
import threading
from typing import Optional, Dict, Any, Tuple
import torch
from PIL import Image
import open_clip
import lpips
from app.core.config import get_settings

logger = logging.getLogger("ai_judge.models")


class ModelRegistry:
    _instance: Optional["ModelRegistry"] = None
    _lock = threading.Lock()

    def __init__(self):
        self.settings = get_settings()
        self.device = torch.device(self.settings.DEVICE)
        logger.info(f"Initializing ModelRegistry on device: {self.device}")

        # Models (lazily initialized)
        self._dreamsim_model = None
        self._dreamsim_preprocess = None

        self._dino_model = None
        self._dino_processor = None

        self._clip_model = None
        self._clip_preprocess = None
        self._clip_tokenizer = None

        self._lpips_model = None

        # In-memory cache for reference image embeddings
        # Key: reference_sha256 -> Dict[str, Any]
        self._reference_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> "ModelRegistry":
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    # -------------------------------------------------------------------------
    # 1. DreamSim Model
    # -------------------------------------------------------------------------
    def get_dreamsim(self):
        if self._dreamsim_model is None:
            with self._lock:
                if self._dreamsim_model is None:
                    try:
                        import os
                        from dreamsim import dreamsim
                        cache_path = os.path.join(os.path.expanduser("~"), ".cache", "dreamsim")
                        os.makedirs(cache_path, exist_ok=True)
                        model, preprocess = dreamsim(
                            pretrained=True,
                            device=self.device,
                            cache_dir=cache_path
                        )
                        model.eval()
                        self._dreamsim_model = model
                        self._dreamsim_preprocess = preprocess
                        logger.info("DreamSim loaded successfully.")
                    except Exception as e:
                        logger.error(f"Failed to load DreamSim: {e}")
                        raise RuntimeError(f"DreamSim initialization error: {e}")
        return self._dreamsim_model, self._dreamsim_preprocess

    # -------------------------------------------------------------------------
    # 2. DINO Model (DINOv2)
    # -------------------------------------------------------------------------
    def get_dino(self):
        if self._dino_model is None:
            with self._lock:
                if self._dino_model is None:
                    try:
                        logger.info("Loading DINOv2 model...")
                        from transformers import AutoImageProcessor, AutoModel
                        model_name = "facebook/dinov2-small"
                        processor = AutoImageProcessor.from_pretrained(model_name)
                        model = AutoModel.from_pretrained(model_name).to(self.device)
                        model.eval()
                        self._dino_processor = processor
                        self._dino_model = model
                        logger.info("DINOv2 loaded successfully.")
                    except Exception as e:
                        logger.warning(f"Transformers DINOv2 failed ({e}), attempting torch.hub fallback...")
                        try:
                            model = torch.hub.load('facebookresearch/dinov2', 'dinov2_vits14')
                            model = model.to(self.device)
                            model.eval()
                            self._dino_model = model
                            self._dino_processor = None
                            logger.info("Torch Hub DINOv2 loaded successfully.")
                        except Exception as e2:
                            logger.error(f"Failed to load DINOv2: {e2}")
                            raise RuntimeError(f"DINOv2 initialization error: {e2}")
        return self._dino_model, self._dino_processor

    # -------------------------------------------------------------------------
    # 3. CLIP / OpenCLIP Model
    # -------------------------------------------------------------------------
    def get_clip(self):
        if self._clip_model is None:
            with self._lock:
                if self._clip_model is None:
                    try:
                        logger.info(f"Loading OpenCLIP ({self.settings.CLIP_MODEL_NAME})...")
                        model, _, preprocess = open_clip.create_model_and_transforms(
                            self.settings.CLIP_MODEL_NAME,
                            pretrained=self.settings.CLIP_PRETRAINED,
                            device=self.device
                        )
                        model.eval()
                        self._clip_model = model
                        self._clip_preprocess = preprocess
                        logger.info("OpenCLIP loaded successfully.")
                    except Exception as e:
                        logger.error(f"Failed to load OpenCLIP: {e}")
                        raise RuntimeError(f"CLIP initialization error: {e}")
        return self._clip_model, self._clip_preprocess

    # -------------------------------------------------------------------------
    # 4. LPIPS Model
    # -------------------------------------------------------------------------
    def get_lpips(self):
        if self._lpips_model is None:
            with self._lock:
                if self._lpips_model is None:
                    try:
                        logger.info(f"Loading LPIPS (net={self.settings.LPIPS_NET})...")
                        loss_fn = lpips.LPIPS(net=self.settings.LPIPS_NET, verbose=False)
                        loss_fn = loss_fn.to(self.device)
                        loss_fn.eval()
                        self._lpips_model = loss_fn
                        logger.info("LPIPS loaded successfully.")
                    except Exception as e:
                        logger.error(f"Failed to load LPIPS: {e}")
                        raise RuntimeError(f"LPIPS initialization error: {e}")
        return self._lpips_model

    # -------------------------------------------------------------------------
    # Reference Image Embedding Cache
    # -------------------------------------------------------------------------
    def get_cached_reference(self, sha256: str) -> Optional[Dict[str, Any]]:
        with self._cache_lock:
            return self._reference_cache.get(sha256)

    def cache_reference(self, sha256: str, features: Dict[str, Any]) -> None:
        with self._cache_lock:
            if len(self._reference_cache) >= self.settings.MAX_REFERENCE_CACHE_ENTRIES:
                # Evict oldest entry (FIFO)
                oldest_key = next(iter(self._reference_cache))
                del self._reference_cache[oldest_key]
            self._reference_cache[sha256] = features

    def clear_cache(self) -> None:
        with self._cache_lock:
            self._reference_cache.clear()

