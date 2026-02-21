"""
CrewAI Crew Configuration
Orchestrates the multi-agent content generation workflow
"""

from crewai import Crew, Process, Task
from .content_researcher import create_researcher_agent, create_research_task
from .content_writer import create_writer_agent, create_writing_task
from .seo_optimizer import create_seo_optimizer_agent, create_seo_task
from .llm_config import get_llm


def create_bulk_generation_crew(
    word_count: int = 1200,  # Reduced from 1500 for faster generation
    tone: str = "Professional",
    seo_optimization: bool = True,
    use_tools: bool = True,
    keyword_density: str = "natural",
    content_structure: str = "auto"
):
    """
    Create a crew configured for bulk generation using kickoff_for_each_async.
    
    Uses placeholder variables {topic}, {keywords} that will be filled by inputs.
    
    Args:
        word_count: Target word count for articles
        tone: Writing tone
        seo_optimization: Whether to optimize for SEO
        use_tools: Enable research tools
        keyword_density: Target keyword density
        content_structure: Article structure type
        
    Returns:
        Crew configured for bulk execution with placeholder variables
    """
    from .content_writer import get_density_instruction, get_structure_instruction
    
    # Create agents
    researcher = create_researcher_agent(use_tools=use_tools)
    writer = create_writer_agent()
    
    density_instruction = get_density_instruction(keyword_density)
    structure_instruction = get_structure_instruction(content_structure)
    seo_note = "Optimize heavily for SEO with target keywords naturally integrated." if seo_optimization else "Focus on readability over SEO."
    
    # Research task with placeholder variables
    research_task = Task(
        description="""Research '{topic}' thoroughly and gather information focused on US sports context:

        **US CONTEXT REQUIREMENT:**
        - All research must focus on US sports, US teams, US players, and US sports culture
        - Use US-specific terminology (e.g., "football" = American football, not soccer)
        - Reference US leagues: NFL, NBA, MLB, NHL, NCAA, etc.
        - Focus on US sports venues, US sports media, and US sports culture
        - All statistics, data, and insights should be US-focused

        1. Latest statistics and data points about {topic} (US sports context)
        2. Expert opinions and quotes from credible US sports sources
        3. Emerging trends and predictions in US fantasy sports
        4. Unique angles not commonly covered in mainstream US sports content
        5. Related topics and connections to current US sports events
        6. US player performance data, injury reports, US team matchup analysis

        Focus keywords: {keywords}

        **MANDATORY - USE SEARCH TOOLS:**
        You MUST use the Web Search tool to find REAL, CURRENT information. Do NOT rely on your training data alone.
        Search for recent articles, news, statistics, and expert opinions about {topic}.
        Perform multiple searches if needed to gather comprehensive information.
        
        **CRITICAL - SOURCE TRACKING REQUIREMENT:**
        You MUST collect and document ALL source URLs for every piece of information you gather.
        For each fact, statistic, quote, or insight, record:
        - The source name (website/publication name)
        - The full URL where the information was found (MUST be a real, accessible URL)
        - A brief description of what information came from that source
        
        **STRICT RULES FOR SOURCES:**
        1. ALL URLs MUST be real, accessible URLs (starting with http:// or https://)
        2. Extract URLs directly from search tool results - look for the "URL:" field in search results
        3. DO NOT create placeholder URLs like "[URL]" or "https://example.com"
        4. DO NOT use generic URLs like "https://espn.com" without a specific article path
        5. Each source MUST have a unique, specific URL to a real article or page
        6. Minimum 3 sources required, preferably 5-10 sources for comprehensive coverage
        
        **Output Format:**
        Your research document MUST end with a clearly formatted "SOURCES" section listing ALL 
        referenced URLs in this EXACT format (replace placeholders with REAL data):
        
        ---SOURCES---
        1. ESPN - https://www.espn.com/nfl/story/_/id/12345678/article-title - Player statistics and game results
        2. Yahoo Sports - https://sports.yahoo.com/nfl/article-12345 - Expert analysis and predictions
        3. NFL.com - https://www.nfl.com/news/article-title-123 - Injury reports and team updates
        ... (continue for all sources with REAL URLs)
        ---END SOURCES---

        **VALIDATION:**
        Before submitting, verify:
        - Every URL starts with http:// or https://
        - Every URL is unique (no duplicates)
        - Every URL points to a specific article/page (not just a homepage)
        - At least 3 sources are included
        - All URLs were extracted from actual search tool results

        Output: Comprehensive research document with sources, key insights, and data points
        that will be used to create an authoritative article. The SOURCES section is MANDATORY and must contain ONLY real URLs.""",
        expected_output="Detailed research document with statistics, unique insights, AND a complete SOURCES section with all referenced URLs",
        agent=researcher
    )
    
    # Writing task with placeholder variables
    writing_task = Task(
        description=f"""Using the research provided in the context, write a {word_count}-word article about '{{topic}}'.

        **US CONTEXT REQUIREMENT:**
        - All content must focus on US sports, US teams, US players, and US sports culture
        - Use US-specific terminology (e.g., "football" = American football, not soccer)
        - Reference US leagues: NFL, NBA, MLB, NHL, NCAA, etc.
        - Use US sports venues, US sports media references, and US sports culture
        - All statistics, data, and insights should be US-focused

        **CONTENT STRUCTURE (IMPORTANT - Follow this template exactly):**
        {structure_instruction}

        **Writing Requirements:**
        1. Has a compelling introduction that hooks US fantasy sports enthusiasts
        2. Provides unique insights and actionable advice for US sports context
        3. Includes relevant US sports statistics, data points, and expert quotes from US sources
        4. Has a strong conclusion with key takeaways and actionable recommendations for US sports
        5. Maintains a {tone} tone throughout
        6. Includes specific US player names, US team matchups, and concrete US sports analysis

        **SEO Requirements:**
        - Target keywords: {{keywords}}
        - {seo_note}
        - {density_instruction}
        - Use descriptive headings with keywords

        **Format:**
        - Use Markdown formatting
        
        **Images:**
        Note: Images will be automatically generated and embedded after article creation.
        Focus on writing high-quality content - do NOT include any [IMAGE_PROMPT] tags.
        
        **MANDATORY - REFERENCES/CITATIONS SECTION (THIS IS CRITICAL):**
        The article MUST end with a "## References" or "## Sources" section that lists ALL sources 
        used from the research. This is NON-NEGOTIABLE and REQUIRED for every article.
        
        **STRICT RULES FOR REFERENCES:**
        1. Extract ALL source URLs from the research context's ---SOURCES--- section
        2. Use ONLY the URLs provided in the research - DO NOT create new URLs
        3. DO NOT use placeholder URLs like "[URL]" or generic URLs like "https://espn.com"
        4. DO NOT create placeholder references - if research has no URLs, you MUST request better research
        5. Every reference MUST be a real, accessible URL (starting with http:// or https://)
        6. Format references in Markdown link format: [Source Name](Full URL) - Description
        
        **Format:**
        ## References
        
        1. [ESPN](https://www.espn.com/nfl/story/_/id/12345678/article-title) - Player statistics and game results
        2. [Yahoo Sports](https://sports.yahoo.com/nfl/article-12345) - Expert analysis and predictions
        3. [NFL.com](https://www.nfl.com/news/article-title-123) - Injury reports and team updates
        ... (include ALL sources from research with their REAL URLs)
        
        **VALIDATION:**
        Before submitting, verify:
        - Every URL in References section was extracted from the research's ---SOURCES--- section
        - Every URL is a real, accessible URL (starts with http:// or https://)
        - No placeholder URLs like "[URL]" or "[Source Name]"
        - No generic homepage URLs without specific article paths
        - All URLs match exactly what was provided in the research
        
        If the research does not include a ---SOURCES--- section with real URLs, you MUST note this 
        as an error and request that the research agent provide proper sources. DO NOT create 
        placeholder references under any circumstances.
        
        DO NOT skip the References section under ANY circumstances.

        **Output:** Complete article in Markdown format with SEO metadata, image suggestions, AND 
        a complete References section at the end with all source links.""",
        expected_output="Publication-ready article in Markdown format with a MANDATORY References section containing all source URLs at the end",
        agent=writer,
        context=[research_task]
    )
    
    agents = [researcher, writer]
    tasks = [research_task, writing_task]
    
    # Add SEO optimizer if enabled
    if seo_optimization:
        seo_optimizer = create_seo_optimizer_agent()
        seo_task = Task(
            description="""Optimize the article for SEO while maintaining readability.
            
            Target keywords: {keywords}
            
            Tasks:
            1. Ensure keywords appear naturally in headings, first paragraph, and throughout
            2. Suggest title tag (50-60 characters)
            3. Check heading hierarchy (H1, H2, H3)
            4. Add alt text suggestions for images
            
            Output the fully optimized article with all SEO improvements applied.""",
            expected_output="SEO-optimized article with optimized headings and keyword integration",
            agent=seo_optimizer,
            context=[writing_task]
        )
        agents.append(seo_optimizer)
        tasks.append(seo_task)
    
    # Create crew
    crew = Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,
        stream=True
    )
    
    return crew


