"""
Content Researcher Agent
Research and gather comprehensive insights about topics
"""

import logging
from .llm_config import get_llm, get_fast_llm
from .tools_config import get_research_tools
from crewai import Agent, Task

logger = logging.getLogger(__name__)


def create_researcher_agent(use_tools: bool = True):
    """
    Create a content researcher agent

    Args:
        use_tools: Enable research tools (FirecrawlSearchTool, etc.)

    Returns:
        CrewAI Agent configured for content research
    """
    # PERFORMANCE OPTIMIZATION: Use faster model for research (non-critical task)
    # Research quality is less critical than writing quality, so we can use a faster model
    llm = get_fast_llm() if not use_tools else get_llm()  # Use quality model if web search enabled
    
    # Get research tools if enabled
    tools = []
    if use_tools:
        tools = get_research_tools()
        if tools:
            logger.info(f"Researcher agent initialized with {len(tools)} tool(s) and quality model")
        else:
            logger.warning("No research tools available for researcher agent")
    else:
        logger.info("Researcher agent using fast model (web search disabled)")
    
    return Agent(
        role="Expert Content Researcher for Fantasy Sports",
        goal="Research and gather comprehensive, unique insights about {topic} that will make the content stand out",
        backstory="""You're an elite content researcher with years of experience in fantasy football
        and US varsity sports. You specialize exclusively in US sports culture, US leagues (NFL, NBA, MLB, NHL, NCAA),
        US teams, US players, and US sports terminology. You have a talent for discovering lesser-known facts, emerging trends,
        and connecting different concepts to create fresh perspectives. Your research always goes beyond
        surface-level information to find truly valuable insights that others miss. You excel at finding
        player statistics, injury reports, matchup analysis, and expert opinions from US sports sources.
        All your research focuses on US sports context - when you see "football" you think American football,
        not soccer. You reference US venues, US sports culture, and US-specific sports terminology.
        
        **CRITICAL WORKFLOW:**
        1. ALWAYS use the Web Search tool FIRST to find current, real information
        2. Perform multiple searches with different query variations to gather comprehensive data
        3. Extract REAL URLs from every search result - look for the "URL:" field in tool output
        4. Document every source with its full URL, source name, and what information it provided
        5. NEVER create placeholder URLs or use generic homepage URLs
        6. Verify every URL is real and accessible (starts with http:// or https://)
        7. Collect minimum 3 sources, preferably 5-10 for comprehensive coverage
        
        When you have access to search tools, YOU MUST USE THEM. Do not rely on training data alone.
        Search for recent articles, news, statistics, and expert opinions. Extract the actual URLs
        from search results and document them properly in the SOURCES section.""",
        tools=tools,
        llm=llm,
        inject_date=True,
        date_format="%B %d, %Y",

    )


def create_research_task(topic: str, keywords: list = None, trend_context: dict = None):
    """
    Create a research task for the content researcher

    Args:
        topic: Topic to research
        keywords: Optional list of focus keywords
        trend_context: Optional dict with trend metadata (url, description, source, related_queries)

    Returns:
        CrewAI Task (agent will be assigned in crew_config.py)
    """
    keyword_str = ", ".join(keywords) if keywords else "relevant keywords"

    # Build trend context section if available
    trend_section = ""
    if trend_context:
        trend_section = "\n\n        TRENDING TOPIC CONTEXT (from Google Trends):\n"
        if trend_context.get("description"):
            trend_section += f"        - Description: {trend_context['description']}\n"
        if trend_context.get("source"):
            trend_section += f"        - News Source: {trend_context['source']}\n"
        if trend_context.get("url"):
            trend_section += f"        - News Article URL: {trend_context['url']}\n"
            trend_section += "          IMPORTANT: Use your search tool to crawl this URL and extract the full article content.\n"
        if trend_context.get("related_queries"):
            related = ", ".join(trend_context["related_queries"])
            trend_section += f"        - Related Searches: {related}\n"
        trend_section += "\n        Use this context to understand WHY this topic is trending and write timely, relevant content.\n"

    # PERFORMANCE OPTIMIZATION: Simplified prompt for faster processing
    # Removed verbose instructions while keeping essential requirements
    search_instruction = ""
    if use_tools:
        search_instruction = "\n        **SEARCH TOOLS:** Use Web Search tool to find current information. Extract real URLs from search results."
    
    return Task(
        description=f"""Research '{topic}' for US sports content. Focus on US leagues (NFL, NBA, MLB, NHL, NCAA), US teams, US players.

        Gather: statistics, expert opinions, trends, unique angles, player data, injury reports.
        Keywords: {keyword_str}{trend_section}{search_instruction}
        
        **SOURCES:** End with ---SOURCES--- section listing all URLs used (extract from search results if tools enabled).
        Format: 1. Source Name - https://url.com/article - Description
        
        Output: Research document with insights and SOURCES section.""",
        expected_output="Research document with key insights and SOURCES section with real URLs"
        # NOTE: agent is assigned in crew_config.py
    )
