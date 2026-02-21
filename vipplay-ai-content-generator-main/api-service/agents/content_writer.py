"""
Content Writer Agent
Transform research into engaging, SEO-optimized content
"""

from statistics import multimode
from .llm_config import get_llm
from crewai import Agent, Task


def create_writer_agent():
    """
    Create a content writer agent

    Args:
    Returns:
        CrewAI Agent configured for content writing
    """
    llm = get_llm()
    
    return Agent(
        role="Professional Content Writer specializing in Fantasy Sports",
        goal="Transform research insights into engaging, authoritative content that provides 10x more value than typical articles",
        backstory="""You're a master content writer known for creating exceptional, engaging content
        about fantasy football and US varsity sports. You specialize exclusively in US sports culture,
        US leagues (NFL, NBA, MLB, NHL, NCAA), US teams, US players, and US sports terminology.
        Your writing style combines deep US sports expertise with storytelling elements to make complex
        analysis accessible while maintaining depth. You're particularly skilled at structuring content
        for maximum impact and reader engagement, always ensuring the content provides unique value
        that can't be found elsewhere. You know how to optimize for SEO without sacrificing readability,
        and you understand what US fantasy sports enthusiasts really want to read. All your content
        reflects US sports context - when you write about "football" you mean American football,
        not soccer. You reference US venues, US sports culture, and US-specific sports terminology.""",
        tools=[
            # TODO: Add tools when implemented
            # - seo_tool: SEO optimization analysis
            # - readability_tool: Readability score calculator
        ],
        llm=llm,
        allow_delegation=False,
        inject_date=True,
        date_format="%B %d, %Y",
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
        "natural": "Natural keyword integration (1-2% density) - prioritize readability",
        "light": "Light keyword density (1-2%) - subtle keyword usage",
        "medium": "Medium keyword density (2-3%) - balanced SEO optimization",
        "heavy": "Heavy keyword density (3-4%) - aggressive SEO focus while avoiding stuffing"
    }
    return density_map.get(keyword_density.lower(), density_map["natural"])


def get_structure_instruction(content_structure: str) -> str:
    """
    Convert content structure setting to specific template instructions for the AI.
    
    Args:
        content_structure: Structure type (auto, listicle, how-to-guide, analysis)
        
    Returns:
        Detailed template instructions for the AI about article structure
    """
    structure_templates = {
        "auto": """Choose the most appropriate structure based on the topic and research.
        Use your judgment to create a well-organized article that best serves the reader.""",
        
        "listicle": """Structure the article as a LISTICLE (numbered list format):
        
        **Required Format:**
        - Start with a compelling introduction (2-3 paragraphs) explaining what the list covers
        - Use numbered headings for each item (e.g., "## 1. [Item Title]", "## 2. [Item Title]")
        - Include 5-15 items depending on word count (aim for 100-200 words per item)
        - Each list item should have:
          * A clear, descriptive heading
          * 2-3 paragraphs of explanation/analysis
          * Specific stats, data, or examples
        - End with a brief conclusion summarizing key takeaways
        
        **Example Structure:**
        # [Title]: Top X [Topic]
        [Introduction explaining the list]
        ## 1. [First Item]
        [Details and analysis]
        ## 2. [Second Item]
        [Details and analysis]
        ... continue ...
        ## Conclusion
        [Summary and final thoughts]""",
        
        "how-to-guide": """Structure the article as a HOW-TO GUIDE (step-by-step tutorial):
        
        **Required Format:**
        - Start with an introduction explaining what readers will learn and why it matters
        - Include a "What You'll Need" or "Prerequisites" section if applicable
        - Use numbered step headings (e.g., "## Step 1: [Action]", "## Step 2: [Action]")
        - Each step should include:
          * Clear, actionable instructions
          * Tips or pro-tips where helpful
          * Common mistakes to avoid
          * Visual cues like [IMAGE: screenshot of...] where helpful
        - Include a "Troubleshooting" or "Common Issues" section if applicable
        - End with a "Next Steps" or "Conclusion" section
        
        **Example Structure:**
        # How to [Achieve Goal]
        [Introduction explaining the goal]
        ## What You'll Need
        [Prerequisites list]
        ## Step 1: [First Action]
        [Detailed instructions]
        ## Step 2: [Second Action]
        [Detailed instructions]
        ... continue ...
        ## Tips for Success
        [Additional advice]
        ## Conclusion
        [Summary and next steps]""",
        
        "analysis": """Structure the article as an IN-DEPTH ANALYSIS (analytical/editorial):
        
        **Required Format:**
        - Start with an executive summary/thesis statement
        - Organize into logical sections with thematic headings
        - Include multiple perspectives and data-driven insights
        - Each section should include:
          * Clear thesis/main point
          * Supporting evidence (stats, quotes, examples)
          * Analysis and interpretation
          * Implications or predictions
        - Use comparison tables or data visualizations where appropriate
        - Include "Key Takeaways" callout boxes
        - End with conclusions and forward-looking implications
        
        **Example Structure:**
        # [Analytical Title]: [Subject] Analysis
        ## Executive Summary
        [Key findings overview]
        ## Background/Context
        [Setting the stage]
        ## Analysis Section 1: [Theme]
        [Deep dive with data]
        ## Analysis Section 2: [Theme]
        [Deep dive with data]
        ## Implications
        [What this means]
        ## Conclusion
        [Final thoughts and predictions]"""
    }
    return structure_templates.get(content_structure.lower(), structure_templates["auto"])


def create_writing_task(
    topic: str,
    word_count: int = 1500,
    tone: str = "Professional",
    seo_optimization: bool = True,
    keywords: list = None,
    keyword_density: str = "natural",
    content_structure: str = "auto"
):
    """
    Create a writing task for the content writer

    Args:
        topic: Topic to write about
        word_count: Target word count
        tone: Writing tone
        seo_optimization: Whether to optimize for SEO
        keywords: Focus keywords for SEO
        keyword_density: Target keyword density (natural, light, medium, heavy)
        content_structure: Article structure type (auto, listicle, how-to-guide, analysis)

    Returns:
        CrewAI Task (agent and context will be assigned in crew_config.py)
    """
    keyword_str = ", ".join(keywords) if keywords else "fantasy football, sports analysis"
    seo_note = "Optimize heavily for SEO with target keywords naturally integrated." if seo_optimization else "Focus on readability over SEO."
    density_instruction = get_density_instruction(keyword_density)
    structure_instruction = get_structure_instruction(content_structure)

    # PERFORMANCE OPTIMIZATION: Simplified prompt for faster processing
    # Removed verbose validation instructions while keeping essential requirements
    return Task(
        description=f"""Write a {word_count}-word article about '{topic}' using the research provided.

        **US Sports Focus:** NFL, NBA, MLB, NHL, NCAA. Use US terminology (football = American football).
        
        **Structure:** {structure_instruction}
        
        **Requirements:**
        - Compelling intro, unique insights, US sports stats, strong conclusion
        - {tone} tone throughout
        - Target keywords: {keyword_str}
        - {seo_note}
        - {density_instruction}
        
        **Format:** Markdown. End with "## References" section listing all URLs from research ---SOURCES--- section.
        Format: [Source Name](URL) - Description
        
        Output: Complete article in Markdown with References section.""",
        expected_output="Article in Markdown format with References section"
        # NOTE: agent and context=[research_task] are assigned in crew_config.py
    )
