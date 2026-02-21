"""
Website Crawling Router
Handles Firecrawl API integration for website crawling
"""

from fastapi import APIRouter, HTTPException
from models.crawl_models import (
    CrawlRequest,
    CrawlInitiateResponse,
    CrawlStatusResponse,
    ScrapeRequest,
    ScrapeResponse,
)
from services.firecrawl_service import firecrawl_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/crawl",
    tags=["crawl"],
    responses={
        503: {"description": "Firecrawl service unavailable"},
        500: {"description": "Internal server error"},
    }
)


@router.post("/", response_model=CrawlInitiateResponse, status_code=202)
async def initiate_crawl(request: CrawlRequest):
    """
    Initiate a website crawl using Firecrawl API

    This endpoint starts an async crawl job and returns a job ID.
    Use GET /crawl/{job_id} to check the status and retrieve results.

    Args:
        request: CrawlRequest with url, max_pages, and formats

    Returns:
        CrawlInitiateResponse with success status and job_id

    Status Codes:
        202: Crawl job initiated successfully
        400: Invalid request parameters
        503: Firecrawl API unavailable
        500: Internal server error
    """
    try:
        logger.info(f"Initiating crawl for {request.url}")

        result = await firecrawl_service.crawl_website(
            url=str(request.url),
            max_pages=request.max_pages,
            formats=request.formats,
        )

        if not result.get("success"):
            error_msg = result.get("error", "Unknown error")
            logger.error(f"Crawl initiation failed: {error_msg}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to initiate crawl: {error_msg}"
            )

        return CrawlInitiateResponse(
            success=True,
            job_id=result.get("jobId")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error initiating crawl: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )


@router.get("/{job_id}", response_model=CrawlStatusResponse)
async def get_crawl_status(job_id: str):
    """
    Get the status of a crawl job

    Args:
        job_id: The Firecrawl job ID returned from POST /crawl

    Returns:
        CrawlStatusResponse with job status, progress, and crawled data

    Status Codes:
        200: Status retrieved successfully
        404: Job not found
        503: Firecrawl API unavailable
        500: Internal server error
    """
    try:
        logger.info(f"Checking status for job {job_id}")

        result = await firecrawl_service.get_crawl_status(job_id)

        if result.get("status") == "failed" and "not found" in result.get("error", "").lower():
            raise HTTPException(
                status_code=404,
                detail=f"Crawl job {job_id} not found"
            )

        return CrawlStatusResponse(
            status=result.get("status", "failed"),
            total=result.get("total"),
            completed=result.get("completed"),
            data=result.get("data"),
            error=result.get("error"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting crawl status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )


@router.post("/scrape", response_model=ScrapeResponse)
async def scrape_single_page(request: ScrapeRequest):
    """
    Scrape a single page (synchronous scraping, not a crawl job)

    Use this for quick, one-off page scraping without async job tracking.

    Args:
        request: ScrapeRequest with url

    Returns:
        ScrapeResponse with markdown content and metadata

    Status Codes:
        200: Page scraped successfully
        503: Firecrawl API unavailable
        500: Internal server error
    """
    try:
        logger.info(f"Scraping single page: {request.url}")

        result = await firecrawl_service.scrape_single_page(str(request.url))

        if not result.get("success"):
            error_msg = result.get("error", "Unknown error")
            logger.error(f"Page scraping failed: {error_msg}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to scrape page: {error_msg}"
            )

        return ScrapeResponse(
            success=True,
            markdown=result.get("markdown"),
            metadata=result.get("metadata"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error scraping page: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )
