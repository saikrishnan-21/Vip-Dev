# FastAPI AI Microservice - Claude Code Guidance

This file provides guidance for Claude Code when working with the FastAPI AI microservice.

## Service Purpose

This is a **microservice** focused exclusively on AI operations:
- Content generation using CrewAI multi-agent workflows
- Direct integration with Ollama local models
- LLM inference and streaming
- Vector embeddings generation
- Image generation (proxies to HuggingFace Model API)
- Video generation (proxies to HuggingFace Model API, T2V and I2V)

**What this service does NOT do**:
- Authentication (handled by Next.js)
- Database operations (handled by Next.js)
- File storage (handled by Next.js)
- User management (handled by Next.js)

## Tech Stack

- **Framework**: FastAPI 0.109+
- **AI Framework**: CrewAI for multi-agent orchestration
- **LLM Provider**: Ollama (local models only)
- **Image/Video Provider**: HuggingFace Model API (remote service on port 7860)
- **Python Version**: 3.10+
- **Models**:
  - `llama3.1:8b` - Primary content generation
  - `nomic-embed-text` - Vector embeddings
  - `black-forest-labs/FLUX.1-dev` - Image generation (via HuggingFace API)
  - `Wan-AI/Wan2.2-TI2V-5B` - Video generation (via HuggingFace API)

## Project Structure

```
api-service/
├── main.py                      # FastAPI app, routes, startup/shutdown
├── agents/
│   ├── content_researcher.py    # CrewAI researcher agent
│   ├── content_writer.py        # CrewAI writer agent
│   └── crew_config.py           # Crew setup and task definitions
├── services/
│   ├── ollama_client.py         # Ollama API wrapper
│   ├── generation_service.py    # Orchestrates generation workflow
│   ├── seo_analyzer.py          # Calculates SEO scores
│   └── readability_analyzer.py  # Flesch reading ease, etc.
├── models/
│   ├── generation_request.py    # Pydantic models for requests
│   ├── generation_response.py   # Pydantic models for responses
│   └── job_status.py            # Job progress tracking models
├── utils/
│   └── logger.py                # Logging configuration
└── tests/
    └── ...
```

## Key Concepts

### 1. Generation Modes

The service supports 4 content generation modes:

**Topic Mode**: Generate content from a topic string
```python
{
  "mode": "topic",
  "input": {"topic": "Fantasy Football Week 1 Predictions"}
}
```

**Keywords Mode**: Generate content optimized for keywords
```python
{
  "mode": "keywords",
  "input": {"keywords": ["fantasy football", "sleepers", "2025"]}
}
```

**Trends Mode**: Generate content from trending topics
```python
{
  "mode": "trends",
  "input": {"trends": ["NFL draft predictions trending"]}
}
```

**Spin Mode**: Rewrite existing content with unique angle
```python
{
  "mode": "spin",
  "input": {
    "original_content": "...",
    "uniqueness_level": "High (70-80%)"
  }
}
```

### 2. CrewAI Multi-Agent System

**Two-Agent Workflow**:

1. **Content Researcher Agent**:
   - Role: Research and gather insights
   - Task: Find unique angles, statistics, expert opinions
   - Tools: Web search, knowledge base query (optional)
   - Output: Research document with sources

2. **Content Writer Agent**:
   - Role: Write engaging, SEO-optimized content
   - Task: Transform research into publication-ready article
   - Tools: SEO optimizer, readability checker
   - Output: Complete article in markdown format

**Process**: Sequential (researcher → writer)

### 3. Ollama Integration

**Connection Pattern**:
```python
import ollama

# Simple generation
response = ollama.chat(
    model='llama3.1:8b',
    messages=[{'role': 'user', 'content': prompt}],
    options={'temperature': 0.7, 'num_predict': 4096}
)

# Streaming generation
for chunk in ollama.chat(model='llama3.1:8b', messages=messages, stream=True):
    yield chunk['message']['content']

# Embeddings
embeddings = ollama.embeddings(
    model='nomic-embed-text',
    prompt=text
)
```

### 4. SEO Analysis

Calculate SEO score (0-100) based on:
- Keyword density (target: 1-3%)
- Heading structure (H1, H2, H3 hierarchy)
- Content length (optimal: 1500-2500 words)
- Meta description presence
- Internal/external links
- Image alt text
- Paragraph length

### 5. Readability Analysis

Use Flesch Reading Ease formula:
```python
def flesch_reading_ease(text):
    total_sentences = count_sentences(text)
    total_words = count_words(text)
    total_syllables = count_syllables(text)

    score = 206.835 - 1.015 * (total_words / total_sentences) \
            - 84.6 * (total_syllables / total_words)
    return score
```

**Score Interpretation**:
- 90-100: Very Easy
- 80-89: Easy
- 70-79: Fairly Easy
- 60-69: Standard
- 50-59: Fairly Difficult
- 30-49: Difficult
- 0-29: Very Confusing

Target: 60-70 for general audience

## Development Workflow

### Running the Service

