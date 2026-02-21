# VIPContentAI - Project Context for Cursor AI

This file provides high-level context about the VIPContentAI project to help Cursor AI understand the codebase structure, architecture, and key decisions.

## Project Overview

**VIPContentAI** is an AI-powered fantasy football content generation platform that:
- Captures content from RSS feeds, websites, Google Trends, and topics
- Generates SEO-optimized articles using local AI models (Ollama)
- Manages a media library for images and videos
- Provides user management and authentication
- Implements a multi-agent AI system using CrewAI

## Architecture

### Monorepo Structure
```
vipcontentai/
├── app/                    # Next.js 16 App Router (frontend + API)
├── components/             # React components (UI + custom)
├── lib/                    # Utilities, types, validations
├── api-service/            # FastAPI microservice (AI operations)
├── .stories/               # User stories and requirements
└── .cursor/                # Cursor AI configuration
```

### Tech Stack

#### Frontend & Backend (Next.js)
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + CSS variables
- **UI Components**: shadcn/ui (New York style)
- **Database**: MongoDB Atlas
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod schemas

#### AI Microservice (FastAPI)
- **Framework**: FastAPI 0.109.0+
- **Language**: Python 3.10+
- **AI Framework**: CrewAI 0.1.0+
- **LLM**: Ollama (remote server: 15.134.68.145:11434)
- **Image/Video Generation**: HuggingFace Model API (remote server: 44.197.16.15:7860)
- **Validation**: Pydantic v2.5.0+
- **Server**: Uvicorn with standard extras

### Data Flow
```
User → Next.js Frontend → Next.js API Routes → MongoDB
                                ↓
                        FastAPI Service → Ollama (LLM/Embeddings)
                                      → HuggingFace API (Image/Video)
                                ↓
                        Back to Next.js → MongoDB → User
```

## Key Design Decisions

### 1. Monorepo with Dual Stack
- **Why**: Separate concerns (web app vs AI operations)
- **Next.js**: Handles UI, auth, database, user-facing features
- **FastAPI**: Handles AI generation, CrewAI agents, Ollama communication
- **Benefit**: Each service can scale independently

### 2. Local AI Models Only (Ollama)
- **Why**: Privacy, cost control, no cloud dependencies
- **Models Used** (as configured in .env.local):
  - `gpt-oss` - Default content generation
  - `llama3.1` - Quality content generation
  - `nomic-embed-text` - Vector embeddings (required)
- **Alternative Models Available**:
  - `llama3.1:8b` - Fast generation
  - `llama3.1:70b` - High-quality output
- **Benefit**: No API costs, data stays local

### 3. JWT Authentication with HTTP-Only Cookies
- **Why**: Secure, resistant to XSS attacks
- **Implementation**: Tokens stored in HTTP-only cookies, validated on each protected route
- **Benefit**: Client can't access token via JavaScript

### 4. Multi-Agent AI System (CrewAI)
- **Why**: Specialized agents for different tasks
- **Agents**:
  - Researcher: Gathers information about topics
  - Writer: Creates content
  - SEO Optimizer: Optimizes for search engines
- **Benefit**: Better quality through specialization

### 5. Zod/Pydantic Validation
- **Why**: Type-safe validation at runtime
- **Next.js**: Zod schemas for API route validation
- **FastAPI**: Pydantic models for request/response validation
- **Benefit**: Catch errors early, auto-generate API docs

## Database Schema

### MongoDB Collections

#### `users`
- User accounts and authentication
- Fields: email, passwordHash, role, preferences

#### `sources`
- RSS feeds, websites, topics, trends
- Fields: type, url, schedule, status

#### `articles`
- Captured articles with embeddings
- Fields: title, content, sourceId, embedding, metadata

#### `generated_content`
- AI-generated content
- Fields: title, content, prompt, modelUsed, seoScore

#### `media`
- Image and video library
- Fields: url, type, tags, uploadedBy

#### `notifications`
- User notifications
- Fields: userId, message, read, createdAt

#### `ai_configurations`
- Ollama model settings
- Fields: modelName, parameters, priority

#### `model_groups`
- Model routing strategies
- Fields: name, models, fallbackStrategy

## Authentication Flow

