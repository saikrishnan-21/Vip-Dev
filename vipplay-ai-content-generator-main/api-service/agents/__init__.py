"""
CrewAI agents for content generation
"""

from .content_researcher import create_researcher_agent, create_research_task
from .content_writer import create_writer_agent, create_writing_task
from .seo_optimizer import create_seo_optimizer_agent, create_seo_task
from .crew_config import create_content_generation_crew, create_bulk_generation_crew, create_spin_article_crew
from .tools_config import get_firecrawl_search_tool, get_research_tools

__all__ = [
    "create_researcher_agent",
    "create_research_task",
    "create_writer_agent",
    "create_writing_task",
    "create_seo_optimizer_agent",
    "create_seo_task",
    "create_content_generation_crew",
    "create_bulk_generation_crew",
    "create_spin_article_crew",
    "get_firecrawl_search_tool",
    "get_research_tools"
]
