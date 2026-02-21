# VIPContentAI Architecture Overview

## Service Architecture

This is a **hybrid backend architecture** with two main services:

### 1. Next.js Application (Port 3000)
**Primary Backend** - Handles all application logic and data operations

**Responsibilities:**
- ✅ Authentication & Authorization (JWT, user management)
- ✅ Database Operations (MongoDB CRUD)
- ✅ User Management (registration, login, profiles)
- ✅ Knowledge Base Management (RSS, websites, topics, trends)
- ✅ Content Management (CRUD, approval workflows, bulk operations)
- ✅ Media Library (file metadata, organization)
- ✅ AI Configuration Management (model groups, routing strategies, config export/import)
- ✅ Orchestration (calls FastAPI for AI operations)

**API Documentation:**
- ⏳ **Next.js Swagger** - Planned (VIP-10200)
- 📋 Status: Not yet implemented
- 📋 Planned Route: `/api-docs`
- 📋 Planned Spec: `/api/swagger.json`

### 2. FastAPI Microservice (Port 8000)
**AI Operations Service** - Handles AI and external service integrations

**Responsibilities:**
- ✅ Ollama Integration (LLM inference, embeddings, model management)
- ✅ Content Generation (CrewAI multi-agent workflows)
- ✅ Image Generation (proxies to HuggingFace API service on port 7860)
- ✅ Video Generation (proxies to HuggingFace API service on port 7860, supports T2V and I2V)
- ✅ SEO Analysis (content optimization metrics)
- ✅ Readability Analysis (Flesch-Kincaid, grade level)
- ✅ Weaviate Integration (vector storage and similarity search)
- ✅ RSS Parsing (feed parsing with feedparser)
- ✅ Web Scraping (Firecrawl API integration)
- ✅ Model Management (list, pull, test Ollama models)

**API Documentation:**
- ✅ **FastAPI Swagger UI**: `http://localhost:8000/docs`
- ✅ **ReDoc**: `http://localhost:8000/redoc`
- ✅ **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## Data Flow Patterns

### Content Generation Flow
```
User → Next.js Frontend
  → Next.js API: POST /api/content/generate
  → MongoDB: Create generation job (status: queued)
  → FastAPI: POST /api/generation/topic (or keywords/trends/spin)
  → Ollama: LLM inference via CrewAI agents
  → FastAPI: Return generated content
  → Next.js API: Store in MongoDB (generated_content collection)
  → Next.js API: Return to frontend
```

### Image Generation Flow
```
User → Next.js Frontend
  → Next.js API: POST /api/media/generate
  → MongoDB: Create media generation job
  → FastAPI: POST /api/images/generate
  → HuggingFace API Service (Port 7860): POST /generate
  → HuggingFace API: Generate image using diffusion model
  → HuggingFace API: Return job_id and download_url
  → FastAPI: Return image URL to Next.js
  → Next.js API: Store metadata in MongoDB (media collection)
  → Next.js API: Return to frontend
```

### Video Generation Flow
```
User → Next.js Frontend
  → Next.js API: POST /api/media/generate (with type=video)
  → MongoDB: Create media generation job
  → FastAPI: POST /api/videos/generate
  → HuggingFace API Service (Port 7860): POST /generate
  → HuggingFace API: Generate video using diffusion model (T2V or I2V)
  → HuggingFace API: Return job_id and download_url
  → FastAPI: Return video URL to Next.js
  → Next.js API: Store metadata in MongoDB (media collection)
  → Next.js API: Return to frontend
```

### SEO/Readability Analysis Flow
```
User → Next.js Frontend
  → Next.js API: POST /api/content/analyze/seo
  → FastAPI: POST /api/generation/analyze/seo
  → FastAPI: Analyze content (keyword density, meta tags, etc.)
  → FastAPI: Return SEO metrics
  → Next.js API: Store in MongoDB (seoAnalysis field)
  → Next.js API: Return to frontend
```

