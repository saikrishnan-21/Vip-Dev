# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VIPContentAI is an AI-powered content generation platform for fantasy football and US Varsity sports content creators. Built as a **monorepo** with Next.js 16 (frontend + backend) and a FastAPI microservice for AI operations.

**Key Architecture**: This is a Next.js application with a **nested FastAPI microservice** inside the `api-service/` folder. Both services run independently but share the same repository.

## Repository Structure

```
vipcontentai/
├── app/                    # Next.js app (pages, API routes, layouts)
│   ├── (auth)/            # Login, signup, reset password pages
│   ├── api/               # Next.js API routes (all backend logic)
│   └── dashboard/         # Protected dashboard pages
├── components/             # React components (UI, dialogs, theme)
├── lib/                    # Shared utilities and helpers
│   ├── auth/              # JWT, withAuth HOF, user extraction
│   ├── services/          # Service layer (embeddings, trends)
│   ├── types/             # TypeScript types and interfaces
│   └── validations/       # Zod validation schemas
├── hooks/                  # React hooks (useAiSettings, etc.)
├── public/                 # Static assets
├── api-service/            # FastAPI microservice (nested Python app)
│   ├── .venv/             # Python virtual environment
│   ├── main.py            # FastAPI entry point
│   ├── routers/           # FastAPI route handlers (embeddings, rss, crawl, generation)
│   ├── services/          # Ollama, Weaviate, RSS, Firecrawl services
│   ├── models/            # Pydantic models
│   ├── requirements.txt   # Python dependencies
│   ├── .env               # FastAPI environment variables
│   └── README.md          # FastAPI service documentation
├── .stories/              # Agile project management (62 user stories + tests)
│   ├── .screenshots/      # UI screenshots for documentation
│   ├── E1-.../ to E8-.../ # 8 epic folders
│   │   ├── .tests/        # Gherkin BDD test specs
│   │   ├── epic_details.md
│   │   └── VIP-*.md       # Individual story files
│   ├── README.md
│   ├── STORY-PAGE-MAPPING.md      # Maps stories to UI pages
│   └── SCREENSHOTS-DOCUMENTATION.md
├── misc/                  # Database migration and seeding scripts
│   ├── migrate-database.js
│   ├── seed-database.js
│   ├── DATABASE_SCRIPTS.md
│   └── LOCAL_SETUP_GUIDE.md
├── package.json           # Node.js dependencies
├── .env.local             # Next.js environment variables
├── .env.example           # Next.js environment template
└── CLAUDE.md              # This file
```

## Tech Stack

### Frontend & Backend (Next.js)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Runtime**: React 19 (note: breaking changes from React 18)
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Library**: shadcn/ui (New York style, installed locally)
- **Theme**: next-themes for light/dark mode
- **Package Manager**: pnpm
- **Database**: MongoDB Atlas (AWS hosted: 3.105.105.52)
- **Vector DB**: Weaviate (AWS hosted: 3.105.105.52:8080)
- **Auth**: JWT with bcrypt password hashing (12 rounds)
- **Validation**: Zod schemas

### AI Microservice (FastAPI)
- **Framework**: FastAPI (Python 3.10+)
- **AI Framework**: CrewAI for multi-agent workflows
- **LLM Server**: Ollama (remote server: 44.197.16.15:11434)
- **Image/Video Generation**: HuggingFace Model API (remote server: 44.197.16.15:7860)
- **Vector Operations**: Weaviate Python client
- **RSS Parsing**: feedparser library
- **Web Scraping**: Firecrawl API integration

## Development Commands

### First-Time Setup

```bash
# 1. Install Node.js dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your actual credentials

# 3. Set up database (create indexes and seed data)
pnpm db:setup
# Or run separately:
# pnpm db:migrate  # Create indexes
# pnpm db:seed     # Add seed data

# 4. Set up FastAPI service (separate terminal)
cd api-service
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt

# 5. Copy FastAPI environment file
cp .env.example .env
# Edit api-service/.env with Ollama/Weaviate URLs
```

### Running the Application

```bash
# Terminal 1: Start Next.js (port 3000)
pnpm dev

# Terminal 2: Start FastAPI (port 8000)
cd api-service
.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate    # Linux/Mac
uvicorn main:app --reload --port 8000
```