1. User registers → Password hashed with bcrypt (12 rounds)
2. User logs in → JWT token generated, stored in HTTP-only cookie
3. Protected routes → `withAuth` middleware validates token
4. Superadmin routes → `withSuperadmin` middleware checks role

## AI Content Generation Flow

1. User requests content (topic, word count, tone)
2. Next.js API route validates request (Zod)
3. Calls FastAPI service
4. FastAPI creates CrewAI agents (researcher, writer, optimizer)
5. Ollama processes through each agent
6. FastAPI returns generated content
7. Next.js stores in MongoDB
8. Returns to user

## Folder Conventions

### Next.js
- `app/api/[route]/route.ts` - API routes
- `app/[route]/page.tsx` - Pages
- `components/ui/` - shadcn/ui components
- `components/` - Custom components
- `lib/` - Utilities and helpers
- `hooks/use-[name].ts` - React hooks
- `lib/types/` - TypeScript interfaces
- `lib/validations/` - Zod schemas

### FastAPI
- `routers/` - API route handlers
- `agents/` - CrewAI agent definitions
- `services/` - Business logic
- `models/` - Pydantic models
- `utils/` - Helper functions

## User Stories

Located in `.stories/` organized by epics:
- **E1**: Authentication and User Management
- **E2**: Source Management
- **E3**: Content Generation (AI)
- **E4**: Media Library
- **E5**: Content Review and Publishing
- **E6**: Analytics and Reporting
- **E7**: Notifications
- **E8**: System Configuration

## Common Patterns

### API Route Pattern (Next.js)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/mongodb';
import { z } from 'zod';

const schema = z.object({ /* validation */ });

async function handler(req: NextRequest, context: { userId: string }) {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    // Business logic
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
```

### FastAPI Endpoint Pattern
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/resource", tags=["resource"])

class Request(BaseModel):
    field: str

class Response(BaseModel):
    result: str

@router.post("/", response_model=Response)
async def endpoint(request: Request) -> Response:
    try:
        # Business logic
        return Response(result="success")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Environment Variables

### Next.js (.env.local)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- `FASTAPI_URL` - FastAPI service URL
- `HF_API_BASE_URL` - HuggingFace Model API URL (image/video generation)
- `HF_DEFAULT_IMAGE_MODEL` - Default image model (black-forest-labs/FLUX.1-dev)
- `HF_DEFAULT_VIDEO_MODEL` - Default video model (Wan-AI/Wan2.2-TI2V-5B)

### FastAPI (api-service/.env)
- `OLLAMA_BASE_URL` - Ollama API URL
- `DEFAULT_MODEL` - Default model name
- `ALLOWED_ORIGINS` - CORS origins
- `HF_API_BASE_URL` - HuggingFace Model API URL
- `HF_DEFAULT_IMAGE_MODEL` - Default image model
- `HF_DEFAULT_VIDEO_MODEL` - Default video model

## Deployment

- **Next.js**: Deploy to Vercel or similar
- **FastAPI**: Deploy separately (Docker, VPS, cloud)
- **MongoDB**: MongoDB Atlas (cloud)
- **Ollama**: Self-hosted server with GPU

## Testing Strategy

- **Test Specs**: Gherkin format in `.stories/.tests/`
- **Categories**: UI, API, Database, Security, Accessibility, Performance
- **Coverage**: Positive flow, validation, security, edge cases

## Security Principles

1. ✅ Always validate input (Zod/Pydantic)
2. ✅ Use HTTP-only cookies for tokens
3. ✅ Hash passwords with bcrypt (12+ rounds)
4. ✅ Implement CSRF protection
5. ✅ Rate limit sensitive endpoints
6. ✅ Never expose secrets in code
7. ✅ Sanitize user input
8. ✅ Use parameterized queries

## Performance Goals

- API response time: < 200ms
- Page load (FCP): < 1.5s
- AI generation: < 30s
- Database queries: < 50ms

## Code Quality Standards

- TypeScript strict mode enabled
- Type hints on all Python functions
- Async/await for I/O operations
- Error handling on all operations
- Logging for debugging
- Comments for complex logic
- Tests for all features

## Key Files to Reference

- `CLAUDE.md` - Comprehensive project documentation
- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment guide
- `.cursor/README.md` - Cursor configuration docs
- `api-service/README.md` - FastAPI service docs

---

**Last Updated**: 2025-01-15
**Maintained By**: VIPContentAI Team

