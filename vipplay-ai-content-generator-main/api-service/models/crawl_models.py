"""
Pydantic models for website crawling operations
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any


class CrawlRequest(BaseModel):
    """Request to initiate a website crawl"""
    url: HttpUrl = Field(..., description="Website URL to crawl")
    max_pages: int = Field(default=50, ge=1, le=500, description="Maximum pages to crawl")
    formats: List[str] = Field(default=["markdown"], description="Content formats to extract")


class CrawlInitiateResponse(BaseModel):
    """Response after initiating a crawl"""
    success: bool = Field(..., description="Whether the crawl was initiated successfully")
    job_id: Optional[str] = Field(None, description="Firecrawl job ID")
    error: Optional[str] = Field(None, description="Error message if failed")


class PageMetadata(BaseModel):
    """Metadata for a crawled page"""
    title: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    keywords: Optional[List[str]] = None


class CrawledPage(BaseModel):
    """A single crawled page with content"""
    url: str = Field(..., description="Page URL")
    markdown: Optional[str] = Field(None, description="Markdown content")
    html: Optional[str] = Field(None, description="HTML content")
    text: Optional[str] = Field(None, description="Plain text content")
    metadata: Optional[PageMetadata] = Field(None, description="Page metadata")


class CrawlStatusResponse(BaseModel):
    """Response for crawl job status check"""
    status: str = Field(..., description="Job status: pending, processing, completed, failed")
    total: Optional[int] = Field(None, description="Total pages to crawl")
    completed: Optional[int] = Field(None, description="Pages completed")
    data: Optional[List[Dict[str, Any]]] = Field(None, description="Crawled pages data")
    error: Optional[str] = Field(None, description="Error message if failed")


class ScrapeRequest(BaseModel):
    """Request to scrape a single page"""
    url: HttpUrl = Field(..., description="Page URL to scrape")


class ScrapeResponse(BaseModel):
    """Response for single page scraping"""
    success: bool = Field(..., description="Whether scraping succeeded")
    markdown: Optional[str] = Field(None, description="Markdown content")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Page metadata")
    error: Optional[str] = Field(None, description="Error message if failed")