### Other Commands

```bash
# Next.js
pnpm build          # Build production bundle
pnpm start          # Start production server
pnpm lint           # Run ESLint

# Database management
pnpm db:migrate     # Create/update MongoDB indexes
pnpm db:seed        # Seed database with initial data
pnpm db:setup       # Run both migrate and seed

# FastAPI
cd api-service
pytest              # Run tests
uvicorn main:app --host 0.0.0.0  # Expose to network
```

## Project Architecture

### Hybrid Backend Architecture

This project uses a **hybrid backend** where responsibilities are split between Next.js and FastAPI:

#### Next.js API Routes (Primary Backend - Port 3000)
Handles all application logic and data operations:
- **Authentication & Authorization**: JWT generation, validation, role-based access
- **Database Operations**: All MongoDB CRUD operations
- **User Management**: Registration, login, profile, password reset
- **Knowledge Base**: RSS feeds, websites, topics, trends management
- **Content Management**: CRUD for generated content, approval workflows
- **Media Library**: File uploads, metadata management
- **Orchestration**: Calls FastAPI for AI operations, stores results in MongoDB

**Key Pattern**: Use `withAuth` HOF to protect routes and extract user context:

```typescript
// lib/auth/with-auth.ts
export const GET = withAuth(async (request, user) => {
  // user: { userId, email, role }
  // All MongoDB queries filtered by user.userId
});

// For role-based routes
export const POST = withAuth(
  async (request, user) => { /* handler */ },
  { requiredRole: 'superadmin' }
);
```

#### FastAPI Microservice (AI Operations - Port 8000)
Handles AI and external service integrations:
- **CrewAI Orchestration**: Multi-agent content generation
- **Ollama Integration**: LLM inference and embeddings
- **Image Generation**: Proxies to HuggingFace API service (port 7860) using FLUX.1-dev model
- **Video Generation**: Proxies to HuggingFace API service (port 7860) using Wan-AI/Wan2.2-TI2V-5B model (T2V and I2V support)
- **Weaviate Integration**: Vector storage and similarity search
- **RSS Parsing**: Feed parsing with `feedparser`
- **Web Scraping**: Firecrawl API for website content extraction
- **Embedding Generation**: `nomic-embed-text` (768-dimensional vectors)

**FastAPI Routers**:
- `routers/embeddings.py` - Vector embedding generation and search
- `routers/rss.py` - RSS feed parsing and synchronization
- `routers/crawl.py` - Website scraping with Firecrawl
- `routers/generation.py` - Content generation
- `routers/images.py` - Image generation (proxies to HuggingFace API)
- `routers/videos.py` - Video generation (proxies to HuggingFace API)

**FastAPI Services**:
- `services/ollama_service.py` - Ollama API client
- `services/hf_api_service.py` - HuggingFace Model API client (image/video generation)
- `services/weaviate_service.py` - Weaviate vector operations
- `services/rss_service.py` - RSS parsing logic
- `services/firecrawl_service.py` - Web scraping logic
- `services/seo_analyzer.py` - SEO metrics
- `services/readability_analyzer.py` - Readability scores

**Architecture Pattern**: Next.js → FastAPI → External Services (Ollama, HuggingFace API, Weaviate, Firecrawl)

### Authentication & Authorization

**Authentication Flow**:
1. User logs in via `POST /api/auth/login`
2. Next.js validates credentials against MongoDB
3. JWT token generated with payload: `{ userId, email, role }`
4. Token stored in HTTP-only cookie + returned in response
5. Middleware (`middleware.ts`) verifies token on all `/dashboard/*` and `/api/protected/*` routes

**Authorization Patterns**:
- **Middleware**: Verifies JWT and redirects unauthenticated users to login
- **withAuth HOF**: Extracts user from request, filters DB queries by `userId`
- **Role Hierarchy**: User < Editor < Admin < Superadmin
- **Route Protection**: Most API routes use `withAuth`, admin routes use `withAuth({ requiredRole: 'admin' })`

### Database Architecture

