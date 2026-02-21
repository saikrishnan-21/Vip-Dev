"""
CrewAI Tools Configuration
Configures search and scraping tools for content research agents

References:
- Firecrawl API v2: https://docs.firecrawl.dev/api-reference/endpoint/search
- CrewAI Custom Tools: https://docs.crewai.com/en/learn/create-custom-tools
"""

import os
import logging
import httpx
from typing import Optional, Dict, Any, List, Type
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Firecrawl API Configuration
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1"

# Default search configuration
DEFAULT_SEARCH_LIMIT = int(os.getenv("FIRECRAWL_SEARCH_LIMIT", "5"))
DEFAULT_COUNTRY = os.getenv("FIRECRAWL_COUNTRY", "US")


# ============================================================================
# Custom Firecrawl Search Tool using CrewAI BaseTool
# Reference: https://docs.crewai.com/en/learn/create-custom-tools
# ============================================================================

class FirecrawlSearchInput(BaseModel):
    """Input schema for Firecrawl search tool."""
    query: str = Field(..., description="The search query to find relevant content about any topic")


def _build_request_body(query: str, limit: int, scrape_content: bool) -> Dict[str, Any]:
    """Build the Firecrawl API request body."""
    body = {
        "query": query,
        "limit": limit,
        "lang": "en",
        "timeout": 60000,
    }
    
    # Add scrape options if content scraping is enabled
    if scrape_content:
        body["scrapeOptions"] = {
            "formats": ["markdown"],
            "onlyMainContent": True,
            "excludeTags": [
                # Navigation & Layout
                "nav", "footer", "aside", "header", "sidebar",
                # Ads & Promos
                "advertisement", "ad", "promo", "banner",
                # Social & Sharing
                "share", "social", "sharing-buttons", 
                # Comments & User Content
                "comments", "comment-section", "disqus",
                # Popups & Overlays
                "popup", "modal", "overlay", "cookie-banner",
                # Related/Recommended
                "related-posts", "recommended", "more-stories"
            ],
            "timeout": 30000,
            "blockAds": True,
            "removeBase64Images": True,
        }
    
    return body


def _clean_markdown_content(markdown: str) -> str:
    """
    Clean scraped markdown content by removing common noise patterns.
    
    Removes:
    - Social sharing links (Share on Facebook/Twitter/Email)
    - Skip navigation links
    - Advertisement text
    - Cookie/banner notices
    """
    import re
    
    # Patterns to remove
    noise_patterns = [
        # Social sharing links
        r'\[Share on (?:Facebook|Twitter|LinkedIn|Pinterest)\]\([^)]+\)',
        r'\[Send email\]\([^)]+\)',
        r'\[Copied!\]',
        # Skip links
        r'\[Skip to (?:main )?content\]\([^)]+\)',
        # Advertisement/promo text
        r'(?:BLACK FRIDAY|CYBER MONDAY|SALE).*?(?:SHOP NOW|BUY NOW)',
        r'SALE ENDS IN:.*?(?:HRS|MIN|SEC)',
        r'\d+ hours?, \d+ minutes?, \d+ seconds?HRS:MIN:SEC',
        # Common footer/nav noise
        r'Advertising',
        # Empty list items
        r'^- \s*$',
    ]
    
    cleaned = markdown
    for pattern in noise_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE | re.MULTILINE | re.DOTALL)
    
    # Remove multiple consecutive newlines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    
    # Remove lines that are just whitespace
    lines = [line for line in cleaned.split('\n') if line.strip()]
    cleaned = '\n'.join(lines)
    
    return cleaned.strip()


def _format_results(data: Dict[str, Any], query: str) -> str:
    """Format API response into readable text for the agent."""
    if not data.get("success", False):
        return f"Search returned no results for: {query}"
    
    results = data.get("data", [])
    
    if not results:
        return f"No results found for: {query}"
    
    formatted = [f"## Search Results for: {query}\n"]
    
    for i, result in enumerate(results, 1):
        title = result.get("title", "No title")
        url = result.get("url", "")
        description = result.get("description", "")
        markdown = result.get("markdown", "")
        
        formatted.append(f"### {i}. {title}")
        formatted.append(f"**URL:** {url}")
        
        if description:
            formatted.append(f"**Summary:** {description}")
        
        # Clean and include markdown content if available
        if markdown:
            cleaned_content = _clean_markdown_content(markdown)
            # Truncate for LLM context
            content = cleaned_content[:2000] + "..." if len(cleaned_content) > 2000 else cleaned_content
            formatted.append(f"\n**Content:**\n{content}")
        
        formatted.append("\n---\n")
    
    return "\n".join(formatted)


