"""
AWS S3 Service
Handles uploading images to S3 after generation
"""

import os
import logging
import httpx
import boto3
from botocore.exceptions import ClientError, BotoCoreError
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

# Configuration from environment
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "vipplay-ai-content-storage")
S3_FOLDER_PREFIX = os.getenv("S3_FOLDER_PREFIX", "dev")


class S3Service:
    """Service for uploading files to AWS S3"""

    def __init__(self):
        """Initialize S3 client"""
        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
            logger.warning("AWS credentials not configured. S3 uploads will fail.")
            self.s3_client = None
        else:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                    region_name=AWS_REGION
                )
                logger.info(f"S3 client initialized for bucket: {S3_BUCKET_NAME}")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {str(e)}")
                self.s3_client = None

    async def download_image(self, image_url: str) -> Optional[bytes]:
        """
        Download image from URL
        
        Args:
            image_url: URL to download image from
            
        Returns:
            Image bytes or None if download fails
        """
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(image_url)
                response.raise_for_status()
                logger.info(f"Downloaded image from {image_url[:100]} ({len(response.content)} bytes)")
                return response.content
        except httpx.HTTPError as e:
            logger.error(f"Failed to download image from {image_url}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error downloading image: {str(e)}")
            return None

    def generate_s3_key(self, filename: Optional[str] = None, file_type: str = "image") -> str:
        """
        Generate S3 key (path) for file
        
        Args:
            filename: Optional custom filename
            file_type: Type of file (image, video, etc.)
            
        Returns:
            S3 key path
        """
        if not filename:
            timestamp = datetime.utcnow().strftime("%Y%m%d")
            unique_id = str(uuid.uuid4())[:8]
            filename = f"ai-{timestamp}-{unique_id}.png"
        
        # Format: {prefix}/{file_type}s/{filename}
        s3_key = f"{S3_FOLDER_PREFIX}/{file_type}s/{filename}"
        return s3_key

    async def upload_image_to_s3(
        self,
        image_url: str,
        filename: Optional[str] = None,
        content_type: str = "image/png",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Download image from URL and upload to S3
        
        Args:
            image_url: URL to download image from
            filename: Optional custom filename (auto-generated if not provided)
            content_type: MIME type of the image
            metadata: Optional metadata to attach to S3 object
            
        Returns:
            Dict with:
                - success: Boolean
                - s3_key: S3 key/path if successful
                - s3_url: Full S3 URL if successful
                - error: Error message if failed
                - size: File size in bytes if successful
        """
        if not self.s3_client:
            return {
                "success": False,
                "error": "S3 client not initialized. Check AWS credentials."
            }

        try:
            # Step 1: Download image from URL
            logger.info(f"Downloading image from {image_url[:100]}...")
            image_data = await self.download_image(image_url)
            
            if not image_data:
                return {
                    "success": False,
                    "error": "Failed to download image from URL"
                }

            # Step 2: Generate S3 key
            s3_key = self.generate_s3_key(filename, file_type="image")
            
            # Step 3: Upload to S3
            logger.info(f"Uploading to S3: {s3_key} ({len(image_data)} bytes)")
            
            upload_metadata = metadata or {}
            upload_metadata["source"] = "ai_generated"
            upload_metadata["original_url"] = image_url
            
            # Upload to S3
            # Note: For public URLs to work, the bucket must have a bucket policy
            # that allows public read access. ACLs are disabled on this bucket.
            self.s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key,
                Body=image_data,
                ContentType=content_type,
                Metadata=upload_metadata
            )
            
            # Generate S3 URL
            s3_url = f"s3://{S3_BUCKET_NAME}/{s3_key}"
            
            # Also generate public URL using actual bucket region
            bucket_region = self._get_bucket_region()
            public_url = f"https://{S3_BUCKET_NAME}.s3.{bucket_region}.amazonaws.com/{s3_key}"
            
            logger.info(f"Successfully uploaded to S3: {s3_key}")
            
            return {
                "success": True,
                "s3_key": s3_key,
                "s3_url": s3_url,
                "public_url": public_url,
                "size": len(image_data),
                "content_type": content_type
            }
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            logger.error(f"S3 upload error ({error_code}): {error_msg}")
            return {
                "success": False,
                "error": f"S3 upload failed: {error_code} - {error_msg}"
            }
        except BotoCoreError as e:
            logger.error(f"Boto3 error uploading to S3: {str(e)}")
            return {
                "success": False,
                "error": f"S3 upload failed: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error uploading to S3: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }

    def get_public_url(self, s3_key: str) -> str:
        """
        Generate public URL for S3 object
        
        Args:
            s3_key: S3 key/path
            
        Returns:
            Public HTTPS URL
        """
        # Get actual bucket region to avoid redirects
        bucket_region = self._get_bucket_region()
        return f"https://{S3_BUCKET_NAME}.s3.{bucket_region}.amazonaws.com/{s3_key}"
    
    def _get_bucket_region(self) -> str:
        """
        Get the actual region of the S3 bucket
        
        Returns:
            Bucket region string, falls back to AWS_REGION if unable to determine
        """
        if not self.s3_client:
            return AWS_REGION
        
        try:
            response = self.s3_client.get_bucket_location(Bucket=S3_BUCKET_NAME)
            region = response.get('LocationConstraint', 'us-east-1')
            # us-east-1 returns None, so handle that
            if region is None:
                region = 'us-east-1'
            return region
        except Exception as e:
            logger.warning(f"Could not determine bucket region, using configured region: {str(e)}")
            return AWS_REGION


# Singleton instance
s3_service = S3Service()