**MongoDB Collections** (User-Isolated):
- `users` - Authentication, profiles, roles
- `sources` - RSS feeds, websites, topics, trends (filtered by `userId`)
- `articles` - Captured articles with metadata (filtered by `userId`)
- `generated_content` - AI-generated content with SEO metrics
- `media` - AI-generated images/videos
- `notifications` - User notifications
- `generation_jobs` - Background job tracking

**Weaviate Schema**:
- **ArticleEmbedding** class: 768-dimensional vectors from `nomic-embed-text`
- Properties: `article_id`, `user_id`, `title`, `content`, `source_id`, `vector`
- All operations filtered by `user_id` for data isolation

**Key Indexes** (created by `pnpm db:migrate`):
- Text indexes: `articles.title`, `articles.content`, `articles.summary`
- Unique indexes: `users.email`, `sources.userId + sourceId + guid` (RSS deduplication)
- Compound indexes: `articles.userId + status`, `generated_content.userId + status`

### Data Flow Patterns

**1. Article Creation with Embedding**:
```
Frontend → Next.js /api/articles → MongoDB (store article)
         → Next.js /api/articles/{id}/embeddings
         → FastAPI /api/embeddings/article
         → Ollama (generate embedding)
         → Weaviate (store vector)
         → Next.js (update MongoDB: hasEmbedding=true, weaviateUuid)
```

**2. Semantic Search**:
```
Frontend → Next.js /api/articles/semantic-search?q=query
         → FastAPI /api/embeddings/search
         → Ollama (generate query embedding)
         → Weaviate (similarity search, filtered by userId)
         → Next.js (fetch full articles from MongoDB)
         → Frontend (display results with similarity scores)
```

**3. RSS Feed Sync**:
```
Frontend → Next.js /api/sources/{id}/fetch
         → FastAPI /api/rss/sync
         → feedparser (parse RSS XML/JSON)
         → Next.js (receive parsed articles)
         → MongoDB (bulk insert with GUID deduplication)
```

## Application Structure

### Dashboard Routes

- `app/dashboard/` - Main dashboard (stats, recent content)
- `app/dashboard/generate/` - Content generation (4 modes: topic, keywords, trends, spin)
- `app/dashboard/knowledge-base/` - RSS feeds, websites, topics, trends management
- `app/dashboard/content/` - Review, approve, reject, export generated content
- `app/dashboard/media/` - AI-generated images/videos library
- `app/dashboard/settings/` - User preferences
- `app/dashboard/ai-config/` - AI model configuration (superadmin only)

### API Route Patterns

**Public Routes** (no auth):
- `app/api/auth/register` - User registration
- `app/api/auth/login` - User login
- `app/api/auth/forgot-password` - Password reset request
- `app/api/auth/reset-password` - Password reset with token

**Protected Routes** (withAuth):
- `app/api/articles/*` - Article CRUD, search, embeddings
- `app/api/sources/*` - Knowledge base sources
- `app/api/content/*` - Generated content management
- `app/api/media/*` - Media library operations
- `app/api/protected/*` - User profile, preferences, password change

**Admin Routes** (withAuth + requiredRole):
- `app/api/protected/admin/users/*` - User management (admin+)
- `app/api/admin/ai/*` - AI configuration (superadmin only)

### Path Aliases

```typescript
// tsconfig.json and components.json
@/components → ./components
@/lib        → ./lib
@/hooks      → ./hooks
@/app        → ./app
```

Always use path aliases in imports, never relative paths across directories.

## Environment Configuration

### Next.js Environment (.env.local)

**MongoDB** (AWS hosted):
```bash
MONGODB_URI=mongodb://admin:VipplayPass123@3.105.105.52:27017
MONGODB_DB_NAME=vipcontentai
```

**Weaviate** (AWS hosted):
```bash
WEAVIATE_URL=http://3.105.105.52:8080
```

**Ollama** (Remote server):
```bash
OLLAMA_BASE_URL=http://44.197.16.15:11434
OLLAMA_DEFAULT_MODEL=gpt-oss
OLLAMA_QUALITY_MODEL=llama3.1
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

**Authentication**:
```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

**FastAPI Integration**:
```bash
FASTAPI_URL=http://localhost:8000
```

