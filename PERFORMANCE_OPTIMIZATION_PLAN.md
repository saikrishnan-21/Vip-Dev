# Performance Optimization Plan
## Reduce Article & Image Generation Time from 45s+ to <30s

## Current Bottlenecks Identified

### 1. **Resource Lock - Sequential Article Processing** ⚠️ CRITICAL
- **Issue**: `resource_lock.article_generation()` forces articles to process one at a time
- **Impact**: If 3 articles are queued, they wait sequentially (45s × 3 = 135s total)
- **Location**: `api-service/services/resource_lock.py`, `api-service/routers/generation.py`

### 2. **CrewAI Sequential Process** ⚠️ HIGH
- **Issue**: `Process.sequential` means Research → Write → SEO happens one after another
- **Impact**: Each step waits for previous to complete (15s + 20s + 10s = 45s)
- **Location**: `api-service/agents/crew_config.py`

### 3. **Web Search Tool Calls** ⚠️ HIGH
- **Issue**: Research agent makes multiple web searches (FirecrawlSearchTool)
- **Impact**: Each search takes 3-5 seconds, multiple searches = 10-15s
- **Location**: `api-service/agents/content_researcher.py`

### 4. **Image Generation Waiting for Articles** ⚠️ MEDIUM
- **Issue**: Images wait for articles to complete (resource lock)
- **Impact**: Image generation delayed unnecessarily
- **Location**: `api-service/services/resource_lock.py`

### 5. **Multiple LLM Calls** ⚠️ MEDIUM
- **Issue**: 3 separate LLM calls (Researcher, Writer, SEO) sequentially
- **Impact**: Each call takes 5-10s, total 15-30s
- **Location**: `api-service/agents/crew_config.py`

## Optimization Solutions

### Solution 1: Remove/Relax Resource Lock (Fastest Win) 🚀

**Change**: Allow 2-3 articles to generate in parallel instead of sequential

**Files to Modify**:
- `api-service/services/resource_lock.py`
- `api-service/routers/generation.py`

**Implementation**:
```python
# Change from single lock to semaphore (allows N concurrent)
class ResourceLockManager:
    def __init__(self):
        # Allow 2-3 concurrent articles instead of 1
        self._article_semaphore = asyncio.Semaphore(2)  # Allow 2 concurrent
        
    @asynccontextmanager
    async def article_generation(self):
        await self._article_semaphore.acquire()
        try:
            yield
        finally:
            self._article_semaphore.release()
```

**Expected Improvement**: 50-60% faster (45s → 20-25s for parallel articles)

### Solution 2: Optimize CrewAI Process (Parallel Where Possible) 🚀

**Change**: Make Research and initial writing parallel, then SEO sequential

**Files to Modify**:
- `api-service/agents/crew_config.py`

**Implementation**:
```python
# Use hierarchical process instead of sequential
crew = Crew(
    agents=agents,
    tasks=tasks,
    process=Process.hierarchical,  # Allows some parallelization
    # OR use Process.sequential but optimize task dependencies
)
```

**Expected Improvement**: 20-30% faster (45s → 30-35s)

### Solution 3: Reduce Web Search Calls (Fast Win) ⚡

**Change**: Make web search optional or limit to 1-2 searches

**Files to Modify**:
- `api-service/agents/content_researcher.py`
- `api-service/routers/generation.py`

**Implementation**:
```python
# Option 1: Disable web search by default for faster generation
use_tools: bool = False  # Default to False

# Option 2: Limit search calls
# In researcher agent, limit to max 2 searches instead of 5-10
```

**Expected Improvement**: 10-15s faster (45s → 30-35s)

### Solution 4: Use Faster Models for Non-Critical Tasks ⚡

**Change**: Use smaller/faster models for research and SEO, keep quality model for writing

**Files to Modify**:
- `api-service/agents/llm_config.py`
- `api-service/agents/content_researcher.py`
- `api-service/agents/seo_optimizer.py`

**Implementation**:
```python
# Use fast model for research (less critical)
researcher_llm = ChatOllama(
    model="qwen2.5:3b",  # Fast model
    base_url=OLLAMA_BASE_URL,
    temperature=0.7
)

# Use quality model for writing (critical)
writer_llm = ChatOllama(
    model="qwen2.5:7b",  # Quality model
    base_url=OLLAMA_BASE_URL,
    temperature=0.7
)
```

**Expected Improvement**: 5-10s faster (45s → 35-40s)

### Solution 5: Optimize Image Generation (Remove Article Dependency) ⚡

**Change**: Allow images to generate independently of articles

**Files to Modify**:
- `api-service/services/resource_lock.py`
- `api-service/routers/images.py`

**Implementation**:
```python
# Remove image wait for articles (already partially done)
# Ensure standalone images don't wait
@router.post("/generate")
async def generate_image(request: ImageGenerationRequest):
    # No resource lock needed for standalone images
    # Already implemented, but verify it's working
```

**Expected Improvement**: Images generate immediately (0s wait time)

### Solution 6: Cache Research Results (Medium-term) 💾

**Change**: Cache research results for similar topics

**Files to Modify**:
- `api-service/agents/content_researcher.py`
- Add caching service

**Implementation**:
```python
# Cache research for 1 hour
# If same topic requested within 1 hour, use cached research
```

**Expected Improvement**: 10-15s faster for repeated topics

### Solution 7: Reduce Word Count or Simplify Prompts (Quick Win) ⚡

**Change**: Optimize prompts to be more concise, reduce unnecessary instructions

**Files to Modify**:
- `api-service/agents/crew_config.py`
- `api-service/agents/content_researcher.py`
- `api-service/agents/content_writer.py`

**Expected Improvement**: 5-10s faster

## Recommended Implementation Order

### Phase 1: Quick Wins (Implement First) - Target: 45s → 30s
1. ✅ **Remove resource lock** (allow 2-3 parallel articles) - **BIGGEST IMPACT**
2. ✅ **Disable web search by default** (make it optional)
3. ✅ **Use faster models for research/SEO** (keep quality for writing)

### Phase 2: Medium-term (Target: 30s → 25s)
4. ✅ **Optimize CrewAI process** (hierarchical or better task dependencies)
5. ✅ **Simplify prompts** (remove unnecessary instructions)

### Phase 3: Long-term (Target: 25s → 20s)
6. ✅ **Add research caching**
7. ✅ **Further model optimization**

## Expected Results

| Optimization | Current Time | After Optimization | Improvement |
|--------------|--------------|-------------------|-------------|
| Baseline | 45s+ | 45s+ | 0% |
| Remove Resource Lock | 45s+ | 25-30s | 33-44% |
| + Disable Web Search | 25-30s | 20-25s | 20-25% |
| + Faster Models | 20-25s | 18-22s | 10-15% |
| + Optimize CrewAI | 18-22s | 15-20s | 15-20% |
| **TOTAL** | **45s+** | **15-20s** | **55-67%** |

## Implementation Priority

**CRITICAL (Do First)**:
1. Remove/relax resource lock - **BIGGEST IMPACT**
2. Disable web search by default

**HIGH (Do Second)**:
3. Use faster models for non-critical tasks
4. Optimize CrewAI process

**MEDIUM (Do Third)**:
5. Simplify prompts
6. Add caching

Let's start with Phase 1 optimizations!

