"""
Video Generation Router
VIP-10403: Generate AI Videos

Integrates with HuggingFace Model API service for video generation.
The HuggingFace API service runs on a separate endpoint (port 7860) on the same server as Ollama.
Supports both text-to-video (T2V) and image-to-video (I2V) generation modes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import os
import logging
import time
from services.hf_api_service import hf_api_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/videos", tags=["videos"])


class VideoGenerationRequest(BaseModel):
    """Request model for video generation"""
    prompt: str = Field(..., min_length=1, max_length=1000, description="Video generation prompt")
    model_id: Optional[str] = Field(None, description="HuggingFace model ID (defaults to HF_DEFAULT_VIDEO_MODEL)")
    width: Optional[int] = Field(None, ge=256, le=2048, description="Video width in pixels (optional, model-specific defaults)")
    height: Optional[int] = Field(None, ge=256, le=2048, description="Video height in pixels (optional, model-specific defaults)")
    negative_prompt: Optional[str] = Field(None, max_length=500, description="Negative prompt")
    num_inference_steps: int = Field(9, ge=9, le=100, description="Number of inference steps")
    guidance_scale: Optional[float] = Field(None, ge=1.0, le=20.0, description="Guidance scale (optional, model-specific defaults)")
    num_frames: Optional[int] = Field(None, ge=1, le=200, description="Number of video frames (optional, model-specific defaults)")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")
    image: Optional[str] = Field(None, description="Image URL or base64 for I2V (image-to-video) models")


class VideoGenerationResponse(BaseModel):
    """Response model for video generation"""
    success: bool
    video_url: Optional[str] = None
    job_id: Optional[str] = None
    error: Optional[str] = None
    prompt: str
    width: Optional[int] = None
    height: Optional[int] = None
    generation_time: Optional[float] = None


@router.post("/generate", response_model=VideoGenerationResponse)
async def generate_video(request: VideoGenerationRequest) -> VideoGenerationResponse:
    """
    Generate a video using HuggingFace Model API
    
    This endpoint integrates with the HuggingFace API service running on port 7860.
    Supports both text-to-video (T2V) and image-to-video (I2V) generation modes.
    For I2V, provide the 'image' parameter with a URL or base64 encoded image.
    """
    try:
        start_time = time.time()
        
        # Get model ID from request or environment
        model_id = request.model_id or os.getenv("HF_DEFAULT_VIDEO_MODEL", "Wan-AI/Wan2.2-TI2V-5B")
        
        # Call HuggingFace API service
        result = await hf_api_service.generate_video(
            prompt=request.prompt,
            model_id=model_id,
            width=request.width,
            height=request.height,
            negative_prompt=request.negative_prompt,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            num_frames=request.num_frames,
            seed=request.seed,
            image=request.image
        )
        
        generation_time = time.time() - start_time
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error")
            logger.error(f"Video generation failed: {error_msg}")
            raise HTTPException(
                status_code=503,
                detail=f"Video generation failed: {error_msg}"
            )
        
        return VideoGenerationResponse(
            success=True,
            video_url=result.get("download_url"),
            job_id=result.get("job_id"),
            error=None,
            prompt=request.prompt,
            width=request.width,
            height=request.height,
            generation_time=generation_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Video generation failed: {str(e)}"
        )


@router.get("/health")
async def video_service_health():
    """Check if HuggingFace API service is available"""
    try:
        is_healthy = await hf_api_service.check_health()
        hf_api_url = os.getenv("HF_API_BASE_URL", "http://localhost:7860")
        
        return {
            "service": "video_generation",
            "configured": True,
            "service_type": "huggingface_api",
            "hf_api_url": hf_api_url,
            "available": is_healthy
        }
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "service": "video_generation",
            "configured": True,
            "service_type": "huggingface_api",
            "available": False,
            "error": str(e)
        }

