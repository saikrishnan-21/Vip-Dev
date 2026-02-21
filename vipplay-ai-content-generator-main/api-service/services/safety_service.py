"""
Safety Service
Handles content safety checks for image generation:
1. Prompt filtering to prevent inappropriate content requests
2. Image safety classification using NSFW detection model
"""

import re
import logging
from typing import Dict, Any, Optional, Tuple
from transformers import pipeline
import httpx
from PIL import Image
import io
import os

logger = logging.getLogger(__name__)

# NSFW keywords to filter from prompts
NSFW_KEYWORDS = [
    # Explicit sexual content
    "nude", "naked", "nudity", "sex", "sexual", "porn", "pornographic", "explicit",
    "erotic", "xxx", "nsfw", "adult content", "mature content",
    # Inappropriate descriptors
    "sexy", "hot", "seductive", "provocative", "sensual", "erotic",
    "bikini", "lingerie", "underwear", "bra", "panties",
    # Violence
    "violence", "violent", "gore", "blood", "weapon", "gun", "knife",
    "murder", "kill", "death", "suicide", "torture",
    # Hate speech indicators
    "hate", "racist", "discrimination", "offensive"
]

# Blocked combinations that are inappropriate
BLOCKED_PATTERNS = [
    r"sexy\s+girl",
    r"hot\s+girl",
    r"naked\s+woman",
    r"nude\s+woman",
    r"sexy\s+woman",
    r"bikini\s+girl",
    r"lingerie\s+model"
]


class SafetyService:
    """Service for content safety checks"""
    
    def __init__(self):
        self.safety_classifier = None
        self._initialize_classifier()
    
    def _initialize_classifier(self):
        """Initialize the NSFW image detection classifier"""
        try:
            # Try to detect if CUDA is available
            try:
                import torch
                cuda_available = torch.cuda.is_available()
                device = 0 if cuda_available else -1
            except ImportError:
                device = -1  # CPU if torch not available
            
            # Override with environment variable if set
            if os.getenv("CUDA_DEVICE"):
                try:
                    device = int(os.getenv("CUDA_DEVICE"))
                except ValueError:
                    device = -1
            
            self.safety_classifier = pipeline(
                "image-classification",
                model="Falconsai/nsfw_image_detection",
                device=device
            )
            logger.info(f"NSFW image detection classifier initialized successfully (device: {device})")
        except Exception as e:
            logger.error(f"Failed to initialize safety classifier: {str(e)}")
            logger.warning("Image safety checks will be disabled - prompts will still be filtered")
            self.safety_classifier = None
    
    def check_prompt_safety(self, prompt: str) -> Tuple[bool, Optional[str]]:
        """
        Check if a prompt contains inappropriate content.
        
        Args:
            prompt: The image generation prompt to check
            
        Returns:
            Tuple of (is_safe, error_message)
            - is_safe: True if prompt is safe, False if inappropriate
            - error_message: Error message if unsafe, None if safe
        """
        if not prompt:
            return False, "Prompt cannot be empty"
        
        prompt_lower = prompt.lower()
        
        # Check for blocked patterns
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, prompt_lower, re.IGNORECASE):
                logger.warning(f"Blocked prompt pattern detected: {pattern}")
                return False, f"Prompt contains inappropriate content pattern and cannot be processed"
        
        # Check for NSFW keywords (use word boundaries to avoid false positives)
        for keyword in NSFW_KEYWORDS:
            # Use word boundaries to avoid matching words that contain the keyword
            # e.g., "football" shouldn't match "ball" in "football"
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, prompt_lower, re.IGNORECASE):
                logger.warning(f"Blocked NSFW keyword detected in prompt: {keyword}")
                return False, f"Prompt contains inappropriate content ('{keyword}') and cannot be processed"
        
        return True, None
    
    async def check_image_safety(self, image_url: str) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Check if a generated image is safe using NSFW detection model.
        
        Args:
            image_url: URL of the generated image to check
            
        Returns:
            Tuple of (is_safe, error_message, detection_results)
            - is_safe: True if image is safe, False if inappropriate
            - error_message: Error message if unsafe, None if safe
            - detection_results: Classification results from the model
        """
        if not self.safety_classifier:
            logger.warning("Safety classifier not available, skipping image safety check")
            return True, None, None
        
        try:
            # Download image
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(image_url)
                response.raise_for_status()
                image_data = response.content
            
            # Load image
            image = Image.open(io.BytesIO(image_data))
            
            # Run safety classification
            results = self.safety_classifier(image)
            
            # Parse results - the model returns a list of dicts with 'label' and 'score'
            # Labels typically include: 'normal', 'nsfw', 'porn', 'sexy', etc.
            detection_results = {}
            is_safe = True
            
            for result in results:
                label = result.get('label', '').lower()
                score = result.get('score', 0.0)
                detection_results[label] = score
                
                # Check for NSFW labels
                if any(nsfw_term in label for nsfw_term in ['nsfw', 'porn', 'sexy', 'hentai', 'pornographic']):
                    if score > 0.3:  # Threshold for NSFW detection
                        is_safe = False
                        logger.warning(f"NSFW content detected: {label} (score: {score:.2f})")
            
            if not is_safe:
                return False, "Generated image contains inappropriate content and cannot be displayed", detection_results
            
            logger.info(f"Image safety check passed: {detection_results}")
            return True, None, detection_results
            
        except Exception as e:
            logger.error(f"Image safety check failed: {str(e)}")
            # On error, we could either block or allow - being conservative and blocking
            return False, f"Unable to verify image safety: {str(e)}", None


# Singleton instance
safety_service = SafetyService()