### Embedding Generation Flow
```
User → Next.js Frontend
  → Next.js API: POST /api/articles/{id}/embeddings
  → FastAPI: POST /api/embeddings/article
  → Ollama: Generate embedding (nomic-embed-text, 768-dim)
  → Weaviate: Store vector
  → FastAPI: Return Weaviate UUID
  → Next.js API: Update MongoDB (hasEmbedding=true, weaviateUuid)
  → Next.js API: Return to frontend
```

### AI Configuration Flow (E6 - Superadmin)
```
Superadmin → Next.js Frontend
  → Next.js API: GET /api/admin/ai/models
  → FastAPI: GET /models
  → Ollama: List available models
  → FastAPI: Return model list
  → Next.js API: Return to frontend

Superadmin → Next.js Frontend
  → Next.js API: POST /api/admin/ai/models
  → FastAPI: POST /models/pull
  → Ollama: Pull model from registry
  → FastAPI: Return pull status
  → Next.js API: Return to frontend

Superadmin → Next.js Frontend
  → Next.js API: POST /api/admin/ai/models/test
  → FastAPI: POST /models/test
  → Ollama: Test model with simple prompt
  → FastAPI: Return test results
  → Next.js API: Return to frontend

Superadmin → Next.js Frontend
  → Next.js API: POST /api/admin/ai/groups
  → MongoDB: Store model group (routing strategy, models)
  → Next.js API: Return group details

Superadmin → Next.js Frontend
  → Next.js API: PUT /api/admin/ai/config
  → MongoDB: Export configurations and model groups
  → Next.js API: Return export data
```

## API Endpoints Summary

### Next.js API Routes (Port 3000)

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify` - Verify JWT token
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**Content Management:**
- `GET /api/content` - List generated content (with filters, pagination)
- `POST /api/content` - Create new content
- `GET /api/content/{id}` - Get content details
- `PATCH /api/content/{id}` - Edit content
- `DELETE /api/content/{id}` - Delete content
- `POST /api/content/{id}/approve` - Approve content
- `POST /api/content/{id}/reject` - Reject content with notes
- `POST /api/content/bulk-actions` - Bulk approve/reject/delete
- `GET /api/content/analytics` - Get content statistics
- `POST /api/content/generate` - **Proxies to FastAPI** for content generation
- `POST /api/content/analyze/seo` - **Proxies to FastAPI** for SEO analysis
- `POST /api/content/analyze/readability` - **Proxies to FastAPI** for readability

**Media:**
- `GET /api/media` - List media assets
- `POST /api/media` - Upload media
- `POST /api/media/generate` - **Proxies to FastAPI** for image generation
- `GET /api/media/{id}` - Get media details
- `DELETE /api/media/{id}` - Delete media

**Articles & Sources:**
- `GET /api/articles` - List articles
- `GET /api/articles/search` - Full-text search
- `GET /api/articles/semantic-search` - **Proxies to FastAPI** for vector search
- `POST /api/articles/{id}/embeddings` - **Proxies to FastAPI** for embedding generation
- `GET /api/sources` - List knowledge base sources
- `POST /api/sources/rss` - Add RSS feed
- `POST /api/sources/{id}/fetch` - **Proxies to FastAPI** for RSS parsing

**AI Configuration (Superadmin Only):**
- `GET /api/admin/ai/models` - **Proxies to FastAPI** to list Ollama models
- `POST /api/admin/ai/models` - **Proxies to FastAPI** to pull new Ollama model
- `DELETE /api/admin/ai/models` - Delete Ollama model (returns 501 - use Ollama CLI)
- `POST /api/admin/ai/models/test` - **Proxies to FastAPI** to test model connection
- `GET /api/admin/ai/groups` - List model groups (MongoDB)
- `POST /api/admin/ai/groups` - Create model group (MongoDB)
- `GET /api/admin/ai/groups/{id}` - Get model group (MongoDB)
- `PATCH /api/admin/ai/groups/{id}` - Update model group (MongoDB)
- `DELETE /api/admin/ai/groups/{id}` - Delete model group (MongoDB)
- `GET /api/admin/ai/config` - List AI configurations (MongoDB)
- `POST /api/admin/ai/config` - Create AI configuration (MongoDB)
- `PUT /api/admin/ai/config` - Export all configurations (MongoDB)
- `PATCH /api/admin/ai/config` - Import configurations (MongoDB)
- `GET /api/admin/ai/config/{id}` - Get configuration (MongoDB)
- `PATCH /api/admin/ai/config/{id}` - Update configuration (MongoDB)
- `DELETE /api/admin/ai/config/{id}` - Delete configuration (MongoDB)

### FastAPI Endpoints (Port 8000)

**Content Generation:**
- `POST /api/generation/topic` - Generate from topic
- `POST /api/generation/keywords` - Generate from keywords
- `POST /api/generation/trends` - Generate from trends
- `POST /api/generation/spin` - Spin existing article

**Analysis:**
- `POST /api/generation/analyze/seo` - SEO analysis
- `POST /api/generation/analyze/readability` - Readability analysis

**Embeddings:**
- `POST /api/embeddings/article` - Generate article embedding
- `POST /api/embeddings/search` - Vector similarity search
- `POST /api/embeddings/batch` - Batch embedding generation

**Images:**
- `POST /api/images/generate` - Generate AI image (proxies to HuggingFace API)
- `GET /api/images/health` - Image service health check

**Videos:**
- `POST /api/videos/generate` - Generate AI video (T2V or I2V, proxies to HuggingFace API)
- `GET /api/videos/health` - Video service health check

**RSS & Crawling:**
- `POST /api/rss/sync` - Sync RSS feed
- `POST /api/crawl/website` - Crawl website with Firecrawl

**Model Management:**
- `GET /models` - List available Ollama models
- `POST /models/pull` - Pull new Ollama model from registry
- `POST /models/test` - Test model connection and response

**System:**
- `GET /health` - Service health check
- `GET /docs` - **Swagger UI** (interactive API documentation)
- `GET /redoc` - **ReDoc** (alternative documentation)
- `GET /openapi.json` - **OpenAPI 3.0 specification**

## Environment Configuration

### Next.js (.env.local)
```bash
# MongoDB
MONGODB_URI=mongodb://admin:VipplayPass123@3.105.105.52:27017
MONGODB_DB_NAME=vipcontentai

