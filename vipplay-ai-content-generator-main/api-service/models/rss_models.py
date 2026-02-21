"""
Pydantic models for RSS feed operations
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any


class FetchRSSRequest(BaseModel):
    """Request to fetch and parse an RSS feed"""
    feed_url: HttpUrl = Field(..., description="URL of the RSS/Atom feed")
    max_items: int = Field(default=50, ge=1, le=500, description="Maximum items to fetch")
    include_content: bool = Field(default=True, description="Whether to include full content")


class RSSEnclosure(BaseModel):
    """RSS enclosure (media attachment)"""
    url: Optional[str] = None
    type: Optional[str] = None
    length: Optional[str] = None


class RSSItem(BaseModel):
    """A single RSS feed item"""
    title: Optional[str] = None
    link: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    guid: Optional[str] = None
    pubDate: Optional[str] = None
    author: Optional[str] = None
    categories: List[str] = Field(default_factory=list)
    enclosure: Optional[RSSEnclosure] = None


class RSSFeedData(BaseModel):
    """Parsed RSS feed data"""
    title: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    items: List[RSSItem] = Field(default_factory=list)


class FetchRSSResponse(BaseModel):
    """Response for RSS feed fetch"""
    success: bool = Field(..., description="Whether the fetch succeeded")
    feed: Optional[RSSFeedData] = Field(None, description="Parsed feed data")
    error: Optional[str] = Field(None, description="Error message if failed")