```bash
# Activate virtual environment
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Run with auto-reload
uvicorn main:app --reload --port 8000

# Access docs
open http://localhost:8000/docs
```

### Testing Ollama Connection

```bash
# Check Ollama is running (remote server)
curl http://44.197.16.15:11434/api/version

# List models
curl http://44.197.16.15:11434/api/tags

# Test model inference
curl http://44.197.16.15:11434/api/generate -d '{
  "model": "gpt-oss",
  "prompt": "Write a short paragraph about fantasy football"
}'
```

### Adding a New Endpoint

1. Define Pydantic models in `models/`
2. Create route in `main.py`
3. Implement business logic in `services/`
4. Add tests in `tests/`
5. Update docs in `README.md`

### Adding a New Agent

1. Create agent file in `agents/`
2. Define agent role, goal, backstory
3. Assign tools if needed
4. Add to crew in `crew_config.py`
5. Update tasks to include new agent

## Environment Variables

```bash
# Required - Ollama (Remote Server)
OLLAMA_BASE_URL=http://44.197.16.15:11434
DEFAULT_MODEL=gpt-oss
QUALITY_MODEL=llama3.1
EMBEDDING_MODEL=nomic-embed-text

# Required - HuggingFace Model API (Image & Video Generation)
HF_API_BASE_URL=http://44.197.16.15:7860
HF_DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
HF_DEFAULT_VIDEO_MODEL=Wan-AI/Wan2.2-TI2V-5B
HF_DEFAULT_INFERENCE_STEPS=9
HF_DEFAULT_GUIDANCE_SCALE=7.5
HF_DEFAULT_VIDEO_FRAMES=14

# Optional with defaults
MAX_TOKENS=4096
TEMPERATURE=0.7
TOP_P=0.9
LOG_LEVEL=INFO
```

## Common Patterns

### Error Handling

```python
from fastapi import HTTPException

try:
    result = ollama.chat(...)
except ollama.OllamaError as e:
    raise HTTPException(status_code=503, detail=f"Ollama error: {str(e)}")
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

### Async Operations

```python
from fastapi import BackgroundTasks

@app.post("/generate")
async def generate_content(request: GenerationRequest, background_tasks: BackgroundTasks):
    # Start generation in background
    background_tasks.add_task(run_generation, request)
    return {"job_id": job.id, "status": "queued"}
```

### Logging

```python
import logging

logger = logging.getLogger(__name__)

logger.info(f"Starting generation for user {user_id}")
logger.warning(f"Model {model} not available, falling back to default")
logger.error(f"Generation failed: {str(e)}")
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=term-missing

# Run specific test
pytest tests/test_generation.py::test_topic_generation -v

# Run with logging
pytest -v -s
```

## Performance Considerations

### Model Selection
- Use `gpt-oss` for default content generation (as configured in .env)
- Use `llama3.1` for quality content generation (as configured in .env)
- Alternative: `llama3.1:8b` for fast generation (bulk operations)
- Alternative: `llama3.1:70b` for high-quality content (premium)
- Consider quantized models (Q4_K_M) for faster inference

### Token Limits
- Default `max_tokens=4096` suitable for 1500-2000 word articles
- Increase to 8192 for longer content
- Monitor token usage to prevent truncation

### Concurrent Requests
- FastAPI handles concurrency well with async/await
- Ollama can handle multiple simultaneous requests
- Use background tasks for long-running generations

### Caching
- Cache model responses for identical prompts
- Cache embeddings for frequently used texts
- Use Redis for distributed caching (future)

## Integration with Next.js Backend

**Communication Flow**:
```
User → Next.js Frontend → Next.js API Route → FastAPI Service → Ollama
```

**Next.js calls FastAPI**:
```typescript
// Next.js API route (app/api/generate/route.ts)
const response = await fetch('http://localhost:8000/generate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    mode: 'topic',
    input: {topic: 'Fantasy Football'},
    settings: {...},
    user_id: userId
  })
});
```

**FastAPI returns**:
```json
{
  "job_id": "abc123",
  "status": "processing",
  "content": null  // or final content if complete
}
```

**Next.js stores in MongoDB**:
- Job status in `generation_jobs` collection
- Final content in `generated_content` collection

## Debugging Tips

### Verbose Mode
Enable CrewAI verbose output:
```python
crew = Crew(agents=[...], tasks=[...], verbose=True)
```

### Ollama Logs
```bash
# View Ollama server logs
journalctl -u ollama -f
```

### API Request/Response Logging
Add middleware in `main.py`:
```python
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response
```

## Security Notes

- This service should NOT be exposed to the internet directly
- All requests must come from authenticated Next.js backend
- Consider adding API key validation if deploying separately
- Never log sensitive user data or API keys

## Future Enhancements

- [ ] Streaming response support (SSE or WebSocket)
- [ ] Multi-model fallback (if primary fails, use secondary)
- [ ] Model performance metrics collection
- [ ] A/B testing different prompts
- [ ] Fine-tuned models for fantasy sports domain