# Weaviate
WEAVIATE_URL=http://3.105.105.52:8080

# FastAPI Integration
FASTAPI_URL=http://localhost:8000

# HuggingFace Model API (Image & Video Generation)
# Runs on same server as Ollama but separate endpoint (port 7860)
HF_API_BASE_URL=http://44.197.16.15:7860
HF_DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
HF_DEFAULT_VIDEO_MODEL=Wan-AI/Wan2.2-TI2V-5B
HF_DEFAULT_INFERENCE_STEPS=9
HF_DEFAULT_GUIDANCE_SCALE=7.5
HF_DEFAULT_VIDEO_FRAMES=14

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
```

### FastAPI (api-service/.env)
```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://44.197.16.15:11434
DEFAULT_MODEL=gpt-oss
QUALITY_MODEL=llama3.1
EMBEDDING_MODEL=nomic-embed-text

# Service Configuration
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=true

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Weaviate
WEAVIATE_URL=http://3.105.105.52:8080

# HuggingFace Model API (Image & Video Generation)
# Separate service running on port 7860 (same server as Ollama)
HF_API_BASE_URL=http://44.197.16.15:7860
HF_DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
HF_DEFAULT_VIDEO_MODEL=Wan-AI/Wan2.2-TI2V-5B
HF_DEFAULT_INFERENCE_STEPS=9
HF_DEFAULT_GUIDANCE_SCALE=7.5
HF_DEFAULT_VIDEO_FRAMES=14