def _execute_firecrawl_search(
    query: str,
    api_key: str,
    limit: int = 5,
    scrape_content: bool = True
) -> str:
    """
    Execute Firecrawl search API call.
    
    Args:
        query: Search query string
        api_key: Firecrawl API key
        limit: Maximum number of results
        scrape_content: Whether to scrape full page content
        
    Returns:
        Formatted search results as string
    """
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        body = _build_request_body(query, limit, scrape_content)
        api_url = f"{FIRECRAWL_API_URL}/search"
        
        logger.info(f"Firecrawl search: '{query}' (limit={limit})")
        
        with httpx.Client(timeout=90.0) as client:
            response = client.post(api_url, headers=headers, json=body)
            
            if response.status_code == 401:
                return "Error: Invalid Firecrawl API key. Please check your configuration."
            
            if response.status_code == 429:
                return "Error: Rate limit exceeded. Please try again later."
            
            response.raise_for_status()
            data = response.json()
        
        return _format_results(data, query)
        
    except httpx.TimeoutException:
        logger.error(f"Firecrawl search timeout for query: {query}")
        return f"Search timed out for query: {query}. Try a more specific search."
    except httpx.HTTPStatusError as e:
        logger.error(f"Firecrawl API error: {e.response.status_code} - {e.response.text}")
        return f"Search API error: {e.response.status_code}"
    except Exception as e:
        logger.error(f"Firecrawl search error: {str(e)}")
        return f"Search failed: {str(e)}"


def create_firecrawl_tool(
    limit: int = DEFAULT_SEARCH_LIMIT,
    scrape_content: bool = True
):
    """
    Create a CrewAI-compatible Firecrawl search tool using BaseTool.
    
    Reference: https://docs.crewai.com/en/learn/create-custom-tools
    
    Args:
        limit: Maximum number of results (1-100)
        scrape_content: Whether to scrape full page content
        
    Returns:
        CrewAI BaseTool instance or None
    """
    try:
        from crewai.tools import BaseTool
        
        # Capture config in closure
        api_key = FIRECRAWL_API_KEY
        search_limit = limit
        do_scrape = scrape_content
        
        class FirecrawlSearchTool(BaseTool):
            """
            Custom Firecrawl Search Tool for web content research.
            
            Searches the web using Firecrawl API and returns formatted results
            with titles, URLs, summaries, and optionally full page content.
            """
            name: str = "Web Search"
            description: str = (
                "Search the web for current information about any topic. "
                "Use this tool to find recent news, articles, statistics, and content. "
                "Input should be a descriptive search query."
            )
            args_schema: Type[BaseModel] = FirecrawlSearchInput
            
            def _run(self, query: str) -> str:
                """Execute the web search."""
                return _execute_firecrawl_search(
                    query=query,
                    api_key=api_key,
                    limit=search_limit,
                    scrape_content=do_scrape
                )
        
        return FirecrawlSearchTool()
        
    except ImportError as e:
        logger.error(f"CrewAI not installed: {e}. Install with: pip install crewai")
        return None
    except Exception as e:
        logger.error(f"Failed to create Firecrawl tool: {e}")
        return None


def get_firecrawl_search_tool(
    limit: int = DEFAULT_SEARCH_LIMIT,
    scrape_content: bool = True
):
    """
    Get custom Firecrawl search tool for content research.
    
    Args:
        limit: Maximum number of results (1-100, default 5)
        scrape_content: Whether to scrape full page content (default True)
    
    Returns:
        CrewAI-compatible tool or None if not configured
    """
    if not FIRECRAWL_API_KEY or FIRECRAWL_API_KEY == "your-firecrawl-api-key":
        logger.warning("Firecrawl API key not configured - search tool disabled")
        return None
    
    try:
        tool = create_firecrawl_tool(limit=limit, scrape_content=scrape_content)
        
        if tool:
            logger.info(f"FirecrawlSearchTool initialized: limit={limit}")
            return tool
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to initialize FirecrawlSearchTool: {e}")
        return None


def get_sports_news_tool(limit: int = 5):
    """
    Get search tool optimized for sports news.
    """
    return get_firecrawl_search_tool(limit=limit, scrape_content=True)


def get_web_search_tool(limit: int = 5):
    """
    Get general web search tool.
    """
    return get_firecrawl_search_tool(limit=limit, scrape_content=True)


def get_research_tools(limit: int = 5) -> list:
    """
    Get all configured research tools for content researcher agent.
    
    Args:
        limit: Maximum results per search (1-100, default 5)
    
    Returns:
        List of initialized CrewAI tools (empty list if none available)
    """
    tools = []
    
    # Add custom Firecrawl search tool
    firecrawl_tool = get_firecrawl_search_tool(limit=limit, scrape_content=True)
    
    if firecrawl_tool:
        tools.append(firecrawl_tool)
    
    # Future tools can be added here:
    # - SerperDevTool for Google search fallback
    # - WebsiteSearchTool for specific sports sites
    # - YoutubeVideoSearchTool for video highlights research
    
    if not tools:
        logger.warning("No research tools available - agents will use LLM knowledge only")
    else:
        logger.info(f"Loaded {len(tools)} research tool(s)")
    
    return tools


def get_all_research_tools(limit: int = 5) -> list:
    """
    Get all available research tools for comprehensive research.
    
    Args:
        limit: Maximum results per tool
    
    Returns:
        List of initialized CrewAI tools
    """
    return get_research_tools(limit=limit)

