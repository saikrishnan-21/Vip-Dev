"""
Content Generation API Router
Handles all content generation requests

ARCHITECTURE NOTE:
- FastAPI is stateless - does NOT store job data
- All job storage handled by Next.js in MongoDB
- FastAPI only processes AI operations and returns results
- Job management endpoints removed (handled by Next.js)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/generation", tags=["generation"])


class TopicGenerationRequest(BaseModel):
    topic: str
    word_count: int = 1200  # Reduced from 1500 for faster generation
    tone: str = "Professional"
    keywords: Optional[List[str]] = None
    seo_optimization: bool = False  # Disabled by default for faster generation
    use_web_search: bool = False  # Enable FirecrawlSearchTool for real-time web research (disabled by default for faster generation)
    content_structure: str = "auto"  # auto, listicle, how-to-guide, analysis
    include_images: bool = False
    image_count: int = 0
    image_style: str = "auto"  # auto, photo, illustration, infographic


class KeywordsGenerationRequest(BaseModel):
    keywords: List[str]
    word_count: int = 1200  # Reduced from 1500 for faster generation
    tone: str = "Professional"
    seo_optimization: bool = False  # Disabled by default for faster generation
    use_web_search: bool = False  # Enable FirecrawlSearchTool for real-time web research (disabled by default for faster generation)
    keyword_density: str = "natural"  # Options: natural, light, medium, heavy
    content_structure: str = "auto"  # auto, listicle, how-to-guide, analysis
    include_images: bool = False
    image_count: int = 0
    image_style: str = "auto"  # auto, photo, illustration, infographic


class TrendsGenerationRequest(BaseModel):
    trend_topic: str
    trend_url: Optional[str] = None  # URL to news article about the trend
    trend_description: Optional[str] = None  # Description of why it's trending
    trend_source: Optional[str] = None  # News source (ESPN, Bleacher Report, etc.)
    trend_related_queries: Optional[List[str]] = None  # Related search queries
    region: str = "US"
    word_count: int = 1200  # Reduced from 1500 for faster generation
    tone: str = "Professional"
    keywords: Optional[List[str]] = None
    seo_optimization: bool = False  # Disabled by default for faster generation
    use_web_search: bool = False  # Enable FirecrawlSearchTool for real-time web research (disabled by default for faster generation)
    content_structure: str = "auto"  # auto, listicle, how-to-guide, analysis
    include_images: bool = False
    image_count: int = 0
    image_style: str = "auto"  # auto, photo, illustration, infographic


class SpinArticleRequest(BaseModel):
    original_content: str
    spin_angle: str
    spin_intensity: str = "medium"  # light, medium, heavy
    word_count: int = 1200  # Reduced from 1500 for faster generation
    tone: str = "Professional"
    seo_optimization: bool = False  # Disabled by default for faster generation
    content_structure: str = "auto"  # auto, listicle, how-to-guide, analysis
    include_images: bool = False
    image_count: int = 0
    image_style: str = "auto"  # auto, photo, illustration, infographic


class GenerationResponse(BaseModel):
    """Response from content generation - job tracking handled by Next.js"""
    success: bool
    content: Optional[str] = None
    message: str
    metadata: Optional[dict] = None


@router.post("/topic", response_model=GenerationResponse)
async def generate_from_topic(request: TopicGenerationRequest):
    """
    Generate content based on a topic
    """
    logger.info(f"[Topic Generation] Starting generation - include_images: {request.include_images}, image_count: {request.image_count}")
    
    # Langfuse tracing
    from services.langfuse_service import trace_generation, is_langfuse_enabled
    trace_metadata = {
        "topic": request.topic,
        "word_count": request.word_count,
        "tone": request.tone,
        "seo_optimization": request.seo_optimization,
        "use_web_search": request.use_web_search,
        "content_structure": request.content_structure,
        "keywords": request.keywords or []
    }
    
    try:
        from agents import create_content_generation_crew
        from services.resource_lock import resource_lock

        # Create and kickoff crew with resource lock
        crew = create_content_generation_crew(
            topic=request.topic,
            word_count=request.word_count,
            tone=request.tone,
            keywords=request.keywords or [],
            seo_optimization=request.seo_optimization,
            use_tools=request.use_web_search,  # Enable FirecrawlSearchTool
            content_structure=request.content_structure
        )

        # Execute crew with resource lock and Langfuse tracing
        # PERFORMANCE: Run crew.kickoff() in thread pool to prevent blocking async event loop
        import asyncio
        loop = asyncio.get_event_loop()
        
        # Langfuse tracing context manager (gracefully handles disabled/misconfigured Langfuse)
        try:
            if is_langfuse_enabled():
                with trace_generation("topic_generation", metadata=trace_metadata) as trace:
                    async with resource_lock.article_generation():
                        result = await loop.run_in_executor(None, crew.kickoff)
            else:
                async with resource_lock.article_generation():
                    result = await loop.run_in_executor(None, crew.kickoff)
        except Exception as langfuse_error:
            # If Langfuse fails, continue without tracing
            logger.warning(f"Langfuse tracing failed, continuing without trace: {str(langfuse_error)}")
            async with resource_lock.article_generation():
                result = await loop.run_in_executor(None, crew.kickoff)

        # Extract content from crew result properly
        # CrewAI result can be accessed via result.raw or the last task's output
        if result:
            # Try multiple methods to extract content
            if hasattr(result, 'raw') and result.raw:
                generated_content = str(result.raw)
            elif hasattr(result, 'tasks') and result.tasks:
                # Get the last task's output (usually the writer or SEO optimizer)
                last_task = result.tasks[-1] if isinstance(result.tasks, list) else None
                if last_task and hasattr(last_task, 'output'):
                    generated_content = str(last_task.output)
                else:
                    generated_content = str(result)
            else:
                generated_content = str(result)
        else:
            generated_content = None
        
        # Log extracted content for debugging
        if generated_content:
            logger.info(f"Extracted content length: {len(generated_content)} characters")

        # Image generation removed - now handled separately via /api/generation/generate-images-for-article
        # Return article without images
        return GenerationResponse(
            success=True,
            content=generated_content,
            message="Content generated successfully",
            metadata={
                "topic": request.topic,
                "word_count": request.word_count,
                "tone": request.tone,
                "include_images": False,
                "image_count": 0,
                "images_generated": 0,
                "images": []
            }
        )

    except Exception as e:
        logger.error(f"Topic generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Content generation failed: {str(e)}"
        )


@router.post("/keywords", response_model=GenerationResponse)
async def generate_from_keywords(request: KeywordsGenerationRequest):
    """
    Generate content based on keywords (VIP-10205)
    """
    # Langfuse tracing
    from services.langfuse_service import trace_generation, is_langfuse_enabled
    topic = ", ".join(request.keywords)
    trace_metadata = {
        "keywords": request.keywords,
        "word_count": request.word_count,
        "tone": request.tone,
        "seo_optimization": request.seo_optimization,
        "use_web_search": request.use_web_search,
        "keyword_density": request.keyword_density,
        "content_structure": request.content_structure
    }
    
    try:
        from agents import create_content_generation_crew
        from services.resource_lock import resource_lock

        crew = create_content_generation_crew(
            topic=f"Article about: {topic}",
            word_count=request.word_count,
            tone=request.tone,
            keywords=request.keywords,
            seo_optimization=request.seo_optimization,
            use_tools=request.use_web_search,  # Enable FirecrawlSearchTool
            keyword_density=request.keyword_density,  # Pass keyword density setting
            content_structure=request.content_structure
        )

        # Execute crew with resource lock and Langfuse tracing
        # PERFORMANCE: Run crew.kickoff() in thread pool to prevent blocking async event loop
        import asyncio
        loop = asyncio.get_event_loop()
        
        # Langfuse tracing context manager (gracefully handles disabled/misconfigured Langfuse)
        try:
            if is_langfuse_enabled():
                with trace_generation("keywords_generation", metadata=trace_metadata) as trace:
                    async with resource_lock.article_generation():
                        result = await loop.run_in_executor(None, crew.kickoff)
            else:
                async with resource_lock.article_generation():
                    result = await loop.run_in_executor(None, crew.kickoff)
        except Exception as langfuse_error:
            # If Langfuse fails, continue without tracing
            logger.warning(f"Langfuse tracing failed, continuing without trace: {str(langfuse_error)}")
            async with resource_lock.article_generation():
                result = await loop.run_in_executor(None, crew.kickoff)

        # Extract content from crew result properly
        # CrewAI result can be accessed via result.raw or the last task's output
        if result:
            # Try multiple methods to extract content
            if hasattr(result, 'raw') and result.raw:
                generated_content = str(result.raw)
            elif hasattr(result, 'tasks') and result.tasks:
                # Get the last task's output (usually the writer or SEO optimizer)
                last_task = result.tasks[-1] if isinstance(result.tasks, list) else None
                if last_task and hasattr(last_task, 'output'):
                    generated_content = str(last_task.output)
                else:
                    generated_content = str(result)
            else:
                generated_content = str(result)
        else:
            generated_content = None
        
        # Log extracted content for debugging
        if generated_content:
            logger.info(f"Extracted content length: {len(generated_content)} characters")

        # Image generation removed - now handled separately via /api/generation/generate-images-for-article
        # Return article without images
        return GenerationResponse(
            success=True,
            content=generated_content,
            message="Content generated from keywords",
            metadata={
                "keywords": request.keywords,
                "word_count": request.word_count,
                "tone": request.tone,
                "keyword_density": request.keyword_density,
                "include_images": False,
                "image_count": 0,
                "images_generated": 0,
                "images": []
            }
        )

    except Exception as e:
        logger.error(f"Keywords generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trends", response_model=GenerationResponse)
async def generate_from_trends(request: TrendsGenerationRequest):
    """
    Generate content based on Google Trends topic (VIP-10206)
    """
    # Langfuse tracing
    from services.langfuse_service import trace_generation, is_langfuse_enabled
    trace_metadata = {
        "trend_topic": request.trend_topic,
        "trend_url": request.trend_url,
        "trend_source": request.trend_source,
        "region": request.region,
        "word_count": request.word_count,
        "tone": request.tone,
        "seo_optimization": request.seo_optimization,
        "use_web_search": request.use_web_search,
        "content_structure": request.content_structure
    }
    
    try:
        from agents import create_content_generation_crew
        from services.resource_lock import resource_lock

        # Build trend context for the agent
        trend_context = {
            "topic": request.trend_topic,
            "url": request.trend_url,
            "description": request.trend_description,
            "source": request.trend_source,
            "related_queries": request.trend_related_queries or [],
            "region": request.region,
        }

        crew = create_content_generation_crew(
            topic=f"Trending: {request.trend_topic} in {request.region}",
            word_count=request.word_count,
            tone=request.tone,
            keywords=request.keywords or [request.trend_topic],
            seo_optimization=request.seo_optimization,
            use_tools=request.use_web_search,  # Enable FirecrawlSearchTool
            trend_context=trend_context,  # Pass full trend metadata
            content_structure=request.content_structure
        )

        # Execute crew with resource lock and Langfuse tracing
        # PERFORMANCE: Run crew.kickoff() in thread pool to prevent blocking async event loop
        import asyncio
        loop = asyncio.get_event_loop()
        
        # Langfuse tracing context manager (gracefully handles disabled/misconfigured Langfuse)
        try:
            if is_langfuse_enabled():
                with trace_generation("trends_generation", metadata=trace_metadata) as trace:
                    async with resource_lock.article_generation():
                        result = await loop.run_in_executor(None, crew.kickoff)
            else:
                async with resource_lock.article_generation():
                    result = await loop.run_in_executor(None, crew.kickoff)
        except Exception as langfuse_error:
            # If Langfuse fails, continue without tracing
            logger.warning(f"Langfuse tracing failed, continuing without trace: {str(langfuse_error)}")
            async with resource_lock.article_generation():
                result = await loop.run_in_executor(None, crew.kickoff)

        # Extract content from crew result properly
        # CrewAI result can be accessed via result.raw or the last task's output
        if result:
            # Try multiple methods to extract content
            if hasattr(result, 'raw') and result.raw:
                generated_content = str(result.raw)
            elif hasattr(result, 'tasks') and result.tasks:
                # Get the last task's output (usually the writer or SEO optimizer)
                last_task = result.tasks[-1] if isinstance(result.tasks, list) else None
                if last_task and hasattr(last_task, 'output'):
                    generated_content = str(last_task.output)
                else:
                    generated_content = str(result)
            else:
                generated_content = str(result)
        else:
            generated_content = None
        
        # Log extracted content for debugging
        if generated_content:
            logger.info(f"Extracted content length: {len(generated_content)} characters")

        # Image generation removed - now handled separately via /api/generation/generate-images-for-article
        # Return article without images
        return GenerationResponse(
            success=True,
            content=generated_content,
            message="Content generated from trending topic",
            metadata={
                "trend_topic": request.trend_topic,
                "trend_url": request.trend_url,
                "trend_source": request.trend_source,
                "region": request.region,
                "word_count": request.word_count,
                "tone": request.tone,
                "include_images": False,
                "image_count": 0,
                "images_generated": 0,
                "images": []
            }
        )

    except Exception as e:
        logger.error(f"Trends generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/spin", response_model=GenerationResponse)
async def spin_existing_article(request: SpinArticleRequest):
    """
    Spin/rewrite existing article with new angle (VIP-10207)
    
    Uses CrewAI agents (Writer + SEO only, NO Research) as per story requirements.
    """
    # Langfuse tracing
    from services.langfuse_service import trace_generation, is_langfuse_enabled
    trace_metadata = {
        "spin_angle": request.spin_angle,
        "spin_intensity": request.spin_intensity,
        "word_count": request.word_count,
        "tone": request.tone,
        "seo_optimization": request.seo_optimization,
        "content_structure": request.content_structure,
        "original_content_length": len(request.original_content) if request.original_content else 0
    }
    
    try:
        from agents import create_spin_article_crew
        from services.resource_lock import resource_lock

        logger.info(f"Spinning article with intensity: {request.spin_intensity}, angle: {request.spin_angle}")

        # Create spin crew (Writer + SEO only, NO Research)
        crew = create_spin_article_crew(
            original_content=request.original_content,
            spin_angle=request.spin_angle,
            spin_intensity=request.spin_intensity,
            word_count=request.word_count,
            tone=request.tone,
            seo_optimization=request.seo_optimization,
            content_structure=request.content_structure
        )

        # Execute crew workflow with resource lock and Langfuse tracing
        logger.info("Executing spin crew workflow...")
        import asyncio
        loop = asyncio.get_event_loop()
        
        # Langfuse tracing context manager (gracefully handles disabled/misconfigured Langfuse)
        try:
            if is_langfuse_enabled():
                with trace_generation("spin_generation", metadata=trace_metadata) as trace:
                    async with resource_lock.article_generation():
                        result = await loop.run_in_executor(None, crew.kickoff)
            else:
                async with resource_lock.article_generation():
                    result = await loop.run_in_executor(None, crew.kickoff)
        except Exception as langfuse_error:
            # If Langfuse fails, continue without tracing
            logger.warning(f"Langfuse tracing failed, continuing without trace: {str(langfuse_error)}")
            async with resource_lock.article_generation():
                result = await loop.run_in_executor(None, crew.kickoff)

        # Extract content from crew result properly
        # CrewAI result can be accessed via result.raw or the last task's output
        if result:
            # Try multiple methods to extract content
            if hasattr(result, 'raw') and result.raw:
                generated_content = str(result.raw)
            elif hasattr(result, 'tasks') and result.tasks:
                # Get the last task's output (usually the writer or SEO optimizer)
                last_task = result.tasks[-1] if isinstance(result.tasks, list) else None
                if last_task and hasattr(last_task, 'output'):
                    generated_content = str(last_task.output)
                else:
                    generated_content = str(result)
            else:
                generated_content = str(result)
        else:
            generated_content = None

        if not generated_content:
            raise HTTPException(status_code=500, detail="Crew execution did not return content")
        
        logger.info(f"Extracted spun content length: {len(generated_content)} characters")

        logger.info(f"Spin crew completed, content length: {len(generated_content)}")
        
        # Image generation removed - now handled separately via /api/generation/generate-images-for-article
        # Return article without images
        return GenerationResponse(
            success=True,
            content=generated_content,
            message="Article spun successfully",
            metadata={
                "spin_angle": request.spin_angle,
                "spin_intensity": request.spin_intensity,
                "word_count": request.word_count,
                "tone": request.tone,
                "include_images": False,
                "image_count": 0,
                "images_generated": 0,
                "images": []
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Spin article error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Spin generation failed: {str(e)}")


# VIP-10208: Bulk Generation (Legacy - Sequential Processing)
# NOTE: FastAPI does NOT queue jobs - Next.js handles job queue in MongoDB
# This endpoint processes multiple requests and returns results immediately
@router.post("/bulk")
async def bulk_generate(requests: List[TopicGenerationRequest]):
    """
    Process multiple generation requests (LEGACY - Sequential)
    
    NOTE: This processes all requests synchronously and returns results.
    For parallel bulk processing, use /api/generation/bulk-async instead.
    """
    results = []
    for req in requests:
        try:
            from agents import create_content_generation_crew
            
            crew = create_content_generation_crew(
                topic=req.topic,
                word_count=req.word_count,
                tone=req.tone,
                keywords=req.keywords or [],
                seo_optimization=req.seo_optimization,
                use_tools=req.use_web_search  # Enable FirecrawlSearchTool
            )
            
            # PERFORMANCE: Run in thread pool to prevent blocking
            import asyncio
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, crew.kickoff)
            results.append({
                "success": True,
                "content": str(result) if result else None,
                "topic": req.topic
            })
        except Exception as e:
            logger.error(f"Bulk generation error for topic '{req.topic}': {str(e)}")
            results.append({
                "success": False,
                "error": str(e),
                "topic": req.topic
            })
    
    return {
        "results": results,
        "total": len(requests),
        "successful": sum(1 for r in results if r.get("success")),
        "failed": sum(1 for r in results if not r.get("success"))
    }


# VIP-10208: Bulk Async Generation using CrewAI kickoff_for_each_async
# Processes multiple articles in parallel for maximum throughput
class BulkAsyncRequest(BaseModel):
    """Request model for bulk async generation"""
    topics: List[str]
    word_count: int = 1200  # Reduced from 1500 for faster generation
    tone: str = "Professional"
    keywords: Optional[List[str]] = None
    seo_optimization: bool = False  # Disabled by default for faster generation
    use_web_search: bool = True
    content_structure: str = "auto"
    keyword_density: str = "natural"
    include_images: bool = False
    image_count: int = 0
    image_style: str = "auto"
    # Spin mode specific fields
    mode: Optional[str] = "topic"  # topic, keywords, trends, spin
    original_content: Optional[str] = None  # For spin mode
    spin_angle: Optional[str] = None  # For spin mode
    spin_intensity: Optional[str] = "medium"  # For spin mode
    # Job tracking (passed from Next.js)
    job_id: Optional[str] = None
    user_id: Optional[str] = None


class BulkAsyncResponse(BaseModel):
    """Response model for bulk async generation"""
    success: bool
    total: int
    completed: int
    failed: int
    results: List[dict]
    message: str


@router.post("/bulk-async", response_model=BulkAsyncResponse)
async def bulk_generate_async(request: BulkAsyncRequest):
    """
    Bulk generate articles using SEQUENTIAL processing to avoid exhausting Ollama server resources.
    
    This endpoint processes articles one at a time (sequentially) to prevent resource exhaustion:
    - Processes topics one by one using sequential kickoff() calls
    - Prevents overwhelming the Ollama server with parallel requests
    - Images are generated AFTER each article completes (post-generation approach)
    - Standalone image generation (media page) is independent and can run concurrently
    
    IMPORTANT: Image Generation Behavior:
    - When include_images=True: Images are generated AFTER the article content is complete
    - Image generation waits for article completion before starting
    - Standalone image generation (via /api/media/generate) is independent and doesn't wait
    
    Args:
        request: BulkAsyncRequest with list of topics and generation settings
        
    Returns:
        BulkAsyncResponse with all generated articles
    """
    import asyncio
    
    try:
        from agents import create_bulk_generation_crew
        
        if not request.topics or len(request.topics) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one topic is required"
            )
        
        if len(request.topics) > 50:
            raise HTTPException(
                status_code=400,
                detail="Maximum 50 topics allowed per bulk request"
            )
        
        logger.info(f"Starting bulk async generation for {len(request.topics)} articles (mode: {request.mode or 'topic'})")
        
        # Handle spin mode differently - use spin crew for each variation
        # Process spin variations SEQUENTIALLY to avoid exhausting Ollama server resources
        if request.mode == 'spin':
            from agents import create_spin_article_crew
            
            if not request.original_content:
                raise HTTPException(
                    status_code=400,
                    detail="original_content is required for spin mode"
                )
            
            logger.info(f"Starting sequential spin generation for {len(request.topics)} variations")
            results = []
            
            # Process each spin variation sequentially (one at a time)
            for i, topic in enumerate(request.topics):
                try:
                    spin_angle = f"{request.spin_angle or 'fresh perspective'} - {topic}"
                    logger.info(f"Processing spin variation {i+1}/{len(request.topics)}: {topic}")
                    
                    from services.resource_lock import resource_lock
                    
                    # Create spin crew for this variation
                    crew = create_spin_article_crew(
                        original_content=request.original_content,
                        spin_angle=spin_angle,
                        spin_intensity=request.spin_intensity or "medium",
                        word_count=request.word_count,
                        tone=request.tone,
                        seo_optimization=request.seo_optimization,
                        content_structure=request.content_structure
                    )
                    
                    # Execute spin sequentially with resource lock (waits if another article is generating)
                    import asyncio
                    loop = asyncio.get_event_loop()
                    async with resource_lock.article_generation():
                        result = await loop.run_in_executor(None, crew.kickoff)
                    
                    # Extract content
                    if result:
                        if hasattr(result, 'raw') and result.raw:
                            content = str(result.raw)
                        elif hasattr(result, 'tasks') and result.tasks:
                            last_task = result.tasks[-1] if isinstance(result.tasks, list) else None
                            if last_task and hasattr(last_task, 'output'):
                                content = str(last_task.output)
                            else:
                                content = str(result)
                        else:
                            content = str(result)
                    else:
                        raise Exception("Crew execution did not return content")
                    
                    # Image generation removed - now handled separately via /api/generation/generate-images-for-article
                    results.append({
                        "success": True,
                        "content": content,
                        "topic": topic,
                        "word_count": len(content.split()) if content else 0,
                        "images_generated": 0,
                        "images": [],
                        "metadata": {
                            "spin_angle": spin_angle,
                            "spin_intensity": request.spin_intensity,
                        }
                    })
                    
                    logger.info(f"Completed spin variation {i+1}/{len(request.topics)}: {topic}")
                    
                except Exception as e:
                    logger.error(f"Error processing spin variation {i+1}/{len(request.topics)}: {str(e)}", exc_info=True)
                    results.append({
                        "success": False,
                        "error": str(e),
                        "topic": topic,
                        "word_count": 0,
                        "images_generated": 0,
                        "images": []
                    })
            
            # Return results in same format as regular bulk
            successful = sum(1 for r in results if r.get("success"))
            failed = len(results) - successful
            
            logger.info(f"Sequential spin generation completed: {successful} successful, {failed} failed")
            
            return BulkAsyncResponse(
                success=True,
                total=len(results),
                completed=successful,
                failed=failed,
                results=results,
                message=f"Bulk spin generation completed: {successful} successful, {failed} failed (sequential mode)"
            )
        
        # Regular bulk generation (topic/keywords/trends mode)
        # Process articles SEQUENTIALLY to avoid exhausting Ollama server resources
        # Changed from kickoff_for_each_async (parallel) to sequential kickoff() calls
        logger.info(f"Starting sequential bulk generation for {len(request.topics)} articles (mode: {request.mode or 'topic'})")
        
        keywords_str = ", ".join(request.keywords) if request.keywords else "fantasy football, sports analysis"
        results = []
        
        # Process each article sequentially (one at a time)
        for i, topic in enumerate(request.topics):
            try:
                logger.info(f"Processing article {i+1}/{len(request.topics)}: {topic}")
                
                from agents import create_content_generation_crew
                from services.resource_lock import resource_lock
                
                # Create crew for this specific topic
                single_crew = create_content_generation_crew(
                    topic=topic,
                    word_count=request.word_count,
                    tone=request.tone,
                    keywords=request.keywords or [],
                    seo_optimization=request.seo_optimization,
                    use_tools=request.use_web_search,
                    keyword_density=request.keyword_density,
                    content_structure=request.content_structure
                )
                
                # Execute crew sequentially with resource lock (waits if another article is generating)
                import asyncio
                loop = asyncio.get_event_loop()
                async with resource_lock.article_generation():
                    result = await loop.run_in_executor(None, single_crew.kickoff)
                
                # Extract content from crew result
                if result:
                    if hasattr(result, 'raw') and result.raw:
                        content = str(result.raw)
                    elif hasattr(result, 'tasks') and result.tasks:
                        last_task = result.tasks[-1] if isinstance(result.tasks, list) else None
                        if last_task and hasattr(last_task, 'output'):
                            content = str(last_task.output)
                        else:
                            content = str(result)
                    else:
                        content = str(result)
                else:
                    raise Exception("Crew execution did not return content")
                
                # Image generation removed - now handled separately via /api/generation/generate-images-for-article
                results.append({
                    "success": True,
                    "topic": topic,
                    "content": content,
                    "word_count": len(content.split()) if content else 0,
                    "images_generated": 0,
                    "images": []
                })
                
                logger.info(f"Completed article {i+1}/{len(request.topics)}: {topic}")
                
            except Exception as e:
                logger.error(f"Error generating article {i+1}/{len(request.topics)} for '{topic}': {str(e)}", exc_info=True)
                results.append({
                    "success": False,
                    "topic": topic,
                    "error": str(e),
                    "word_count": 0,
                    "images_generated": 0,
                    "images": []
                })
        
        successful = sum(1 for r in results if r.get("success"))
        failed = len(request.topics) - successful
        
        logger.info(f"Sequential bulk generation completed: {successful} successful, {failed} failed")
        
        return BulkAsyncResponse(
            success=True,
            total=len(request.topics),
            completed=successful,
            failed=failed,
            results=results,
            message=f"Successfully generated {successful} of {len(request.topics)} articles (sequential mode)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk async generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Bulk generation failed: {str(e)}"
        )


# Article Image Generation Request Model
class ArticleImageRequest(BaseModel):
    """Request model for generating images for an existing article"""
    article_content: str
    article_title: str
    image_count: int = 2
    image_style: str = "auto"  # auto, photo, illustration, infographic


class ArticleImageResponse(BaseModel):
    """Response model for article image generation"""
    success: bool
    content: Optional[str] = None
    message: str
    images_generated: int = 0
    images: Optional[List[dict]] = None


# SEO Analysis Request Model
class SEOAnalysisRequest(BaseModel):
    content: str
    title: str
    keywords: List[str] = []


# Readability Analysis Request Model
class ReadabilityAnalysisRequest(BaseModel):
    content: str


# Generate Images for Existing Article
@router.post("/generate-images-for-article", response_model=ArticleImageResponse)
async def generate_images_for_article(request: ArticleImageRequest):
    """
    Generate images for an existing article.
    
    This endpoint takes article content and generates/embeds images into it.
    Uses the existing image generation service which:
    1. Sends article content to Ollama to generate image prompts
    2. Generates images using HuggingFace API
    3. Embeds images into the article content at strategic positions
    
    IMPORTANT: Image generation waits for article generation to complete
    (handled by resource lock in image_generation_service).
    """
    try:
        from services.image_generation_service import image_generation_service
        
        # Validate image count
        if request.image_count < 1 or request.image_count > 2:
            raise HTTPException(
                status_code=400,
                detail="Image count must be between 1 and 2"
            )
        
        # Validate image style
        valid_styles = ["auto", "cartoon", "realistic"]
        if request.image_style not in valid_styles:
            raise HTTPException(
                status_code=400,
                detail=f"Image style must be one of: {', '.join(valid_styles)}"
            )
        
        logger.info(f"Generating {request.image_count} images for article: {request.article_title[:50]}...")
        
        # Use existing image generation service
        # This already uses resource lock to wait for article generation
        image_result = await image_generation_service.generate_and_embed_images(
            article_content=request.article_content,
            image_count=request.image_count,
            image_style=request.image_style,
            topic=request.article_title  # Pass title as topic for prompt generation
        )
        
        if image_result["success"]:
            images_metadata = image_result.get("images", [])
            logger.info(f"Successfully generated {len(images_metadata)} images for article")
            
            return ArticleImageResponse(
                success=True,
                content=image_result["content"],
                message=image_result.get("message", f"Generated {len(images_metadata)} images successfully"),
                images_generated=len(images_metadata),
                images=images_metadata
            )
        else:
            error_message = image_result.get("message", "Image generation failed")
            logger.error(f"Image generation failed: {error_message}")
            raise HTTPException(
                status_code=500,
                detail=error_message
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Article image generation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Image generation failed: {str(e)}"
        )


# VIP-10209: SEO Analysis
@router.post("/analyze/seo")
async def analyze_seo_endpoint(request: SEOAnalysisRequest):
    """Analyze content for SEO metrics"""
    from services.seo_analyzer import analyze_seo
    return analyze_seo(request.content, request.title, request.keywords)


# VIP-10210: Readability Analysis
@router.post("/analyze/readability")
async def analyze_readability_endpoint(request: ReadabilityAnalysisRequest):
    """Analyze content readability"""
    from services.readability_analyzer import analyze_readability
    return analyze_readability(request.content)


# NOTE: Job management endpoints removed per architecture
# FastAPI is stateless - all job tracking handled by Next.js in MongoDB
# Use Next.js endpoints for job management:
# - GET /api/content/jobs - List jobs
# - GET /api/content/jobs/{id} - Get job details
# - POST /api/content/jobs/{id}/cancel - Cancel job
# - DELETE /api/content/jobs/{id} - Delete job

