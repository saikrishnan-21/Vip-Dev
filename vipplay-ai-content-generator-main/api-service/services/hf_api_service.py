"""
HuggingFace API Service
Integration with HuggingFace Model API for image and video generation
"""

import httpx
import os
import logging
from typing import Optional, Dict, Any
from urllib.parse import urljoin

logger = logging.getLogger(__name__)

# Configuration
HF_API_BASE_URL = os.getenv("HF_API_BASE_URL", "http://44.197.16.15:7860")
HF_DEFAULT_IMAGE_MODEL = os.getenv("HF_DEFAULT_IMAGE_MODEL", "Tongyi-MAI/Z-Image-Turbo")
HF_DEFAULT_VIDEO_MODEL = os.getenv("HF_DEFAULT_VIDEO_MODEL", "Wan-AI/Wan2.2-TI2V-5B")
HF_DEFAULT_INFERENCE_STEPS = int(os.getenv("HF_DEFAULT_INFERENCE_STEPS", "9"))
HF_DEFAULT_GUIDANCE_SCALE = float(os.getenv("HF_DEFAULT_GUIDANCE_SCALE", "0.0"))
HF_DEFAULT_VIDEO_FRAMES = int(os.getenv("HF_DEFAULT_VIDEO_FRAMES", "14"))