**HuggingFace Model API** (Image & Video Generation):
```bash
HF_API_BASE_URL=http://44.197.16.15:7860
HF_DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
HF_DEFAULT_VIDEO_MODEL=Wan-AI/Wan2.2-TI2V-5B
HF_DEFAULT_INFERENCE_STEPS=9
HF_DEFAULT_GUIDANCE_SCALE=7.5
HF_DEFAULT_VIDEO_FRAMES=14
```

**External APIs**:
```bash
FIRECRAWL_API_KEY=your-firecrawl-api-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET_NAME=your-bucket-name
```

### FastAPI Environment (api-service/.env)

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://44.197.16.15:11434
DEFAULT_MODEL=gpt-oss
QUALITY_MODEL=llama3.1
EMBEDDING_MODEL=nomic-embed-text

# Model Parameters
MAX_TOKENS=4096
TEMPERATURE=0.7
TOP_P=0.9

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=true

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging
LOG_LEVEL=INFO

# Weaviate
WEAVIATE_URL=http://3.105.105.52:8080

# Firecrawl
FIRECRAWL_API_KEY=your-firecrawl-api-key

# HuggingFace Model API (Image & Video Generation)
HF_API_BASE_URL=http://44.197.16.15:7860
HF_DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.1-dev
HF_DEFAULT_VIDEO_MODEL=Wan-AI/Wan2.2-TI2V-5B
HF_DEFAULT_INFERENCE_STEPS=9
HF_DEFAULT_GUIDANCE_SCALE=7.5
HF_DEFAULT_VIDEO_FRAMES=14
```

## Implementation Patterns

### Adding a New Protected API Route

```typescript
// app/api/your-route/route.ts
import { withAuth } from '@/lib/auth/with-auth';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const GET = withAuth(async (request, user) => {
  const db = await connectToDatabase();

  // Always filter by user.userId for data isolation
  const items = await db.collection('your_collection')
    .find({ userId: user.userId })
    .toArray();

  return NextResponse.json({
    success: true,
    data: items
  });
});

// For role-based routes
export const POST = withAuth(
  async (request, user) => {
    // Only admins can access this
    const db = await connectToDatabase();
    // ... implementation
  },
  { requiredRole: 'admin' }
);
```

### Adding a New Dashboard Page

```typescript
// app/dashboard/your-page/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function YourPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    // Fetch data from protected API route
    fetch('/api/your-route', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => setData(data.data))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Page</h1>
      {/* Your UI */}
    </div>
  )
}
```

### Creating a FastAPI Router

```python
# api-service/routers/your_router.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ollama_service import ollama_service

router = APIRouter(prefix="/api/your-prefix", tags=["your-tag"])

class YourRequest(BaseModel):
    param1: str
    param2: int

@router.post("/endpoint")
async def your_endpoint(request: YourRequest):
    try:
        # Call Ollama, Weaviate, etc.
        result = await ollama_service.generate(
            model="llama3.1:8b",
            prompt=request.param1
        )

        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Register in main.py:
