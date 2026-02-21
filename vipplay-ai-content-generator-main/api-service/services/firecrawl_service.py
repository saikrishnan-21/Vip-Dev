"""
Firecrawl API Service
Handles website crawling and content extraction using Firecrawl API
"""

import os
import logging
import aiohttp
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1"


class FirecrawlService:
    """Service for interacting with Firecrawl API"""

    def __init__(self):
        self.api_key = FIRECRAWL_API_KEY
        self.api_url = FIRECRAWL_API_URL

    async def validate_api_key(self) -> bool:
        """Check if Firecrawl API key is configured"""
        if not self.api_key or self.api_key == "your-firecrawl-api-key":
            logger.warning("Firecrawl API key not configured")
            return False
        return True

    async def crawl_website(
        self,
        url: str,
        max_pages: int = 50,
        formats: List[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiate a website crawl using Firecrawl API

        Args:
            url: Website URL to crawl
            max_pages: Maximum number of pages to crawl (default: 50)
            formats: Content formats to extract (default: ['markdown'])

        Returns:
            Dict with success status and jobId or error message
        """
        if not await self.validate_api_key():
            return {
                "success": False,
                "error": "Firecrawl API key not configured"
            }

        if formats is None:
            formats = ["markdown"]

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }

                payload = {
                    "url": url,
                    "limit": max_pages,
                    "scrapeOptions": {
                        "formats": formats,
                        "includeTags": ["article", "main", "content"],
                        "excludeTags": ["nav", "footer", "header", "aside"],
                    }
                }

                logger.info(f"Initiating crawl for {url} with limit {max_pages}")

                async with session.post(
                    f"{self.api_url}/crawl",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Firecrawl API error {response.status}: {error_text}")
                        return {
                            "success": False,
                            "error": f"Firecrawl API error: {response.status}"
                        }

                    data = await response.json()
                    job_id = data.get("id")

                    logger.info(f"Crawl job initiated with ID: {job_id}")

                    return {
                        "success": True,
                        "jobId": job_id
                    }

        except aiohttp.ClientError as e:
            logger.error(f"HTTP error during crawl: {str(e)}")
            return {
                "success": False,
                "error": f"Network error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error during crawl: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to initiate crawl: {str(e)}"
            }

    async def get_crawl_status(self, job_id: str) -> Dict[str, Any]:
        """
        Check the status of a crawl job

        Args:
            job_id: The Firecrawl job ID

        Returns:
            Dict with job status, progress, and data if completed
        """
        if not await self.validate_api_key():
            return {
                "status": "failed",
                "error": "Firecrawl API key not configured"
            }

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Authorization": f"Bearer {self.api_key}"
                }

                logger.info(f"Checking status for job {job_id}")

                async with session.get(
                    f"{self.api_url}/crawl/{job_id}",
                    headers=headers
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Firecrawl API error {response.status}: {error_text}")
                        return {
                            "status": "failed",
                            "error": f"Firecrawl API error: {response.status}"
                        }

                    data = await response.json()

                    status = data.get("status")
                    total = data.get("total")
                    completed = data.get("completed")
                    pages_data = data.get("data", [])

                    logger.info(f"Job {job_id} status: {status} ({completed}/{total})")

                    return {
                        "status": status,
                        "total": total,
                        "completed": completed,
                        "data": pages_data
                    }

        except aiohttp.ClientError as e:
            logger.error(f"HTTP error checking job status: {str(e)}")
            return {
                "status": "failed",
                "error": f"Network error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error checking job status: {str(e)}")
            return {
                "status": "failed",
                "error": f"Failed to get job status: {str(e)}"
            }

    async def scrape_single_page(self, url: str) -> Dict[str, Any]:
        """
        Scrape a single page using Firecrawl (for quick scraping)

        Args:
            url: Page URL to scrape

        Returns:
            Dict with markdown content and metadata or error
        """
        if not await self.validate_api_key():
            return {
                "success": False,
                "error": "Firecrawl API key not configured"
            }

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}"
                }

                payload = {
                    "url": url,
                    "formats": ["markdown"]
                }

                logger.info(f"Scraping single page: {url}")

                async with session.post(
                    f"{self.api_url}/scrape",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Firecrawl API error {response.status}: {error_text}")
                        return {
                            "success": False,
                            "error": f"Firecrawl API error: {response.status}"
                        }

                    data = await response.json()
                    page_data = data.get("data", {})

                    return {
                        "success": True,
                        "markdown": page_data.get("markdown"),
                        "metadata": page_data.get("metadata", {})
                    }

        except Exception as e:
            logger.error(f"Error scraping page: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to scrape page: {str(e)}"
            }


# Singleton instance
firecrawl_service = FirecrawlService()
