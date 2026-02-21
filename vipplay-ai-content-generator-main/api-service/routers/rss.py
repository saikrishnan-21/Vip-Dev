"""
RSS Feed Router
Handles RSS/Atom feed fetching and parsing
"""

from fastapi import APIRouter, HTTPException
from models.rss_models import FetchRSSRequest, FetchRSSResponse
from services.rss_service import rss_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/rss",
    tags=["rss"],
    responses={
        503: {"description": "RSS feed unavailable or invalid"},
        500: {"description": "Internal server error"},
    }
)


@router.post("/fetch", response_model=FetchRSSResponse)
async def fetch_rss_feed(request: FetchRSSRequest):
    """
    Fetch and parse an RSS/Atom feed

    This endpoint fetches an RSS or Atom feed from the provided URL,
    parses the XML, and returns structured feed data.

    Args:
        request: FetchRSSRequest with feed_url, max_items, and include_content

    Returns:
        FetchRSSResponse with success status and parsed feed data

    Status Codes:
        200: Feed fetched and parsed successfully
        400: Invalid request parameters
        503: RSS feed unavailable or invalid
        500: Internal server error
    """
    try:
        logger.info(f"Fetching RSS feed: {request.feed_url}")

        result = await rss_service.fetch_and_parse_rss(
            feed_url=str(request.feed_url),
            max_items=request.max_items,
            include_content=request.include_content,
        )

        if not result.get("success"):
            error_msg = result.get("error", "Unknown error")
            logger.error(f"RSS feed fetch failed: {error_msg}")
            raise HTTPException(
                status_code=503,
                detail=f"Failed to fetch RSS feed: {error_msg}"
            )

        return FetchRSSResponse(
            success=True,
            feed=result.get("feed")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching RSS feed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal error: {str(e)}"
        )
