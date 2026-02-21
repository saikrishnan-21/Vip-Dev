"""
Image Generation Service
Simple service that generates images for articles using Ollama prompts and HuggingFace API
"""

import re
import logging
import asyncio
from typing import List, Dict, Any
from services.hf_api_service import hf_api_service
from services.safety_service import safety_service
from services.s3_service import s3_service

logger = logging.getLogger(__name__)


async def generate_image_prompts_from_article(
    article_content: str,
    image_count: int = 2,
    image_style: str = "auto"
) -> List[str]:
    """
    Generate image prompts from article content using Ollama.
    
    Args:
        article_content: The article text
        image_count: Number of prompts to generate (1-2)
        image_style: Style hint (photo, illustration, infographic, auto)
        
    Returns:
        List of image prompt strings
    """
    from services.ollama_service import ollama_service
    
    # Simple prompt to Ollama
    prompt = f"""Based on this article, create exactly {image_count} image generation prompts. 
Each prompt should be detailed (30-60 words) and describe a unique scene from the article.

**IMPORTANT - US CONTEXT:**
- All content should be focused on US sports, US teams, US players, and US sports culture
- Use US-specific terminology (e.g., "football" refers to American football, not soccer)
- Reference US leagues (NFL, NBA, MLB, NHL, NCAA, etc.)
- Use US sports venues, stadiums, and cultural references
- Ensure all imagery reflects US sports culture and context

**CRITICAL - CONTENT APPROPRIATENESS:**
- All prompts MUST be completely appropriate, professional, and family-friendly
- NO sexual content, suggestive imagery, or inappropriate themes
- NO nudity, explicit content, or adult themes
- Focus on sports action, statistics, team dynamics, and athletic performance
- Keep all descriptions clean, professional, and suitable for all audiences
- Emphasize sportsmanship, athleticism, and sports culture
- Use respectful and professional language only

Article:
{article_content[:2000]}

IMPORTANT: Output exactly {image_count} prompts, one per line. 
- Each line should be a complete, detailed image description
- Do NOT use numbering (1., 2., etc.)
- Do NOT use bullet points (-, *, etc.)
- Do NOT add explanations or labels
- Just write the prompt descriptions, one per line
- Each prompt should be at least 30 words long
- All prompts must be appropriate, professional, unsexual, and suitable for a US sports audience

Example format:
A professional American football player in action during a high-intensity NFL game, showcasing athletic movement and skill
A detailed infographic showing statistics and data visualizations about US sports performance metrics

Now generate {image_count} prompts for this article:"""

    try:
        result = await ollama_service.generate(
            prompt=prompt,
            temperature=0.8
        )
        
        if result.get("success") and result.get("content"):
            # Simple parsing - split by newlines and clean
            content = result["content"].strip()
            
            # Log the raw response for debugging
            logger.debug(f"Ollama raw response (first 500 chars): {content[:500]}")
            
            lines = content.split('\n')
            
            prompts = []
            for line in lines:
                line = line.strip()
                
                # Skip empty lines
                if not line:
                    continue
                
                # Remove common prefixes and numbering patterns
                # Remove numbered prefixes like "1.", "1)", "- ", "* ", etc.
                line = re.sub(r'^\d+[\.\)]\s*', '', line)  # Remove "1.", "1)", etc.
                line = re.sub(r'^[-*•]\s+', '', line)  # Remove "- ", "* ", "• "
                line = re.sub(r'^Prompt\s*\d*[:\-]\s*', '', line, flags=re.IGNORECASE)  # Remove "Prompt 1:", etc.
                
                # Clean quotes
                line = line.strip('"\'`').strip()
                
                # More lenient length check - accept lines with at least 15 characters
                # This helps catch prompts that might be slightly shorter but still valid
                if len(line) >= 15:
                    prompts.append(line)
                    if len(prompts) >= image_count:
                        break
            
            # If we didn't get enough prompts, try alternative parsing
            if len(prompts) < image_count:
                logger.warning(f"Only extracted {len(prompts)} prompts, trying alternative parsing...")
                
                # Try splitting by double newlines or common separators
                alternative_content = content
                # Remove markdown code blocks if present
                alternative_content = re.sub(r'```[^`]*```', '', alternative_content, flags=re.DOTALL)
                
                # Try to find prompts separated by blank lines or common patterns
                segments = re.split(r'\n\s*\n+', alternative_content)
                for segment in segments:
                    segment = segment.strip()
                    # Remove numbering and prefixes
                    segment = re.sub(r'^\d+[\.\)]\s*', '', segment)
                    segment = re.sub(r'^[-*•]\s+', '', segment)
                    segment = segment.strip('"\'`').strip()
                    
                    if len(segment) >= 15 and segment not in prompts:
                        prompts.append(segment)
                        if len(prompts) >= image_count:
                            break
            
            # Final fallback: if still not enough, use the entire content split by sentences
            if len(prompts) < image_count and content:
                logger.warning(f"Still only have {len(prompts)} prompts, using fallback parsing...")
                # Split by periods and try to create prompts from longer sentences
                sentences = re.split(r'[.!?]\s+', content)
                for sentence in sentences:
                    sentence = sentence.strip()
                    sentence = re.sub(r'^\d+[\.\)]\s*', '', sentence)
                    sentence = sentence.strip('"\'`').strip()
                    if len(sentence) >= 30 and sentence not in prompts:
                        prompts.append(sentence)
                        if len(prompts) >= image_count:
                            break
            
            logger.info(f"Generated {len(prompts)} image prompts from Ollama (requested: {image_count})")
            
            # Log the prompts for debugging
            if prompts:
                for i, p in enumerate(prompts, 1):
                    logger.debug(f"Prompt {i} (first 100 chars): {p[:100]}")
            else:
                logger.error(f"No prompts extracted. Raw content was: {content[:200]}")
            
            return prompts
        else:
            error_msg = result.get('error', 'Unknown error')
            logger.warning(f"Ollama prompt generation failed: {error_msg}")
            return []
            
    except Exception as e:
        logger.error(f"Error generating image prompts: {str(e)}", exc_info=True)
        return []


