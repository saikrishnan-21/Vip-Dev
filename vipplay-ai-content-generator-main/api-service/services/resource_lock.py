"""
Resource Lock Manager
Coordinates article generation and image generation to prevent resource exhaustion.

PERFORMANCE OPTIMIZATION: Changed from Lock to Semaphore to allow parallel article generation.
This allows 2-3 articles to generate simultaneously, significantly reducing wait times.

IMPORTANT: Image generation (both article images and standalone media page) 
must wait for article generation to complete before proceeding.
"""

import asyncio
import logging
import os
from typing import Optional
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# Allow concurrent article generations (configurable via env var)
MAX_CONCURRENT_ARTICLES = int(os.getenv("MAX_CONCURRENT_ARTICLES", "2"))


class ResourceLockManager:
    """
    Manages locks to coordinate article generation and image generation.
    
    PERFORMANCE OPTIMIZATION: Uses Semaphore instead of Lock to allow parallel processing.
    
    Rules:
    - Up to MAX_CONCURRENT_ARTICLES (default: 2) articles can generate simultaneously
    - Image generation (article images + standalone media page) must wait 
      for article generation to complete
    - Multiple image generations can queue and wait
    """
    
    def __init__(self):
        # Semaphore for article generation - allows N concurrent articles (default: 2)
        # This is a PERFORMANCE OPTIMIZATION to reduce wait times
        self._article_semaphore = asyncio.Semaphore(MAX_CONCURRENT_ARTICLES)
        
        # Event to signal when article generation is active
        self._article_generating = asyncio.Event()
        self._article_generating.set()  # Initially not generating
        
        # Counter for active article generations
        self._active_articles = 0
        self._active_articles_lock = asyncio.Lock()  # Lock for counter updates
        
        # Lock for image generation queue
        self._image_lock = asyncio.Lock()
        
        # Counter for waiting image generations
        self._waiting_images = 0
        
        logger.info(f"ResourceLockManager initialized with MAX_CONCURRENT_ARTICLES={MAX_CONCURRENT_ARTICLES}")
    
    @asynccontextmanager
    async def article_generation(self):
        """
        Context manager for article generation.
        
        PERFORMANCE OPTIMIZATION: Uses Semaphore to allow parallel article generation.
        Multiple articles can now generate simultaneously (up to MAX_CONCURRENT_ARTICLES).
        
        Usage:
            async with resource_lock.article_generation():
                # Generate article here
                pass
        """
        # Acquire semaphore (allows up to MAX_CONCURRENT_ARTICLES concurrent articles)
        await self._article_semaphore.acquire()
        
        # Update counter safely
        async with self._active_articles_lock:
            self._active_articles += 1
            if self._active_articles == 1:
                self._article_generating.clear()  # Signal that article generation is active
        
        logger.info(f"Article generation started (active: {self._active_articles}/{MAX_CONCURRENT_ARTICLES})")
        
        try:
            yield
        finally:
            # Update counter safely
            async with self._active_articles_lock:
                self._active_articles -= 1
                logger.info(f"Article generation completed (active: {self._active_articles}/{MAX_CONCURRENT_ARTICLES})")
                
                # If no more articles, signal that image generation can proceed
                if self._active_articles == 0:
                    self._article_generating.set()  # Signal that article generation is done
                    logger.info("All article generations completed - image generation can proceed")
            
            # Release the semaphore
            self._article_semaphore.release()
    
    @asynccontextmanager
    async def image_generation(self):
        """
        Context manager for image generation.
        
        Waits for article generation to complete before proceeding.
        
        Usage:
            async with resource_lock.image_generation():
                # Generate image here
                pass
        """
        self._waiting_images += 1
        logger.info(f"Image generation requested (waiting: {self._waiting_images}, articles active: {self._active_articles})")
        
        # Always wait for article generation to complete
        # If no articles are generating, the event is set and wait() returns immediately
        # If articles are generating, wait() blocks until they complete
        if self._active_articles > 0:
            logger.info(f"Waiting for {self._active_articles} article(s) to complete before image generation...")
        
        await self._article_generating.wait()
        
        if self._active_articles > 0:
            logger.info("Article generation completed - proceeding with image generation")
        
        # Acquire image lock (allows sequential image generation)
        await self._image_lock.acquire()
        
        try:
            self._waiting_images -= 1
            logger.info(f"Image generation started (waiting: {self._waiting_images})")
            yield
        finally:
            logger.info("Image generation completed")
            self._image_lock.release()
    
    def get_status(self) -> dict:
        """Get current status of locks"""
        return {
            "active_articles": self._active_articles,
            "waiting_images": self._waiting_images,
            "article_lock_locked": self._article_lock.locked(),
            "image_lock_locked": self._image_lock.locked(),
        }


# Global singleton instance
resource_lock = ResourceLockManager()