def create_content_generation_crew(
    topic: str,
    word_count: int = 1200,  # Reduced from 1500 for faster generation
    tone: str = "Professional",
    keywords: list = None,
    seo_optimization: bool = True,
    use_tools: bool = True,
    trend_context: dict = None,
    keyword_density: str = "natural",
    content_structure: str = "auto"
):
    """
    Create a complete content generation crew with agents and tasks

    Args:
        topic: Topic to generate content about
        word_count: Target word count for the article
        tone: Writing tone (Professional, Casual, etc.)
        keywords: Focus keywords for SEO
        seo_optimization: Whether to optimize for SEO
        use_tools: Enable research tools (FirecrawlSearchTool for web search)
        trend_context: Optional dict with trend metadata (url, description, source, related_queries)
        keyword_density: Target keyword density (natural, light, medium, heavy)
        content_structure: Article structure type (auto, listicle, how-to-guide, analysis)

    Returns:
        Configured CrewAI Crew ready to execute
    """
    # Create agents
    researcher = create_researcher_agent(use_tools=use_tools)
    writer = create_writer_agent()

    # Create tasks
    research_task = create_research_task(topic=topic, keywords=keywords, trend_context=trend_context)
    research_task.agent = researcher

    writing_task = create_writing_task(
        topic=topic,
        word_count=word_count,
        tone=tone,
        seo_optimization=seo_optimization,
        keywords=keywords,
        keyword_density=keyword_density,
        content_structure=content_structure
    )
    writing_task.agent = writer
    writing_task.context = [research_task]  # Writer uses researcher's output

    # Build agents and tasks lists
    agents = [researcher, writer]
    tasks = [research_task, writing_task]

    # Add SEO optimizer if enabled
    if seo_optimization:
        seo_optimizer = create_seo_optimizer_agent()
        seo_task = create_seo_task(keywords=keywords, keyword_density=keyword_density)
        seo_task.agent = seo_optimizer
        seo_task.context = [writing_task]  # SEO optimizer uses writer's output

        agents.append(seo_optimizer)
        tasks.append(seo_task)

    # Create crew
    # PERFORMANCE: Sequential process is required for task dependencies (Research → Write → SEO)
    # Cannot use hierarchical/parallel due to context dependencies
    crew = Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,  # Research → Write → SEO Optimize (required for context flow)
        verbose=False,  # Disable verbose logging for faster execution
    )

    return crew