# Firecrawl
FIRECRAWL_API_KEY=your-firecrawl-api-key
```

## Swagger Documentation Access

### FastAPI Swagger (Active ✅)
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Next.js Swagger (Planned ⏳)
- **Swagger UI**: http://localhost:3000/api-docs (not yet implemented)
- **OpenAPI JSON**: http://localhost:3000/api/swagger.json (not yet implemented)
- **Story**: VIP-10200 (E3-Content-Generation-(AI))
- **Status**: To Do

## Service Communication

### Next.js → FastAPI
- Uses `fetch()` with `FASTAPI_URL` environment variable
- No authentication required (internal service communication)
- Timeout: 25-30 seconds for long operations
- Error handling: Returns 503 if FastAPI unavailable

### FastAPI → External Services
- **Ollama**: http://44.197.16.15:11434 (remote server, same as HuggingFace API)
- **HuggingFace Model API**: http://44.197.16.15:7860 (remote server, separate endpoint for image/video generation)
- **Weaviate**: http://3.105.105.52:8080 (AWS hosted)
- **Firecrawl**: API-based (requires API key)

**Note**: Ollama and HuggingFace Model API run on the same remote server (44.197.16.15) but on different ports (11434 and 7860 respectively).

## Database Architecture

### MongoDB Collections (Next.js manages)
- `users` - User accounts and authentication
- `sources` - RSS feeds, websites, topics, trends
- `articles` - Captured articles with metadata
- `generated_content` - AI-generated content
- `media` - AI-generated images/videos (metadata)
- `media_generation_jobs` - Image/video generation job tracking
- `notifications` - User notifications
- `generation_jobs` - Content generation job tracking
- `ai_configurations` - AI configuration settings (model params, limits, etc.)
- `model_groups` - Model routing strategies and groups

### Weaviate Schema (FastAPI manages)
- **ArticleEmbedding** class: 768-dimensional vectors
- Properties: `article_id`, `user_id`, `title`, `content`, `source_id`, `vector`
- All operations filtered by `user_id` for data isolation

## Development Commands

### Start Next.js (Terminal 1)
```bash
pnpm dev
# Runs on http://localhost:3000
```

### Start FastAPI (Terminal 2)
```bash
cd api-service
.venv\Scripts\Activate.ps1  # Windows
# or
source .venv/bin/activate   # Linux/Mac

uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

## HuggingFace API Integration Verification

### Test Script Compatibility

Our FastAPI implementation is fully compatible with direct HuggingFace API calls. Here's a comparison:

#### Direct HuggingFace API Call (Peer's Test Script)
```python
payload = {
    "model_id": "Wan-AI/Wan2.2-TI2V-5B",
    "prompt": "A cat walks on the grass, realistic style.",
    "num_inference_steps": 9,
    "seed": 42
}

# Response:
{
    "job_id": "...",
    "type": "video",
    "download_url": "/download/..."
}
```

#### FastAPI Proxy Implementation

**Request Flow:**
1. **Client → FastAPI** (`POST /api/videos/generate`)
   ```json
   {
     "prompt": "A cat walks on the grass, realistic style.",
     "model_id": "Wan-AI/Wan2.2-TI2V-5B",
     "num_inference_steps": 9,
     "seed": 42
   }
   ```

2. **FastAPI → HuggingFace API** (`POST /generate`)
   ```json
   {
     "model_id": "Wan-AI/Wan2.2-TI2V-5B",
     "prompt": "A cat walks on the grass, realistic style.",
     "num_inference_steps": 9,
     "seed": 42,
     "model_type": "video"
   }
   ```

3. **FastAPI → Client** (Response)
   ```json
   {
     "success": true,
     "video_url": "http://44.197.16.15:7860/download/...",
     "job_id": "...",
     "prompt": "A cat walks on the grass, realistic style.",
     "generation_time": 45.23
   }
   ```

### Parameter Mapping

