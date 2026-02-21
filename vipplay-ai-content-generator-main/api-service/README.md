# VIPContentAI - FastAPI AI Microservice

This is the AI operations microservice for VIPContentAI, handling all AI-related tasks using CrewAI and Ollama local models.

## Purpose

This service is responsible for:
- **Content Generation**: Multi-agent AI content creation using CrewAI
- **Ollama Integration**: Direct communication with local Ollama models
- **LLM Inference**: Model inference and streaming responses
- **Embeddings**: Generate vector embeddings for articles
- **Image Generation**: Proxies to HuggingFace Model API (FLUX.1-dev)
- **Video Generation**: Proxies to HuggingFace Model API (Wan-AI/Wan2.2-TI2V-5B, T2V and I2V)

**Note**: All other application logic (auth, database, CRUD) is handled by the Next.js backend.

## 📋 User Stories

This service implements **15 user stories** from the main project backlog:
- **12 stories** from Epic E3 (Content Generation) - **67 story points**
- **2 stories** from Epic E2 (Embeddings) - **10 story points**
- **1 story** from Epic E5 (Image Generation) - **8 story points**

**See**: [.stories/README.md](.stories/README.md) for complete list and links to story files.

## Architecture

```
Next.js Backend → FastAPI Service → Ollama Server (LLM & Embeddings)
                ↓                  → HuggingFace API (Image & Video)
            MongoDB Atlas
```

## Prerequisites

- **Python**: 3.10 or higher
- **Ollama**: Running on remote server (44.197.16.15:11434) with models installed
- **HuggingFace Model API**: Running on remote server (44.197.16.15:7860) for image/video generation
- **Models Required** (as configured in .env):
  - `gpt-oss` - Default content generation
  - `llama3.1` - Quality content generation
  - `nomic-embed-text` - Vector embeddings (required)
  - `black-forest-labs/FLUX.1-dev` - Image generation (via HuggingFace API)
  - `Wan-AI/Wan2.2-TI2V-5B` - Video generation (via HuggingFace API)
  
- **Alternative Models Available** (optional):
  - `llama3.1:8b` - Fast content generation
  - `llama3.1:70b` - High-quality content generation

## Setup

### 1. Create Virtual Environment

```bash
cd api-service
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/Mac)
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create `.env` file:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://44.197.16.15:11434
DEFAULT_MODEL=gpt-oss
QUALITY_MODEL=llama3.1
EMBEDDING_MODEL=nomic-embed-text

# HuggingFace Model API Configuration (Image & Video Generation)
HF_API_BASE_URL=http://44.197.16.15:7860
HF_DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
HF_DEFAULT_VIDEO_MODEL=Wan-AI/Wan2.2-TI2V-5B
HF_DEFAULT_INFERENCE_STEPS=9
HF_DEFAULT_GUIDANCE_SCALE=7.5
HF_DEFAULT_VIDEO_FRAMES=14

# Model Parameters
MAX_TOKENS=4096
TEMPERATURE=0.7
TOP_P=0.9

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=true

# Logging
LOG_LEVEL=INFO
```

### 4. Verify Ollama Connection

```bash
# Test Ollama is running (remote server)
curl http://44.197.16.15:11434/api/version

# List available models
curl http://44.197.16.15:11434/api/tags
```

### 5. Run the Service

```bash
# Development mode (auto-reload)
uvicorn main:app --reload --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6. Test the API

Visit: http://localhost:8000/docs for interactive API documentation

```bash
# Health check
curl http://localhost:8000/health

# List models
curl http://localhost:8000/models
```

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/models` | List available Ollama models |

### Content Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generation/topic` | Generate content from topic |
| POST | `/api/generation/keywords` | Generate content from keywords |
| POST | `/api/generation/trends` | Generate content from trends |
| POST | `/api/generation/spin` | Spin existing content |
| GET | `/jobs/:id` | Get generation job status |

### Image Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images/generate` | Generate AI image (proxies to HuggingFace API) |
| GET | `/api/images/health` | Image service health check |

### Video Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/generate` | Generate AI video (T2V/I2V, proxies to HuggingFace API) |
| GET | `/api/videos/health` | Video service health check |

### Request Format

```json
{
  "mode": "topic",
  "input": {
    "topic": "Fantasy Football Draft Strategy 2025"
  },
  "settings": {
    "word_count": "1500-2000",
    "tone": "Professional & Informative",
    "include_images": true,
    "seo_optimization": "Maximum",
    "focus_keywords": ["fantasy football", "draft", "strategy"]
  },
  "user_id": "user123"
}
```

### Response Format

```json
{
  "job_id": "job_abc123",
  "status": "processing",
  "progress": {
    "current": 1,
    "total": 2,
    "stage": "research",
    "message": "Researching topic..."
  }
}
```

## Project Structure