class HuggingFaceAPIService:
    """Service for interacting with HuggingFace Model API"""

    def __init__(self, base_url: str = HF_API_BASE_URL):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(
            timeout=1800.0,  # 30 minutes for generation (increased for slow models)
            base_url=base_url
        )

    async def check_health(self) -> bool:
        """
        Check if HuggingFace API service is available
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            response = await self.client.get("/health")
            if response.status_code == 200:
                data = response.json()
                return data.get("status") == "healthy"
            return False
        except httpx.ConnectError as e:
            logger.warning(
                f"HuggingFace API health check failed - Connection error: {str(e)}\n"
                f"  Service URL: {self.base_url}\n"
                f"  Service may not be running or accessible"
            )
            return False
        except httpx.ConnectTimeout as e:
            logger.warning(
                f"HuggingFace API health check failed - Connection timeout: {str(e)}\n"
                f"  Service URL: {self.base_url}"
            )
            return False
        except Exception as e:
            error_type = type(e).__name__
            logger.warning(
                f"HuggingFace API health check failed ({error_type}): {str(e)}\n"
                f"  Service URL: {self.base_url}"
            )
            return False

    async def generate_image(
        self,
        prompt: str,
        model_id: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = HF_DEFAULT_INFERENCE_STEPS,
        guidance_scale: float = HF_DEFAULT_GUIDANCE_SCALE,
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate an image using HuggingFace API
        
        Args:
            prompt: Image generation prompt
            model_id: HuggingFace model ID (defaults to HF_DEFAULT_IMAGE_MODEL)
            width: Image width in pixels
            height: Image height in pixels
            negative_prompt: Negative prompt
            num_inference_steps: Number of inference steps
            guidance_scale: Guidance scale (CFG)
            seed: Random seed for reproducibility
            
        Returns:
            Generation result with job_id, download_url, etc.
        """
        try:
            model_id = model_id or HF_DEFAULT_IMAGE_MODEL
            
            request_data = {
                "model_id": model_id,
                "prompt": prompt,
                "width": width,
                "height": height,
                "num_inference_steps": num_inference_steps,
                "guidance_scale": guidance_scale,
                "model_type": "image"
            }
            
            if negative_prompt:
                request_data["negative_prompt"] = negative_prompt
            if seed is not None:
                request_data["seed"] = seed
            
            response = await self.client.post("/generate", json=request_data)
            response.raise_for_status()
            
            result = response.json()
            
            # Build full download URL
            if result.get("download_url"):
                download_url = urljoin(self.base_url, result["download_url"])
            else:
                download_url = urljoin(self.base_url, f"/download/{result.get('file', '').split('/')[-1]}")
            
            return {
                "success": True,
                "job_id": result.get("job_id"),
                "type": result.get("type", "image"),
                "download_url": download_url,
                "file": result.get("file")
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HuggingFace API HTTP error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"HTTP {e.response.status_code}: {e.response.text[:200]}"
            }
        except httpx.ConnectError as e:
            logger.error(
                f"HuggingFace API connection error: {str(e)}\n"
                f"  Attempted URL: {self.base_url}/generate\n"
                f"  Check if HuggingFace API service is running on {self.base_url}\n"
                f"  Verify HF_API_BASE_URL environment variable is correct"
            )
            return {
                "success": False,
                "error": f"Connection failed: Cannot reach HuggingFace API at {self.base_url}. Service may be down or unreachable."
            }
        except httpx.ConnectTimeout as e:
            logger.error(
                f"HuggingFace API connection timeout: {str(e)}\n"
                f"  Attempted URL: {self.base_url}/generate\n"
                f"  Timeout: {self.client.timeout}s"
            )
            return {
                "success": False,
                "error": f"Connection timeout: HuggingFace API at {self.base_url} did not respond within timeout period."
            }
        except httpx.TimeoutException as e:
            logger.error(f"HuggingFace API request timeout: {str(e)}")
            return {
                "success": False,
                "error": f"Request timeout: HuggingFace API took too long to respond."
            }
        except Exception as e:
            error_type = type(e).__name__
            logger.error(
                f"HuggingFace image generation error ({error_type}): {str(e)}\n"
                f"  Attempted URL: {self.base_url}/generate\n"
                f"  Error details: {repr(e)}"
            )
            return {
                "success": False,
                "error": f"{error_type}: {str(e)}"
            }

    async def generate_video(
        self,
        prompt: str,
        model_id: Optional[str] = None,
        width: Optional[int] = None,
        height: Optional[int] = None,
        negative_prompt: Optional[str] = None,
        num_inference_steps: int = HF_DEFAULT_INFERENCE_STEPS,
        guidance_scale: Optional[float] = None,
        num_frames: Optional[int] = None,
        seed: Optional[int] = None,
        image: Optional[str] = None  # For I2V (image-to-video)
    ) -> Dict[str, Any]:
        """
        Generate a video using HuggingFace API
        
        Args:
            prompt: Video generation prompt
            model_id: HuggingFace model ID (defaults to HF_DEFAULT_VIDEO_MODEL)
            width: Video width in pixels (optional, model-specific defaults)
            height: Video height in pixels (optional, model-specific defaults)
            negative_prompt: Negative prompt
            num_inference_steps: Number of inference steps
            guidance_scale: Guidance scale (optional, model-specific defaults)
            num_frames: Number of video frames (optional, model-specific defaults)
            seed: Random seed for reproducibility
            image: Optional image URL or base64 for I2V models
            
        Returns:
            Generation result with job_id, download_url, etc.
        """
        try:
            model_id = model_id or HF_DEFAULT_VIDEO_MODEL
            
            request_data = {
                "model_id": model_id,
                "prompt": prompt,
                "num_inference_steps": num_inference_steps,
                "model_type": "video"
            }
            
            if width is not None:
                request_data["width"] = width
            if height is not None:
                request_data["height"] = height
            if negative_prompt:
                request_data["negative_prompt"] = negative_prompt
            if guidance_scale is not None:
                request_data["guidance_scale"] = guidance_scale
            if num_frames is not None:
                request_data["num_frames"] = num_frames
            if seed is not None:
                request_data["seed"] = seed
            if image:
                request_data["image"] = image
            
            response = await self.client.post("/generate", json=request_data)
            response.raise_for_status()
            
            result = response.json()
            
            # Build full download URL
            if result.get("download_url"):
                download_url = urljoin(self.base_url, result["download_url"])
            else:
                download_url = urljoin(self.base_url, f"/download/{result.get('file', '').split('/')[-1]}")
            
            return {
                "success": True,
                "job_id": result.get("job_id"),
                "type": result.get("type", "video"),
                "download_url": download_url,
                "file": result.get("file")
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HuggingFace API HTTP error: {e.response.status_code} - {e.response.text}")
            return {
                "success": False,
                "error": f"HTTP {e.response.status_code}: {e.response.text[:200]}"
            }
        except httpx.ConnectError as e:
            logger.error(
                f"HuggingFace API connection error: {str(e)}\n"
                f"  Attempted URL: {self.base_url}/generate\n"
                f"  Check if HuggingFace API service is running on {self.base_url}\n"
                f"  Verify HF_API_BASE_URL environment variable is correct"
            )
            return {
                "success": False,
                "error": f"Connection failed: Cannot reach HuggingFace API at {self.base_url}. Service may be down or unreachable."
            }
        except httpx.ConnectTimeout as e:
            logger.error(
                f"HuggingFace API connection timeout: {str(e)}\n"
                f"  Attempted URL: {self.base_url}/generate\n"
                f"  Timeout: {self.client.timeout}s"
            )
            return {
                "success": False,
                "error": f"Connection timeout: HuggingFace API at {self.base_url} did not respond within timeout period."
            }
        except httpx.TimeoutException as e:
            logger.error(f"HuggingFace API request timeout: {str(e)}")
            return {
                "success": False,
                "error": f"Request timeout: HuggingFace API took too long to respond."
            }
        except Exception as e:
            error_type = type(e).__name__
            logger.error(
                f"HuggingFace video generation error ({error_type}): {str(e)}\n"
                f"  Attempted URL: {self.base_url}/generate\n"
                f"  Error details: {repr(e)}"
            )
            return {
                "success": False,
                "error": f"{error_type}: {str(e)}"
            }

    async def check_model(self, model_id: str) -> Dict[str, Any]:
        """
        Check if a model is compatible with the API
        
        Args:
            model_id: HuggingFace model ID
            
        Returns:
            Model compatibility information
        """
        try:
            # URL encode the model_id for path parameter
            encoded_model_id = model_id.replace("/", "%2F")
            response = await self.client.get(f"/check-model/{encoded_model_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Model check error: {str(e)}")
            return {
                "model_id": model_id,
                "compatible": False,
                "error": str(e)
            }

    async def list_cached_models(self) -> Dict[str, Any]:
        """
        List currently cached models in the API
        
        Returns:
            List of cached models
        """
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"List models error: {str(e)}")
            return {
                "cached_models": [],
                "count": 0,
                "error": str(e)
            }

    async def delete_file(self, download_url: str) -> bool:
        """
        Delete a temporary file from HuggingFace server after it's been uploaded to S3
        
        Args:
            download_url: Full download URL from HuggingFace server
                          Format: http://server:port/download/{file_id}.png
            
        Returns:
            True if file was deleted successfully, False otherwise
        """
        try:
            # Extract file identifier from URL
            # URL format: http://44.197.16.15:7860/download/{file_id}.png
            from urllib.parse import urlparse
            parsed_url = urlparse(download_url)
            file_path = parsed_url.path  # e.g., /download/abc123.png
            
            if not file_path.startswith('/download/'):
                logger.warning(f"Invalid download URL format: {download_url}")
                return False
            
            # Extract filename/file_id
            file_id = file_path.replace('/download/', '')
            
            if not file_id:
                logger.warning(f"Could not extract file ID from URL: {download_url}")
                return False
            
            # Try to delete the file
            # Common endpoints: /delete/{file_id} or /cleanup/{file_id} or DELETE /download/{file_id}
            try:
                # Try DELETE method on the download endpoint
                response = await self.client.delete(f"/download/{file_id}")
                if response.status_code in [200, 204]:
                    logger.info(f"Successfully deleted temporary file from HuggingFace server: {file_id}")
                    return True
            except httpx.HTTPStatusError:
                # If DELETE doesn't work, try cleanup endpoint
                pass
            
            # Try cleanup endpoint if DELETE didn't work
            try:
                response = await self.client.post(f"/cleanup/{file_id}")
                if response.status_code in [200, 204]:
                    logger.info(f"Successfully cleaned up temporary file from HuggingFace server: {file_id}")
                    return True
            except httpx.HTTPStatusError:
                pass
            
            # If both fail, log warning but don't fail the operation
            logger.warning(
                f"Could not delete temporary file from HuggingFace server: {file_id}\n"
                f"  URL: {download_url}\n"
                f"  File may need manual cleanup on server"
            )
            return False
            
        except Exception as e:
            logger.warning(
                f"Error attempting to delete file from HuggingFace server: {str(e)}\n"
                f"  URL: {download_url}\n"
                f"  This is non-critical - file may need manual cleanup"
            )
            return False

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Singleton instance
hf_api_service = HuggingFaceAPIService()