| Parameter | FastAPI Router | HF Service | HuggingFace API | Status |
|-----------|----------------|------------|-----------------|--------|
| `model_id` | ✅ | ✅ | ✅ | ✅ |
| `prompt` | ✅ | ✅ | ✅ | ✅ |
| `num_inference_steps` | ✅ | ✅ | ✅ | ✅ |
| `seed` | ✅ | ✅ | ✅ | ✅ |
| `model_type` | ✅ (auto-added) | ✅ | ✅ | ✅ |
| `width`, `height` | ✅ (optional) | ✅ (optional) | ✅ (optional) | ✅ |
| `guidance_scale` | ✅ (optional) | ✅ (optional) | ✅ (optional) | ✅ |
| `num_frames` | ✅ (optional) | ✅ (optional) | ✅ (optional) | ✅ |
| `image` | ✅ (I2V support) | ✅ (I2V support) | ✅ (I2V support) | ✅ |

### Response Mapping

| HuggingFace API | FastAPI Service | FastAPI Router | Status |
|----------------|-----------------|----------------|--------|
| `job_id` | ✅ | ✅ `job_id` | ✅ |
| `type` | ✅ | - (used internally) | ✅ |
| `download_url` | ✅ (converted to full URL) | ✅ `video_url` / `image_url` | ✅ |
| `file` | ✅ | - (used for fallback) | ✅ |

### Implementation Features

✅ **Parameter Passing**: All parameters correctly passed through  
✅ **Optional Parameters**: Only sent if provided (not None)  
✅ **URL Construction**: Full download URL built from base URL  
✅ **Error Handling**: HTTP errors caught with proper status codes  
✅ **Model Type Detection**: Auto-detected or explicitly set  
✅ **I2V Support**: Image-to-video generation supported  
✅ **Health Checks**: `/api/images/health` and `/api/videos/health` endpoints  
✅ **Generation Time**: Tracks and returns generation duration  

### Supported Models

**Image Models:**
- `black-forest-labs/FLUX.1-dev` (default)
- `runwayml/stable-diffusion-v1-5`
- `Tongyi-MAI/Z-Image-Turbo`
- `stabilityai/stable-diffusion-xl-base-1.0`
- Any HuggingFace Diffusers-compatible image model

**Video Models:**
- `Wan-AI/Wan2.2-TI2V-5B` (default, TI2V - Text/Image to Video)
- `Lightricks/LTX-Video` (T2V and I2V)
- `genmo/mochi-1-preview` (T2V)
- `Skywork/SkyReels-V1-Hunyuan-T2V` (T2V)
- `stabilityai/stable-video-diffusion-img2vid-xt`
- Any HuggingFace Diffusers-compatible video model

## Key Principles

1. **No Mock Data**: All features use real database APIs and external services
2. **User Isolation**: All MongoDB queries filtered by `userId` from JWT (except superadmin routes)
3. **Service Separation**: Next.js handles data and orchestration, FastAPI handles AI operations
4. **Ollama Operations**: All Ollama interactions go through FastAPI, never directly from Next.js
5. **Error Handling**: Proper HTTP status codes and error messages
6. **Type Safety**: TypeScript for Next.js, Pydantic for FastAPI
7. **Documentation**: FastAPI has Swagger UI, Next.js Swagger is planned (VIP-10200)
8. **Superadmin Routes**: AI configuration routes require superadmin role, stored in MongoDB

## Testing

### E2E Tests
- **Location**: `tests/e2e/`
- **Framework**: Playwright
- **Coverage**: All API endpoints tested with real database
- **Command**: `pnpm test:e2e`

### Test Results (E4 Content Management)
- ✅ **16 tests passing** (all critical functionality)
- ⏭️ **23 tests skipped** (require specific test data)
- ✅ **0 tests failing**

## Future Enhancements

1. **Next.js Swagger Implementation** (VIP-10200)
   - Auto-generate OpenAPI spec from Next.js routes
   - Interactive Swagger UI at `/api-docs`
   - JSDoc-based documentation

2. **API Versioning**
   - `/api/v1/` prefix for Next.js routes
   - Version negotiation in FastAPI

3. **Service Mesh**
   - Health checks between services
   - Circuit breakers for FastAPI calls
   - Retry logic with exponential backoff