class ImageGenerationService:
    """Service for generating and embedding images in articles"""

    def __init__(self):
        self.hf_service = hf_api_service

    async def generate_and_embed_images(
        self,
        article_content: str,
        image_count: int = 2,
        image_style: str = "auto",
        width: int = 1024,
        height: int = 1024,
        topic: str = ""
    ) -> Dict[str, Any]:
        """
        Generate images for article and embed them at strategic positions.
        
        IMPORTANT: This method waits for article generation to complete before proceeding.
        Image generation (both article images and standalone media page) must wait 
        for article generation to finish.

        Args:
            article_content: The article text
            image_count: Number of images to generate (1-2)
            image_style: Style preset (auto, photo, illustration, infographic)
            width: Image width in pixels
            height: Image height in pixels
            topic: Article topic (unused, kept for compatibility)

        Returns:
            Dict with:
                - content: Article with embedded images
                - images: List of generated image metadata
                - success: Boolean
                - message: Status message
        """
        from services.resource_lock import resource_lock
        
        # Wait for article generation to complete before generating images
        async with resource_lock.image_generation():
            return await self._generate_and_embed_images_internal(
                article_content, image_count, image_style, width, height, topic
            )
    
    async def _generate_and_embed_images_internal(
        self,
        article_content: str,
        image_count: int = 2,
        image_style: str = "auto",
        width: int = 1024,
        height: int = 1024,
        topic: str = ""
    ) -> Dict[str, Any]:
        """
        Internal method for generating images (called after lock is acquired).
        """
        try:
            if image_count <= 0:
                return {
                    "success": True,
                    "content": article_content,
                    "images": [],
                    "message": "No images requested"
                }
            
            # Limit to max 2 images
            image_count = min(image_count, 2)
            
            # Step 1: Get prompts from Ollama
            logger.info(f"[ImageGeneration] Starting - image_count: {image_count}, content_length: {len(article_content)}")
            logger.info(f"Generating {image_count} image prompts using Ollama...")
            prompts = await generate_image_prompts_from_article(
                article_content=article_content,
                image_count=image_count,
                image_style=image_style
            )
            
            logger.info(f"[ImageGeneration] Generated {len(prompts)} prompts: {[p[:50] for p in prompts]}")
            
            if not prompts:
                logger.error("[ImageGeneration] No prompts generated - returning original content")
                return {
                    "success": False,
                    "content": article_content,
                    "images": [],
                    "message": "Failed to generate image prompts"
                }
            
            # Limit to requested count
            prompts = prompts[:image_count]
            
            # Step 2: Add style modifiers
            style_modifier = {
                "photo": ", professional photography, high quality, realistic",
                "illustration": ", digital illustration, vibrant colors, modern style",
                "infographic": ", infographic design, clean layout, professional",
                "cartoon": ", cartoon style, animated, colorful, playful",
                "realistic": ", photorealistic, highly detailed, realistic, professional photography",
                "auto": ", high quality, professional, detailed"
            }.get(image_style, ", high quality, professional")
            
            enhanced_prompts = [f"{p}{style_modifier}" for p in prompts]

            # Step 3: Generate images
            logger.info(f"[ImageGeneration] Generating {len(enhanced_prompts)} images using HuggingFace API...")
            image_results = await self._generate_images_batch(
                enhanced_prompts,
                width=width,
                height=height
            )
            
            successful_count = len([r for r in image_results if r.get('success')])
            logger.info(f"[ImageGeneration] Generated {successful_count}/{len(image_results)} images successfully")
            for i, result in enumerate(image_results, 1):
                if result.get('success'):
                    logger.info(f"[ImageGeneration] Image {i} URL: {result.get('url', 'N/A')[:100]}")
                else:
                    logger.error(f"[ImageGeneration] Image {i} failed: {result.get('error', 'Unknown error')}")

            # Step 4: Safety check - verify generated images are safe using NSFW detection
            safe_image_results = []
            for i, result in enumerate(image_results):
                if result.get("success") and result.get("url"):
                    image_url = result["url"]
                    is_safe, error_msg, detection_results = await safety_service.check_image_safety(image_url)
                    if is_safe:
                        safe_image_results.append(result)
                        logger.info(f"Image {i+1} passed safety check")
                    else:
                        logger.warning(f"Unsafe image {i+1} blocked: {error_msg}")
                        logger.debug(f"Detection results: {detection_results}")
                        # Replace with failed result
                        safe_image_results.append({
                            "success": False,
                            "error": f"Image blocked by safety check: {error_msg}"
                        })
                else:
                    safe_image_results.append(result)
            
            image_results = safe_image_results
            
            # Step 5: Place images in article
            final_content = self._embed_images_at_positions(
                article_content,
                prompts,
                image_results
            )

            # Verify images are in the final content
            import re
            images_in_final = len(re.findall(r'!\[.*?\]\(.*?\)', final_content))
            logger.info(f"Content verification: {images_in_final} images found in final content (expected: {len([r for r in image_results if r.get('success')])})")

            # Collect metadata
            images_metadata = []
            for i, (prompt, result) in enumerate(zip(prompts, image_results)):
                if result.get("success") and result.get("url"):
                    images_metadata.append({
                        "index": i + 1,
                        "prompt": prompt,
                        "url": result["url"],
                        "generation_time": result.get("generation_time"),
                        "alt_text": self._generate_alt_text(prompt)
                    })
                    logger.info(f"Image {i+1} metadata: URL={result['url'][:100]}")
                else:
                    logger.error(f"Image {i+1} generation failed: {result.get('error', 'Unknown error')}")

            success_count = len([r for r in image_results if r.get("success")])
            message = f"Generated {success_count}/{len(prompts)} images successfully"
            
            if success_count > 0 and images_in_final == 0:
                logger.error("CRITICAL: Images were generated but not embedded in content!")
                message += " (WARNING: Images may not be visible in content)"

            return {
                "success": True,
                "content": final_content,
                "images": images_metadata,
                "message": message
            }

        except Exception as e:
            logger.error(f"Image generation error: {str(e)}")
            return {
                "success": False,
                "content": article_content,
                "images": [],
                "message": f"Image generation failed: {str(e)}"
            }

    async def _generate_images_batch(
        self,
        prompts: List[str],
        width: int = 1024,
        height: int = 1024
    ) -> List[Dict[str, Any]]:
        """
        Generate multiple images concurrently.

        Returns list of dicts with:
            - success: Boolean
            - url: Image URL if successful
            - error: Error message if failed
            - generation_time: Time taken in seconds
        """
        tasks = [
            self._generate_single_image(prompt, width, height)
            for prompt in prompts
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Convert exceptions to error dicts
        processed_results = []
        for result in results:
            if isinstance(result, Exception):
                processed_results.append({
                    "success": False,
                    "error": str(result)
                })
            else:
                processed_results.append(result)

        return processed_results

    async def _generate_single_image(
        self,
        prompt: str,
        width: int,
        height: int
    ) -> Dict[str, Any]:
        """Generate a single image using HuggingFace API and upload to S3"""
        try:
            result = await self.hf_service.generate_image(
                prompt=prompt,
                width=width,
                height=height,
                num_inference_steps=9,  # Balance quality vs speed
                guidance_scale=0.0  # Turbo models require guidance_scale=0.0
            )

            if result.get("success"):
                hf_download_url = result.get("download_url")
                if not hf_download_url:
                    logger.error(f"Image generation returned success but no download_url. Result: {result}")
                    return {
                        "success": False,
                        "error": "Image generated but no URL returned"
                    }
                logger.info(f"Image generated successfully: URL={hf_download_url[:100]}")
                
                # Upload to S3
                from services.s3_service import s3_service
                logger.info("Uploading image to S3...")
                s3_result = await s3_service.upload_image_to_s3(
                    image_url=hf_download_url,
                    filename=None,  # Auto-generate filename
                    content_type="image/png"
                )
                
                if not s3_result.get("success"):
                    error_msg = s3_result.get("error", "Unknown S3 upload error")
                    logger.error(f"Failed to upload image to S3: {error_msg}")
                    return {
                        "success": False,
                        "error": f"Failed to save image to storage: {error_msg}"
                    }
                
                # Use S3 public URL
                s3_public_url = s3_result.get("public_url")
                s3_key = s3_result.get("s3_key")
                logger.info(f"Image successfully saved to S3: {s3_key}")
                
                # CLEANUP: Delete temporary file from HuggingFace server after successful S3 upload
                logger.info("Cleaning up temporary file from HuggingFace server...")
                from services.hf_api_service import hf_api_service
                await hf_api_service.delete_file(hf_download_url)
                
                return {
                    "success": True,
                    "url": s3_public_url,  # Return S3 URL instead of HuggingFace URL
                    "generation_time": result.get("generation_time")
                }
            else:
                error_msg = result.get("error", "Unknown error")
                logger.error(f"Image generation failed: {error_msg}")
                return {
                    "success": False,
                    "error": error_msg
                }

        except Exception as e:
            logger.error(f"Single image generation error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def _generate_alt_text(self, prompt: str) -> str:
        """Generate simple alt text from prompt."""
        # Take first 8 words, remove common style words
        words = prompt.split()[:8]
        clean_words = [w for w in words if w.lower() not in ["professional", "high", "quality", "detailed"]]
        return " ".join(clean_words) if clean_words else "Article image"

    def _embed_images_at_positions(
        self,
        content: str,
        prompts: List[str],
        results: List[Dict[str, Any]]
    ) -> str:
        """
        Place images in the article after headings or paragraphs.
        
        Args:
            content: Original article content
            prompts: List of prompt strings
            results: List of generation result dicts
            
        Returns:
            Article content with embedded images
        """
        # Remove any existing [IMAGE_PROMPT] tags
        cleaned_content = re.sub(r'\[IMAGE[_\s]PROMPT:[^\]]+\]', '', content, flags=re.IGNORECASE)
        
        # Collect successful images
        successful_images = []
        for i, (prompt, result) in enumerate(zip(prompts, results)):
            if result.get("success"):
                image_url = result.get("url")
                if not image_url:
                    logger.error(f"Image {i+1} marked as success but has no URL. Result: {result}")
                    continue
                if not isinstance(image_url, str) or len(image_url.strip()) == 0:
                    logger.error(f"Image {i+1} has invalid URL: {image_url}")
                    continue
                alt_text = self._generate_alt_text(prompt)
                # Use proper markdown image syntax
                image_markdown = f'\n\n![{alt_text}]({image_url})\n\n'
                successful_images.append(image_markdown)
                logger.info(f"Prepared image {i+1} markdown: URL={image_url[:100]}, Alt={alt_text[:50]}")
            else:
                logger.warning(f"Image {i+1} generation failed: {result.get('error', 'Unknown error')}")
        
        if not successful_images:
            logger.warning("No successful images to embed")
            return cleaned_content
        
        logger.info(f"Attempting to embed {len(successful_images)} images into content")
        
        try:
            # Find positions: after ## headings or after paragraphs
            lines = cleaned_content.split('\n')
            insertion_points = []
            
            # Strategy 1: Find H2 headings (##)
            for i, line in enumerate(lines):
                if line.strip().startswith('## '):
                    # Find the end of the paragraph after this heading
                    para_end = i + 1
                    for j in range(i + 1, min(i + 10, len(lines))):
                        if lines[j].strip() and not lines[j].strip().startswith('#'):
                            # Found content line, check if next is blank
                            if j + 1 < len(lines) and not lines[j + 1].strip():
                                para_end = j + 1
                                break
                            elif j + 1 >= len(lines):
                                para_end = j + 1
                                break
                    if para_end not in insertion_points:
                        insertion_points.append(para_end)
                    if len(insertion_points) >= len(successful_images):
                        break
            
            # Strategy 2: If not enough headings, find paragraph breaks
            if len(insertion_points) < len(successful_images):
                # Find paragraph breaks (blank lines after content)
                for i in range(len(lines) - 1, -1, -1):
                    if lines[i].strip() and not lines[i].strip().startswith('#'):
                        # Found content line, check if next is blank
                        if i + 1 < len(lines) and not lines[i + 1].strip():
                            if (i + 1) not in insertion_points:
                                insertion_points.append(i + 1)
                            if len(insertion_points) >= len(successful_images):
                                break
                
                # Strategy 3: If still not enough, space them evenly
                if len(insertion_points) < len(successful_images):
                    total_lines = len(lines)
                    spacing = max(total_lines // (len(successful_images) + 1), 10)
                    for i in range(1, len(successful_images) + 1):
                        pos = min(i * spacing, total_lines - 1)
                        if pos not in insertion_points:
                            insertion_points.append(pos)
            
            # Limit to number of images and sort
            insertion_points = sorted(insertion_points[:len(successful_images)])
            
            logger.info(f"Found {len(insertion_points)} insertion points: {insertion_points}")
            
            # Insert images (reverse order to maintain positions)
            for idx, pos in enumerate(reversed(insertion_points)):
                image_idx = len(successful_images) - 1 - idx
                image_markdown = successful_images[image_idx]
                # Insert the entire image markdown block
                lines.insert(pos + 1, image_markdown.strip())
            
            result_content = '\n'.join(lines)
            
            # Verify images are in the content
            image_count_in_content = len(re.findall(r'!\[.*?\]\(.*?\)', result_content))
            logger.info(f"Embedded images: {len(successful_images)} prepared, {image_count_in_content} found in final content")
            
            if image_count_in_content == 0:
                logger.error("CRITICAL: Images were prepared but not found in final content! Appending at end as fallback.")
                # Fallback: append images at the end
                result_content = cleaned_content + '\n\n' + '\n\n'.join([img.strip() for img in successful_images])
            
            return result_content
            
        except Exception as e:
            logger.error(f"Error embedding images: {str(e)}", exc_info=True)
            # Fallback: append images at the end
            logger.warning("Falling back to appending images at end of content")
            return cleaned_content + '\n\n' + '\n\n'.join([img.strip() for img in successful_images])


# Singleton instance
image_generation_service = ImageGenerationService()

