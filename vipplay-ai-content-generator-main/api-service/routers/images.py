"""
Image Generation Router
VIP-10402: Generate AI Images

Integrates with HuggingFace Model API service for image generation.
The HuggingFace API service runs on a separate endpoint (port 7860) on the same server as Ollama.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Tuple
import os
import logging
import time
from services.hf_api_service import hf_api_service
from services.safety_service import safety_service
from services.s3_service import s3_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/images", tags=["images"])


class ImageGenerationRequest(BaseModel):
    """Request model for image generation"""
    prompt: str = Field(..., min_length=1, max_length=1000, description="Image generation prompt")
    width: int = Field(1024, ge=256, le=2048, description="Image width in pixels")
    height: int = Field(1024, ge=256, le=2048, description="Image height in pixels")
    style: Optional[str] = Field("realistic", description="Image style (realistic, artistic, etc.)")
    negative_prompt: Optional[str] = Field(None, max_length=500, description="Negative prompt")
    steps: int = Field(30, ge=10, le=100, description="Number of generation steps")
    cfg_scale: float = Field(0.0, ge=0.0, le=20.0, description="CFG scale (0.0 for Turbo models, 1.0-20.0 for others)")
    seed: Optional[int] = Field(None, description="Random seed for reproducibility")


class ImageGenerationResponse(BaseModel):
    """Response model for image generation"""
    success: bool
    image_url: Optional[str] = None
    job_id: Optional[str] = None
    error: Optional[str] = None
    prompt: str
    width: int
    height: int
    generation_time: Optional[float] = None


def enhance_prompt_with_style(prompt: str, style: str) -> Tuple[str, str]:
    """
    Enhance prompt with style-specific keywords to strictly enforce the selected style.
    Also returns appropriate negative prompt to further enforce the style.
    
    Args:
        prompt: Original user prompt
        style: Style selection (realistic, artistic, cartoon, abstract)
        
    Returns:
        Tuple of (enhanced_prompt, negative_prompt)
    """
    style = style.lower().strip() if style else "realistic"
    
    # Strong style modifiers that strictly enforce each style
    style_modifiers = {
        "realistic": ", photorealistic, highly detailed, realistic photography, professional photography, 8k resolution, sharp focus, natural lighting, lifelike, true to life, authentic, real-world appearance, no stylization, no artistic effects",
        "artistic": ", artistic style, creative interpretation, painterly, artistic rendering, stylized art, artistic composition, creative design, artistic vision, unique artistic style, not photorealistic, artistic effects",
        "cartoon": ", cartoon style, animated, cartoon illustration, cartoon art style, vibrant cartoon colors, cartoon character design, animated style, cartoon animation style, not realistic, cartoon aesthetic",
        "abstract": ", abstract art, abstract composition, abstract design, non-representational, abstract artistic style, abstract visual art, abstract expressionism, abstract form, artistic abstraction, not realistic, abstract aesthetic"
    }
    
    # Negative prompts to prevent unwanted styles
    negative_prompts = {
        "realistic": "cartoon, animated, artistic style, stylized, abstract, painting, illustration, drawing, sketch, non-realistic, fantasy art, digital art",
        "artistic": "photorealistic, realistic photography, lifelike, true to life, real-world, authentic photography, documentary style, unedited photo",
        "cartoon": "photorealistic, realistic, lifelike, true to life, real-world, authentic photography, documentary style, unedited photo, abstract art",
        "abstract": "photorealistic, realistic, lifelike, true to life, real-world, authentic photography, cartoon, animated, illustration, representational"
    }
    
    # Safety-related negative prompt (always included)
    safety_negative_prompt = "nudity, explicit content, nsfw, adult content, inappropriate, offensive, violence, gore, hate speech"
    
    # Get the appropriate modifier and negative prompt
    modifier = style_modifiers.get(style, style_modifiers["realistic"])
    style_negative_prompt = negative_prompts.get(style, negative_prompts["realistic"])
    
    # Combine style negative prompt with safety negative prompt
    negative_prompt = f"{style_negative_prompt}, {safety_negative_prompt}"
    
    # Enhance the prompt by appending style modifiers
    enhanced_prompt = f"{prompt}{modifier}"
    
    logger.info(f"Enhanced prompt with style '{style}': {enhanced_prompt[:200]}...")
    logger.info(f"Using negative prompt for style '{style}': {negative_prompt}")
    
    return enhanced_prompt, negative_prompt


@router.post("/generate", response_model=ImageGenerationResponse)
async def generate_image(request: ImageGenerationRequest) -> ImageGenerationResponse:
    """
    Generate an image using HuggingFace Model API
    
    OPTIMIZED: Standalone image generation (media page) runs independently without waiting.
    This endpoint does NOT wait for article generation - images generate immediately for better UX.
    
    This endpoint integrates with the HuggingFace API service running on port 7860.
    The service supports various image generation models from HuggingFace.
    """
    # Standalone image generation (media page) - no resource lock needed
    # This allows images to generate immediately without waiting for articles
    try:
        start_time = time.time()
        
        # Get model ID from environment or use default
        model_id = os.getenv("HF_DEFAULT_IMAGE_MODEL", "Tongyi-MAI/Z-Image-Turbo")
        
        # Enhance prompt with style-specific modifiers to strictly enforce the style
        enhanced_prompt, style_negative_prompt = enhance_prompt_with_style(request.prompt, request.style)
        
        # Combine user negative prompt with style-specific negative prompt
        combined_negative_prompt = None
        if request.negative_prompt:
            combined_negative_prompt = f"{request.negative_prompt}, {style_negative_prompt}"
        else:
            combined_negative_prompt = style_negative_prompt
        
        # Call HuggingFace API service with enhanced prompt
        result = await hf_api_service.generate_image(
            prompt=enhanced_prompt,
            model_id=model_id,
            width=request.width,
            height=request.height,
            negative_prompt=combined_negative_prompt,
            num_inference_steps=request.steps,
            guidance_scale=request.cfg_scale,
            seed=request.seed
        )
        
        generation_time = time.time() - start_time
        
        if not result.get("success"):
            error_msg = result.get("error", "Unknown error")
            logger.error(f"Image generation failed: {error_msg}")
            raise HTTPException(
                status_code=503,
                detail=f"Image generation failed: {error_msg}"
            )
        
        # SAFETY CHECK: Verify generated image is safe using NSFW detection
        hf_image_url = result.get("download_url")
        if not hf_image_url:
            raise HTTPException(
                status_code=503,
                detail="Image generation succeeded but no download URL returned"
            )
        
        is_image_safe, image_safety_error, detection_results = await safety_service.check_image_safety(hf_image_url)
        if not is_image_safe:
            logger.warning(f"Unsafe image detected and blocked: {hf_image_url}")
            logger.warning(f"Detection results: {detection_results}")
            
            # Build detailed error message with detection scores
            error_detail = image_safety_error or "Generated image contains inappropriate content and cannot be displayed"
            if detection_results:
                scores = ", ".join([f"{k}: {v:.2%}" for k, v in detection_results.items()])
                error_detail += f" (Detection scores: {scores})"
            
            raise HTTPException(
                status_code=400,
                detail=error_detail
            )
        logger.info(f"Image safety check passed for: {hf_image_url}")
        
        # DOWNLOAD AND UPLOAD TO S3
        logger.info("Downloading image from HuggingFace and uploading to S3...")
        s3_result = await s3_service.upload_image_to_s3(
            image_url=hf_image_url,
            filename=None,  # Auto-generate filename
            content_type="image/png"
        )
        
        if not s3_result.get("success"):
            error_msg = s3_result.get("error", "Unknown S3 upload error")
            logger.error(f"Failed to upload image to S3: {error_msg}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save image to storage: {error_msg}"
            )
        
        # Use S3 public URL as the image_url
        s3_public_url = s3_result.get("public_url")
        s3_key = s3_result.get("s3_key")
        
        logger.info(f"Image successfully saved to S3: {s3_key}")
        
        # CLEANUP: Delete temporary file from HuggingFace server after successful S3 upload
        logger.info("Cleaning up temporary file from HuggingFace server...")
        await hf_api_service.delete_file(hf_image_url)
        
        return ImageGenerationResponse(
            success=True,
            image_url=s3_public_url,  # Return S3 URL instead of HuggingFace URL
            job_id=result.get("job_id"),
            error=None,
            prompt=enhanced_prompt,  # Return enhanced prompt for reference
            width=request.width,
            height=request.height,
            generation_time=generation_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Image generation failed: {str(e)}"
        )


@router.get("/health")
async def image_service_health():
    """Check if HuggingFace API service is available"""
    try:
        is_healthy = await hf_api_service.check_health()
        hf_api_url = os.getenv("HF_API_BASE_URL", "http://localhost:7860")
        
        return {
            "service": "image_generation",
            "configured": True,
            "service_type": "huggingface_api",
            "hf_api_url": hf_api_url,
            "available": is_healthy
        }
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "service": "image_generation",
            "configured": True,
            "service_type": "huggingface_api",
            "available": False,
            "error": str(e)
        }


@router.get("/diagnostics")
async def image_service_diagnostics():
    """Get detailed diagnostics for HuggingFace API connection"""
    import httpx
    from datetime import datetime
    
    hf_api_url = os.getenv("HF_API_BASE_URL", "http://localhost:7860")
    diagnostics = {
        "hf_api_url": hf_api_url,
        "environment_variable": os.getenv("HF_API_BASE_URL", "NOT SET (using default)"),
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Check 1: Health endpoint
    try:
        is_healthy = await hf_api_service.check_health()
        diagnostics["checks"]["health_endpoint"] = {
            "status": "healthy" if is_healthy else "unhealthy",
            "accessible": True
        }
    except httpx.ConnectError as e:
        diagnostics["checks"]["health_endpoint"] = {
            "status": "connection_error",
            "accessible": False,
            "error": str(e),
            "suggestion": f"Cannot connect to {hf_api_url}. Verify the service is running."
        }
    except httpx.ConnectTimeout as e:
        diagnostics["checks"]["health_endpoint"] = {
            "status": "timeout",
            "accessible": False,
            "error": str(e),
            "suggestion": f"Connection to {hf_api_url} timed out. Check network connectivity."
        }
    except Exception as e:
        diagnostics["checks"]["health_endpoint"] = {
            "status": "error",
            "accessible": False,
            "error": str(e),
            "error_type": type(e).__name__
        }
    
    # Check 2: Direct connection test
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{hf_api_url}/health")
            diagnostics["checks"]["direct_connection"] = {
                "status": "success",
                "status_code": response.status_code,
                "accessible": True
            }
    except httpx.ConnectError as e:
        diagnostics["checks"]["direct_connection"] = {
            "status": "connection_error",
            "accessible": False,
            "error": str(e),
            "suggestion": [
                f"Service at {hf_api_url} is not reachable",
                "Verify the HuggingFace API service is running",
                "Check if the port (default: 7860) is correct",
                "Verify firewall/security group settings allow connections"
            ]
        }
    except httpx.ConnectTimeout as e:
        diagnostics["checks"]["direct_connection"] = {
            "status": "timeout",
            "accessible": False,
            "error": str(e),
            "suggestion": [
                f"Connection to {hf_api_url} timed out",
                "Service may be overloaded or network is slow",
                "Check if service is responding to other requests"
            ]
        }
    except Exception as e:
        diagnostics["checks"]["direct_connection"] = {
            "status": "error",
            "accessible": False,
            "error": str(e),
            "error_type": type(e).__name__
        }
    
    # Summary
    all_accessible = all(
        check.get("accessible", False) 
        for check in diagnostics["checks"].values()
    )
    diagnostics["summary"] = {
        "service_available": all_accessible,
        "recommendation": "Service is healthy" if all_accessible else "Service is unavailable - check connection details above"
    }
    
    return diagnostics