def create_spin_article_crew(
    original_content: str,
    spin_angle: str = "fresh perspective",
    spin_intensity: str = "medium",  # light, medium, heavy
    word_count: int = 1200,  # Reduced from 1500 for faster generation
    tone: str = "Professional",
    seo_optimization: bool = True,
    content_structure: str = "auto"
):
    """
    Create a crew for spinning/rewriting existing articles (VIP-10207)
    
    Uses ONLY Writer + SEO agents (NO Research agent) as per story requirements.
    
    Args:
        original_content: The original article content to spin
        spin_angle: The angle/perspective for the spin (e.g., "fresh perspective", "different audience")
        spin_intensity: How much to rewrite (light: 30-50%, medium: 50-70%, heavy: 70-90%)
        word_count: Target word count for the spun article
        tone: Writing tone (Professional, Casual, etc.)
        seo_optimization: Whether to optimize for SEO
        content_structure: Article structure type (auto, listicle, how-to-guide, analysis)
        
    Returns:
        Configured CrewAI Crew ready to execute (Writer + SEO only)
    """
    from .content_writer import get_structure_instruction
    
    # Create agents (NO Research agent for spin mode)
    writer = create_writer_agent()
    
    # Map spin intensity to rewrite instructions
    intensity_instructions = {
        "light": "Light spin (30-50% rewrite): Rephrase sentences, use synonyms, keep structure, minor reorganization.",
        "medium": "Medium spin (50-70% rewrite): Rewrite all sentences, moderate restructuring, different intro/conclusion.",
        "heavy": "Heavy spin (70-90% rewrite): Complete rewrite, different angle/perspective, major restructuring."
    }
    intensity_instruction = intensity_instructions.get(spin_intensity, intensity_instructions["medium"])
    
    # Get structure instruction
    structure_instruction = get_structure_instruction(content_structure)
    
    # Writing task - rewrite the original article
    writing_task = Task(
        description=f"""Rewrite the following article with a {spin_intensity} spin focusing on: {spin_angle}.

        **Original Article:**
        {original_content}

        **Spin Requirements:**
        - {intensity_instruction}
        - Maintain all key facts and core information from the original
        - Target word count: {word_count} words
        - Maintain {tone} tone throughout
        - Create unique content that provides new value while covering the same core topic
        - Ensure natural, readable language (not robotic spinning)
        - Preserve readability and coherence

        **Content Structure (IMPORTANT - Follow this template exactly):**
        {structure_instruction}

        **Output:** Complete rewritten article in Markdown format following the specified structure.""",
        expected_output="Rewritten article in Markdown format that is unique but maintains core facts",
        agent=writer
    )
    
    # Build agents and tasks lists
    agents = [writer]
    tasks = [writing_task]
    
    # Add SEO optimizer if enabled
    if seo_optimization:
        seo_optimizer = create_seo_optimizer_agent()
        seo_task = Task(
            description=f"""Optimize the spun article for SEO while ensuring uniqueness.

            **Tasks:**
            1. Ensure the article maintains uniqueness (target: <30% similarity to original)
            2. Suggest title tag (50-60 characters)
            3. Check heading hierarchy (H1, H2, H3)
            4. Add alt text suggestions for images
            5. Ensure keywords appear naturally throughout
            6. Verify the article is sufficiently different from the original while maintaining facts

            **Output:** SEO-optimized spun article with optimized structure.""",
            expected_output="SEO-optimized spun article with optimized structure",
            agent=seo_optimizer,
            context=[writing_task]
        )
        agents.append(seo_optimizer)
        tasks.append(seo_task)
    
    # Create crew (NO Research agent - Writer + SEO only)
    crew = Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,  # Write → SEO Optimize
    )
    
    return crew