```
api-service/
├── main.py                      # FastAPI app entry point
├── agents/
│   ├── __init__.py
│   ├── content_researcher.py    # Research agent
│   ├── content_writer.py        # Writer agent
│   └── crew_config.py           # CrewAI configuration
├── services/
│   ├── __init__.py
│   ├── ollama_client.py         # Ollama API wrapper
│   ├── generation_service.py    # Generation orchestration
│   ├── seo_analyzer.py          # SEO scoring
│   └── readability_analyzer.py  # Readability metrics
├── models/
│   ├── __init__.py
│   ├── generation_request.py    # Pydantic request models
│   ├── generation_response.py   # Pydantic response models
│   └── job_status.py            # Job status models
├── utils/
│   ├── __init__.py
│   └── logger.py                # Logging configuration
├── tests/
│   ├── test_generation.py
│   ├── test_agents.py
│   └── test_ollama.py
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment template
├── .gitignore
└── README.md                    # This file
```

## CrewAI Agents

### Content Researcher

**Role**: Expert Content Researcher
**Goal**: Research and gather comprehensive insights about the topic
**Tools**:
- Web search
- Knowledge base query
- Trends analysis

### Content Writer

**Role**: Professional Content Writer
**Goal**: Transform research into engaging, SEO-optimized content
**Tools**:
- SEO optimization
- Readability analysis
- Content structuring

### Crew Configuration

```python
crew = Crew(
    agents=[content_researcher, content_writer],
    tasks=[research_task, writing_task],
    process=Process.sequential,
    memory=True,
    verbose=True
)
```

## Development Workflow

### 1. Verify Ollama Models on Remote Server

```bash
# Check available models on remote server
curl http://44.197.16.15:11434/api/tags

# Expected models: gpt-oss, llama3.1, nomic-embed-text
# Note: Model installation must be done on the remote server
```

### 2. Test Model Connection

```bash
# Test default model (gpt-oss)
curl http://44.197.16.15:11434/api/generate -d '{
  "model": "gpt-oss",
  "prompt": "Hello"
}'
```

### 3. Run FastAPI Service

```bash
uvicorn main:app --reload
```

### 4. Test Generation

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "topic",
    "input": {"topic": "Test Article"},
    "settings": {"word_count": "1000-1500"},
    "user_id": "test"
  }'
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_generation.py -v
```

## Troubleshooting

### Ollama Connection Failed

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama service
ollama serve
```

### Model Not Found

```bash
# List installed models
ollama list

# Pull missing model
ollama pull llama3.1:8b
```

### Slow Generation

- Use smaller models (7B-8B instead of 70B)
- Reduce max_tokens
- Enable GPU acceleration in Ollama
- Use quantized models (Q4_K_M instead of full precision)

### Import Errors

```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

## Performance Optimization

### Model Selection

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| llama3.1:8b | 4.7GB | Fast | Good | Bulk generation, drafts |
| llama3.1:70b | 40GB | Slow | Excellent | Premium content |
| mistral:7b | 4.1GB | Very Fast | Good | Quick iterations |

### Hardware Recommendations

- **Minimum**: 8GB RAM, CPU-only (slow)
- **Recommended**: 16GB RAM, NVIDIA GPU with 8GB+ VRAM
- **Optimal**: 32GB RAM, NVIDIA GPU with 24GB+ VRAM

### Concurrent Requests

```bash
# Run with multiple workers
uvicorn main:app --workers 4 --host 0.0.0.0
```

## Deployment

### Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build image
docker build -t vipcontentai-api .

# Run container
docker run -p 8000:8000 --env-file .env vipcontentai-api
```

### Environment Variables (Production)

```bash
OLLAMA_BASE_URL=http://44.197.16.15:11434
DEFAULT_MODEL=gpt-oss
QUALITY_MODEL=llama3.1
EMBEDDING_MODEL=nomic-embed-text
MAX_TOKENS=4096
LOG_LEVEL=WARNING
HF_API_BASE_URL=http://44.197.16.15:7860
HF_DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
HF_DEFAULT_VIDEO_MODEL=Wan-AI/Wan2.2-TI2V-5B
```

## Monitoring

### Health Check

```bash
# Simple health check
curl http://localhost:8000/health

# Expected response
{"status": "healthy", "ollama_connected": true}
```

### Logging

Logs are written to `logs/app.log` with rotation:
- Max size: 10MB
- Backup count: 5 files

```bash
# Tail logs
tail -f logs/app.log
```

## Security

- API should be behind authentication (handled by Next.js)
- Rate limiting recommended for public endpoints
- CORS configured to allow Next.js origin only
- Environment variables never committed to git

## Support

For issues:
1. Check Ollama is running: `ollama list`
2. Verify models are installed
3. Check logs in `logs/app.log`
4. Review FastAPI docs at `/docs`

## License

MIT License - Part of VIPContentAI project