# app.include_router(your_router.router)
```

## Project Management

### User Stories & Epics

All user stories are in `.stories/` folder with comprehensive test specifications:

**Epic Structure** (8 Epics, 62 Stories, 269 Points):
- ✅ **Epic E1**: Authentication & User Management (8 stories, 26 points) - **COMPLETE**
- ✅ **Epic E2**: Knowledge Base System (10 stories, 44 points) - **COMPLETE**
- 🔄 **Epic E3**: Content Generation (AI) (13 stories, 70 points) - **IN PROGRESS**
- 📋 **Epic E4**: Content Management & Review (8 stories, 30 points)
- 📋 **Epic E5**: Media Library (6 stories, 25 points)
- 📋 **Epic E6**: AI Configuration (Superadmin) (7 stories, 27 points)
- 📋 **Epic E7**: Export & Notifications (5 stories, 21 points)
- 📋 **Epic E8**: Deployment & Production (6 stories, 29 points)

**Story Organization**:
```
.stories/
├── E1-Authentication-and-User-Management/
│   ├── .tests/                    # Gherkin test specs (62 files)
│   │   ├── VIP-10001-test.md     # BDD scenarios for each story
│   │   └── ...
│   ├── epic_details.md            # Epic summary and story list
│   ├── VIP-10001.md               # User Registration story
│   ├── VIP-10002.md               # User Login story
│   └── ... (8 stories total)
├── E2-Knowledge-Base-System/ (10 stories)
├── E3-Content-Generation-(AI)/ (13 stories)
├── E4-Content-Management-and-Review/ (8 stories)
├── E5-Media-Library/ (6 stories)
├── E6-AI-Configuration-(Superadmin)/ (7 stories)
├── E7-Export-and-Notifications/ (5 stories)
├── E8-Deployment-and-Production/ (6 stories)
├── .screenshots/                  # UI screenshots for documentation
├── README.md                      # How to use stories
├── STORY-PAGE-MAPPING.md          # Maps stories to UI pages
└── SCREENSHOTS-DOCUMENTATION.md   # Screenshot guide
```

**Story File Format** (e.g., VIP-10001.md):
- **Header**: Story ID, Type, Epic, Priority, Points, Status
- **User Story**: As a [role], I want [goal], so that [benefit]
- **Acceptance Criteria**: Detailed checklist with technical requirements
- **Technical Details**: API endpoints, request/response formats, files created, security features
- **Definition of Done**: Implementation checklist
- **Notes**: Dependencies, implementation notes, next steps

**Test File Format** (e.g., VIP-10001-test.md):
- **Feature Description**: High-level feature overview
- **Gherkin BDD Scenarios**: Given/When/Then format
- **Multiple Test Cases**: Success, validation errors, edge cases
- **Ready for Playwright**: Direct conversion to E2E tests
- **Total**: 62 test specification files (one per story)

**Finding Resources**:
- **Epic Overview**: `.stories/E1-Authentication-and-User-Management/epic_details.md`
- **Story Details**: `.stories/E1-Authentication-and-User-Management/VIP-10001.md`
- **Test Spec**: `.stories/E1-Authentication-and-User-Management/.tests/VIP-10001-test.md`
- **Page Mapping**: `.stories/STORY-PAGE-MAPPING.md` - Maps stories to UI routes
- **Screenshots**: `.stories/.screenshots/` - UI screenshots for documentation

**Referencing in Code**:
- Commit messages: `[VIP-10001] Implement user registration`
- Branch names: `feature/VIP-10001-user-registration`
- PR titles: `[VIP-10001] Add user registration endpoint`

**Jira Integration**:
- All 62 stories synced to Jira (SCRUM-13 to SCRUM-74)
- Epic links, labels, descriptions with ADF formatting
- Tools available in `misc/` folder for re-synchronization

## AI Configuration System

**Provider Support**:
- **Ollama** (local models) - **PRIMARY AND ONLY ACTIVE PROVIDER**
- OpenAI, Anthropic, Google AI, OpenRouter - UI placeholders (not active)

**Model Groups** (routing strategies):
- `fallback`: Try primary, fall back to secondary if it fails
- `round_robin`: Distribute requests evenly
- `weighted`: Route based on assigned weights
- `majority_judge`: Use multiple models and take consensus

**Recommended Ollama Models**:
- `gpt-oss` - Default content generation (as configured in .env.local)
- `llama3.1` - Quality content generation (as configured in .env.local)
- `llama3.1:8b` - Alternative fast content generation
- `llama3.1:70b` - Alternative high-quality content generation
- `nomic-embed-text` - Vector embeddings (768-dimensional, required)

## Styling Conventions

- **Tailwind CSS v4**: Uses CSS variables for theming
- **Color System**: `primary`, `secondary`, `accent`, `muted`, `destructive`, `card`, `border`
- **shadcn/ui**: Components installed locally in `components/ui/`, use "New York" style
- **Theme System**: `next-themes` with light/dark mode support
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Common Gotchas

- **React 19**: Next.js 16 uses React 19, which has breaking changes from React 18
- **Theme Hydration**: Always check `mounted` state before rendering theme-dependent UI
- **Path Aliases**: Always use `@/` imports, never relative paths across directories
- **MongoDB ObjectId**: Convert to string for JSON serialization: `_id.toString()`
- **User Isolation**: ALWAYS filter MongoDB queries by `user.userId` from JWT payload
- **Windows Python**: Use `.venv\Scripts\Activate.ps1` (PowerShell) or `.venv\Scripts\activate.bat` (CMD)
- **FastAPI CORS**: Ensure `ALLOWED_ORIGINS` in FastAPI `.env` includes Next.js URL

## Testing

**Current Test Infrastructure**:
- **Gherkin BDD Specs**: 62 test files in `.stories/*/tests/` folders
- **Format**: Given/When/Then scenarios for Playwright conversion
- **Coverage**: All user stories have corresponding test specifications

**Planned Test Implementation**:
- Unit tests: Jest + React Testing Library for React components
- API tests: Supertest for Next.js API routes
- E2E tests: Playwright (specs ready, implementation pending)
- FastAPI tests: pytest with pytest-asyncio

## Database Utilities

```bash
# Create MongoDB indexes
pnpm db:migrate

# Seed database with test data
pnpm db:seed

# Both migrate and seed
pnpm db:setup
```

**Migration Script** (`misc/migrate-database.js`):
- Creates 7 collections with JSON schema validation
- Creates text indexes for full-text search
- Creates unique indexes for email, RSS GUID deduplication
- Creates compound indexes for performance (userId + status)
- Safe to run multiple times (idempotent)

**Seed Script** (`misc/seed-database.js`):
- ⚠️ **DESTRUCTIVE**: Clears all existing data before seeding
- Creates 3 users: admin, user, editor (password: `SecurePass123!`)
- Default superadmin: `admin@vipcontentai.com` / `SecurePass123!`
- Creates sample sources (RSS, website, topic)
- Creates sample articles and content
- **DO NOT run in production**

**Verification**:
See `misc/DATABASE_SCRIPTS.md` for complete documentation on database setup and troubleshooting.

## Security Considerations

- **JWT Secrets**: Never commit real JWT_SECRET, use 32+ character random string in production
- **Rate Limiting**: Implemented on auth routes (100 requests per 15 min)
- **Input Validation**: All API routes use Zod schemas for validation
- **SQL Injection**: Not applicable (using MongoDB), but always validate input
- **XSS Prevention**: React automatically escapes, but be careful with `dangerouslySetInnerHTML`
- **CORS**: Configured in FastAPI to only allow Next.js origin
- **User Isolation**: All DB queries filtered by `userId` from JWT
- **Password Hashing**: bcrypt with 12 rounds

## MCP Server Access

**MongoDB MCP Server**: Connected and configured
- **Tools Available**: Database operations via MongoDB MCP
- **Connection**: Configured via environment variables
- **Status**: Telemetry enabled, logs in AppData\Local\mongodb\mongodb-mcp\.app-logs

**Usage**: Claude Code has direct access to MongoDB operations through the MCP server for debugging and data inspection.

## Deployment

**Docker Deployment** (see `Dockerfile` and `docker-compose.yml`):
- Multi-stage build for Next.js
- Separate container for FastAPI
- MongoDB, Weaviate, Ollama on separate AWS instances

**Environment Variables**: Never commit real credentials, use AWS Secrets Manager or similar in production

## Recommended Workflow

1. **Find User Story**: Check `.stories/` for relevant epic and story file
2. **Read Test Spec**: Review `.stories/*/tests/VIP-*-test.md` for BDD scenarios
3. **Read Acceptance Criteria**: Understand requirements from story file
4. **Implement Backend First**: Create Next.js API route with `withAuth`
5. **Add FastAPI Endpoint**: If AI operations needed, create FastAPI router
6. **Create Frontend Component**: Build UI with shadcn/ui components
7. **Test Data Flow**: Verify entire flow from frontend → Next.js → FastAPI → External Services
8. **Run Playwright Tests**: Convert Gherkin specs to E2E tests and verify
9. **Commit with Story ID**: `[VIP-10001] Implement feature`

## Additional Documentation

- **FastAPI Service**: `api-service/README.md` - Complete FastAPI documentation
- **Database Setup**: `misc/DATABASE_SCRIPTS.md` - Migration and seeding guide
- **Local Setup**: `misc/LOCAL_SETUP_GUIDE.md` - Step-by-step setup for new developers
- **Story Management**: `.stories/README.md` - How to use and update user stories
- **Page Mapping**: `.stories/STORY-PAGE-MAPPING.md` - UI route documentation
