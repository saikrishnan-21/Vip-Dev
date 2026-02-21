"""
SEO Optimizer Agent
Analyzes and optimizes content for search engines
"""

from .llm_config import get_llm, get_fast_llm
from crewai import Agent, Task


def create_seo_optimizer_agent():
    """
    Create an SEO optimizer agent

    Args:

    Returns:
        CrewAI Agent configured for SEO optimization
    """
    # PERFORMANCE OPTIMIZATION: Use faster model for SEO (non-critical task)
    # SEO optimization is less critical than writing quality, so we can use a faster model
    llm = get_fast_llm()
    return Agent(
        role="Expert SEO Specialist for Sports Content",
        goal="Optimize content for maximum search engine visibility while maintaining quality and readability",
        backstory="""You're a seasoned SEO specialist with deep expertise in sports content optimization.
        You understand how to balance keyword optimization with natural readability. You're skilled at
        identifying content gaps, structuring headings for SEO, and ensuring
        proper keyword density without keyword stuffing. You know exactly what makes sports content rank
        well on Google while still being valuable to readers.""",
        tools=[
            # TODO: Add tools when implemented
            # - keyword_analyzer: Analyze keyword density and placement
            # - readability_checker: Check content readability scores
        ],
        llm=llm
    )


def get_density_instruction(keyword_density: str) -> str:
    """
    Convert keyword density setting to specific instruction for the AI.
    
    Args:
        keyword_density: Density level (natural, light, medium, heavy)
        
    Returns:
        String instruction for the AI about keyword density
    """
    density_map = {
        "natural": "1-2% density - prioritize natural readability",
        "light": "1-2% density - subtle and minimal keyword usage",
        "medium": "2-3% density - balanced optimization",
        "heavy": "3-4% density - aggressive SEO but avoid stuffing"
    }
    return density_map.get(keyword_density.lower(), density_map["natural"])


def create_seo_task(keywords: list = None, keyword_density: str = "natural"):
    """
    Create an SEO optimization task for the SEO optimizer agent

    Args:
        keywords: Target keywords for SEO optimization
        keyword_density: Target keyword density (natural, light, medium, heavy)

    Returns:
        CrewAI Task (agent and context will be assigned in crew_config.py)
    """
    keyword_str = ", ".join(keywords) if keywords else "fantasy football, sports analysis"
    density_instruction = get_density_instruction(keyword_density)

    return Task(
        description=f"""Take the article provided in the context (from the writer) and optimize it for SEO:

        1. **Keyword Optimization**:
           - Target keywords: {keyword_str}
           - Target keyword density: {density_instruction}
           - Add keywords to headings where appropriate
           - Include semantic variations and LSI keywords

        2. **Meta Data**:
           - Create an SEO-optimized title (50-60 characters)
           - Suggest URL slug

        3. **Content Structure**:
           - Verify proper heading hierarchy (H1, H2, H3)
           - Ensure headings contain target keywords naturally
           - Optimize image alt text suggestions

        4. **Readability Check**:
           - Ensure paragraphs are not too long (max 3-4 sentences)
           - Check for passive voice overuse
           - Verify content flows naturally despite SEO optimization

        5. **Output Format**:
           Return the optimized article in Markdown format (DO NOT wrap in code fences).
           
           Output ONLY the article content in Markdown format.
           Do NOT include any metadata headers, SEO fields, or special formatting markers.

        CRITICAL RULES:
        - Do NOT wrap output in ```markdown code fences
        - Output must be plain Markdown text (article content only)
        - Maintain the article's quality and readability
        - Do not keyword stuff
        - Do NOT include any metadata fields, headers, or special markers
        - Images will be added automatically after optimization - do NOT add any [IMAGE_PROMPT] tags""",
        expected_output="SEO-optimized article in Markdown format with proper keyword integration"
        # NOTE: agent and context=[writing_task] are assigned in crew_config.py
    )
