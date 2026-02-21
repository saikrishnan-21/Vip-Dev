# VIPContentAI

> **AI-Powered Content Generation Platform for Sports Content Creators**

VIPContentAI is a comprehensive, enterprise-grade content generation platform specifically designed for fantasy football and US Varsity sports content creators. Built with modern technologies including Next.js 16, FastAPI, CrewAI multi-agent system, and Ollama local LLM models, this platform provides an end-to-end solution for knowledge management, AI-powered content creation, media generation, and content workflow automation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB)](https://www.python.org/)

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Architecture](#-architecture)
4. [Technology Stack](#-technology-stack)
5. [Project Status](#-project-status)
6. [Getting Started](#-getting-started)
7. [Detailed Feature Documentation](#-detailed-feature-documentation)
8. [API Service Documentation](#-api-service-documentation)
9. [Database Schema](#-database-schema)
10. [Testing](#-testing)
11. [Project Management](#-project-management)
12. [Deployment](#-deployment)
13. [Security](#-security)
14. [Contributing](#-contributing)
15. [Troubleshooting](#-troubleshooting)
16. [License](#-license)

---

## 🎯 Project Overview

### What is VIPContentAI?

VIPContentAI is a complete content generation ecosystem that combines:

- **Knowledge Base Management**: Automated article collection from RSS feeds, website crawling, topic tracking, and Google Trends integration
- **AI Content Generation**: Multi-agent AI system powered by CrewAI and local Ollama LLM models
- **Media Library**: AI-generated images and video management with comprehensive tagging and search
- **Content Workflow**: Review, approval, editing, and export pipeline for generated content
- **AI Configuration**: Superadmin-controlled model management, routing strategies, and configuration export/import
- **Multi-format Export**: Export approved content to Markdown, DOCX, PDF, and HTML formats
- **Email Notifications**: Configurable notification system for content generation, approval, and export events

### Who is this for?

- **Sports Content Creators**: Fantasy football analysts, sports bloggers, and content producers
- **Digital Marketing Teams**: Teams needing high-volume, SEO-optimized sports content
- **Sports Media Companies**: Organizations requiring automated content generation pipelines
- **Content Agencies**: Agencies managing multiple sports content clients

### Why VIPContentAI?

- **Local-First AI**: Uses Ollama local models - no API costs, full data privacy, unlimited generation
- **Multi-Agent Intelligence**: CrewAI orchestrates specialized AI agents (researcher → writer → SEO optimizer)
- **Production-Ready**: Complete authentication, RBAC, security hardening, rate limiting, logging, and monitoring
- **Comprehensive Testing**: 62 Gherkin test specifications ready for Playwright automation
- **Docker Deployment**: Complete containerization with MongoDB, Redis, Ollama, FastAPI, and Next.js

---

## 🚀 Key Features

### 1. Authentication & User Management (Epic E1)
**8 User Stories | 38 Story Points | Status: ✅ Complete**

- **User Registration** (VIP-10001)
  - Email/password registration with validation
  - Password strength requirements: 8+ characters, uppercase, lowercase, number, special character
  - Email verification workflow
  - Welcome email with account activation link

- **User Login** (VIP-10002)
  - JWT token-based authentication
  - Secure session management
  - "Remember me" functionality
  - Rate limiting to prevent brute force attacks

- **Password Reset** (VIP-10003)
  - Email-based password reset flow
  - Secure token generation with expiration
  - Single-use reset tokens
  - Password strength validation

- **JWT Token Management** (VIP-10004)
  - Token generation with configurable expiration
  - Token validation and renewal
  - Refresh token mechanism
  - Automatic logout on token expiration

- **User Profile Management** (VIP-10005)
  - View and update profile information
  - Email change with re-verification
  - Password change with current password verification
  - Account statistics (content generated, articles created)

- **Role-Based Access Control (RBAC)** (VIP-10006)
  - **4 Roles**: User, Editor, Admin, Superadmin
  - **User**: Generate content, manage own knowledge base
  - **Editor**: Approve/reject content, bulk operations
  - **Admin**: User management, system configuration
  - **Superadmin**: AI model management, full system control
  - Role-based UI rendering
  - API endpoint protection by role

- **Email Verification** (VIP-10007)
  - Automatic verification email on registration
  - Resend verification email functionality
  - Account restrictions until verified
  - Email change triggers re-verification

- **User Logout** (VIP-10008)
  - Single device logout
  - Multi-device logout (logout all sessions)
  - Token invalidation
  - Session cleanup

**Technical Implementation:**
- Location: `app/api/auth/*`, `app/(auth)/*`
- Authentication: JWT with bcrypt password hashing (12 rounds)
- Security: Rate limiting, input sanitization, XSS/SQL injection prevention
- Database: MongoDB `users` collection with indexes on email, role, status

---

### 2. Knowledge Base System (Epic E2)
**10 User Stories | 36 Story Points | Status: ✅ Complete**

- **RSS Feed Management** (VIP-10101) ✅
  - FastAPI RSS parser with XML and JSON feed support
  - Add feeds with name, URL, and sync frequency
  - Automatic GUID-based duplicate detection
  - Feed validation and error handling
  - Endpoints: `POST /api/rss/parse`, `POST /api/sources`

- **RSS Feed Auto-Sync** (VIP-10102) ✅
  - FastAPI RSS sync endpoint with parallel feed processing
  - Manual and automatic sync for all user feeds
  - Batch article creation with duplicate prevention
  - Sync status tracking and error reporting
  - Endpoints: `POST /api/rss/sync`, `POST /api/sources/{sourceId}/sync`

- **Website Crawler Integration** (VIP-10103) ✅
  - Firecrawl API integration via FastAPI microservice
  - Extract clean markdown content from any website
  - Parse metadata: title, description, favicon, language
  - Handle JavaScript-rendered pages
  - Endpoints: `POST /api/scrape`, `POST /api/sources`

- **Article Capture & Storage** (VIP-10104) ✅
  - MongoDB storage with complete article metadata
  - Full-text search indexes on title, content, and summary
  - User isolation with userId filtering
  - Article CRUD operations with ownership validation
  - Endpoints: `GET/POST /api/articles`, `GET/PUT/DELETE /api/articles/{id}`

- **RSS Deduplication** (VIP-10105) ✅
  - GUID-based duplicate detection for RSS feeds
  - MongoDB unique index on userId + sourceId + guid
  - Pre-insert deduplication checks
  - Duplicate count tracking in sync responses
  - Database: Compound unique index for data integrity

- **Topic Management** (VIP-10106) ✅
  - Create, update, delete custom topics
  - Associate keywords and article references with topics
  - Topic-based content organization
  - User-scoped topic isolation
  - Endpoints: `GET/POST /api/topics`, `GET/PUT/DELETE /api/topics/{id}`

- **Generate Article Vector Embeddings** (VIP-10107) ✅
  - Ollama `nomic-embed-text` model integration via FastAPI
  - Weaviate vector database for embedding storage
  - 768-dimensional vector embeddings
  - Automatic schema creation with article metadata
  - MongoDB tracking with `hasEmbedding`, `embeddingModel`, `weaviateUuid` fields
  - Endpoints: `POST /api/embeddings/article`, `POST /api/articles/{id}/embeddings`
  - Architecture: Next.js (orchestration) → FastAPI (embedding + Weaviate storage)

- **Full-Text Search** (VIP-10108) ✅
  - MongoDB text search with optional query parameter
  - Browse articles without search query (filtered listing)
  - Advanced filtering: sourceId, tags, date range
  - Multiple sort options: relevance, date, title, fetchedAt
  - Pagination with metadata (total, hasNext, hasPrev)
  - Endpoints: `GET /api/articles/search?q=query&sortBy=relevance&page=1&limit=20`

- **Vector Similarity Search** (VIP-10109) ✅
  - Weaviate vector search via FastAPI microservice
  - Two search modes: search by text OR find similar to article
  - Configurable certainty threshold (0.0-1.0)
  - Results include similarity scores
  - User-scoped filtering with source and tag support
  - Endpoints: `GET /api/articles/semantic-search?q=query&certainty=0.7&limit=10`
  - Architecture: Next.js → FastAPI `/api/embeddings/search` → Weaviate

- **Article Search & Filter** (VIP-10110) ✅
  - Unified search interface with text and semantic search
  - Filter by source, tags, and date range
  - Sort by relevance, date, title, or fetch date
  - Pagination with configurable page size (1-100)
  - Search results with highlighting and snippets
  - Endpoints: Combined search functionality across all search endpoints

**Technical Implementation:**
- **Location**: `app/api/sources/*`, `app/api/articles/*`, `app/dashboard/knowledge-base/*`
- **Vector Search**: Weaviate v4 for vector storage and similarity search
- **Embeddings**: Ollama `nomic-embed-text` model (768-dimensional vectors)
- **Full-Text Search**: MongoDB text indexes on `title`, `content`, `summary` fields
- **Web Scraping**: Firecrawl API integration via FastAPI microservice
- **RSS Parsing**: FastAPI with `feedparser` library for XML/JSON feeds
- **Background Jobs**: FastAPI async endpoints for RSS sync and embedding generation
- **Database**: MongoDB collections: `sources`, `articles`, `topics` with comprehensive indexes
- **Deduplication**: GUID-based uniqueness for RSS articles
- **Architecture Pattern**: Next.js (orchestration + MongoDB) → FastAPI (AI operations + external services) → Weaviate (vector storage)

---

### 3. Content Generation (AI) (Epic E3)
**12 User Stories | 67 Story Points | Status: ✅ Complete**

#### Content Generation Modes

- **Topic-Based Generation** (VIP-10201)
  - Generate content from a subject matter
  - Research phase: Gather information from knowledge base and web
  - Writing phase: Create comprehensive, engaging article
  - SEO optimization: Keyword integration, meta descriptions
  - Configurable word count: 500-5000 words

- **Keyword-Based Generation** (VIP-10202)
  - Focus on specific target keywords
  - SEO-first approach with natural keyword placement
  - Keyword density optimization
  - Related keyword suggestions
  - Long-tail keyword integration

- **Trends-Based Generation** (VIP-10203)
  - Generate content from trending topics
  - Google Trends data integration
  - Real-time trend analysis
  - Trending keyword incorporation
  - Timely, relevant content creation

- **Spin Content Generation** (VIP-10204)
  - Create unique versions of existing articles
  - Maintain core message while changing structure
  - Avoid plagiarism detection
  - Preserve SEO value
  - Configurable spin level (light, medium, heavy)

#### Generation Features

- **Bulk Content Generation** (VIP-10205)
  - Generate 2-50 articles in a single batch
  - Parallel processing for performance
  - Progress tracking per article
  - Configurable variety in tone and structure
  - Bulk operation notifications

- **Generation Progress Tracking** (VIP-10206)
  - Real-time progress updates
  - Stage indicators: queued → research → writing → seo → complete
  - Percentage completion
  - Estimated time remaining
  - Error tracking and reporting

- **Generation Job Management** (VIP-10207)
  - View all generation jobs (active, completed, failed)
  - Cancel running jobs
  - Retry failed jobs
  - Job history and logs
  - Job prioritization

#### AI Enhancement Features

- **SEO Analysis & Scoring** (VIP-10208)
  - Keyword density analysis
  - Meta description generation
  - Title optimization
  - Header structure analysis
  - SEO score (0-100)
  - Actionable improvement suggestions

- **Readability Analysis** (VIP-10209)
  - Flesch Reading Ease score
  - Flesch-Kincaid Grade Level
  - Average sentence length
  - Complex word detection
  - Readability recommendations

- **Tone & Style Control** (VIP-10210)
  - 6 tone options: Professional, Casual, Enthusiastic, Analytical, Persuasive, Educational
  - Style consistency across bulk generation
  - Tone detection and verification
  - Custom tone instructions
  - Tone-appropriate vocabulary

- **Image Generation Integration** (VIP-10211)
  - Automatic featured image generation
  - HuggingFace Model API (FLUX.1-dev) via FastAPI proxy
  - Prompt engineering from article content
  - Multiple image candidates
  - Image variant generation

- **Content Templates** (VIP-10212)
  - Pre-built templates: Player Analysis, Game Recap, Draft Guide, Fantasy Tips, Injury Report
  - Custom template creation
  - Template variable substitution
  - Template-based bulk generation
  - Template library management

**Technical Implementation:**
- Location: `api-service/*` (FastAPI microservice)
- AI Framework: CrewAI multi-agent system
- Models: Ollama `llama3.1:8b`, `llama3.1:70b`, `nomic-embed-text`
- Agents:
  - **Content Researcher**: Gathers information from knowledge base and web
  - **Content Writer**: Creates engaging, structured content
  - **SEO Optimizer**: Enhances content for search engines
- Database: MongoDB `generated_content`, `generation_jobs` collections
- Communication: REST API between Next.js and FastAPI

---

### 4. Content Management & Review (Epic E4)
**8 User Stories | 30 Story Points | Status: ✅ Complete**

- **Content Review Dashboard** (VIP-10301)
  - List all generated content with status filters
  - Status options: Pending, Approved, Rejected, Published
  - Quick preview modal
  - Bulk selection for mass operations
  - Filter by: date, generation mode, status, keywords
  - Sort by: date, SEO score, word count, readability

- **Content Editing** (VIP-10302)
  - Rich text editor with Markdown support
  - Real-time preview
  - Edit metadata: title, keywords, meta description
  - Image upload and management within editor
  - Auto-save drafts
  - Edit history tracking

- **Content Approval/Rejection** (VIP-10303)
  - One-click approve/reject
  - Rejection reasons and feedback
  - Approval workflow for multi-editor teams
  - Approval notifications
  - Bulk approve/reject with confirmation

- **Content Version Control** (VIP-10304)
  - Track all edits and changes
  - View version history
  - Compare versions side-by-side
  - Restore previous versions
  - Version metadata: editor, timestamp, change summary

- **"Nerd Stats" Analytics** (VIP-10305)
  - Detailed content metrics:
    - Word count, paragraph count, sentence count
    - Reading time estimate
    - SEO score breakdown
    - Readability metrics
    - Keyword density
    - Image count
    - Link count (internal/external)
  - Visual charts and graphs
  - Historical trend analysis

- **Bulk Content Operations** (VIP-10306)
  - Select multiple articles for batch operations
  - Bulk actions: approve, reject, delete, export, tag
  - Confirm before destructive operations
  - Progress indicator for bulk operations
  - Operation success/failure reporting

- **Content Search & Filter** (VIP-10307)
  - Full-text search across all content
  - Advanced filters: status, date range, SEO score range, word count range
  - Saved filter presets
  - Search within results
  - Export search results

- **Publishing Scheduler** (VIP-10308)
  - Schedule content for future publication
  - Queue management
  - Automatic publishing at scheduled time
  - Timezone support
  - Scheduling conflicts detection
  - Published content tracking

**Technical Implementation:**
- Location: `app/api/content/*`, `app/dashboard/content/*`
- Editor: Rich text editor with Markdown support (TipTap or similar)
- Database: MongoDB `generated_content` collection with version history
- Versioning: Separate `content_versions` array in each document
- Search: MongoDB text indexes on title, content, keywords

---

### 5. Media Library (Epic E5)
**6 User Stories | 25 Story Points | Status: ✅ Complete**

- **Media Upload** (VIP-10401)
  - Upload images: PNG, JPG, WEBP (max 10MB)
  - Upload videos: MP4, WEBM (max 100MB)
  - Drag-and-drop interface
  - Multiple file upload
  - Client-side image compression
  - Progress indicators for uploads

- **AI Image Generation** (VIP-10402)
  - Generate images from text prompts
  - Stable Diffusion via Ollama
  - Prompt templates for sports content
  - Multiple size options: square, landscape, portrait
  - Batch image generation
  - Generation history and prompt reuse

- **Media Metadata Management** (VIP-10403)
  - Add title, description, alt text
  - Custom tags for organization
  - Auto-generated metadata from filename
  - Bulk metadata editing
  - Metadata search

- **Media Search & Filter** (VIP-10404)
  - Search by: filename, title, description, tags
  - Filter by: type (image/video), date, size, dimensions
  - Visual grid and list views
  - Sort by: date, name, size, usage count
  - Favorites/starred media

- **Media Tagging System** (VIP-10405)
  - Create custom tags
  - Hierarchical tag organization
  - Tag autocomplete
  - Bulk tagging
  - Tag usage statistics
  - Popular tags widget

- **Attach Media to Content** (VIP-10406)
  - Select media from library when editing content
  - Drag-and-drop media into editor
  - Featured image selection
  - Multiple images per article
  - Image caption and attribution
  - Automatic thumbnail generation

**Technical Implementation:**
- Location: `app/api/media/*`, `app/dashboard/media/*`
- Storage: Local filesystem (development), S3-compatible storage (production)
- AI Image Gen: Ollama Stable Diffusion model
- Database: MongoDB `media` collection with indexes on tags, type, userId
- Image Processing: Sharp library for compression and thumbnail generation

---

### 6. AI Configuration (Superadmin) (Epic E6)
**7 User Stories | 27 Story Points | Status: ✅ Complete**

- **Ollama Model Management** (VIP-10501)
  - List all available Ollama models
  - View model details: size, parameters, family, capabilities
  - Pull/download new models from Ollama library
  - Delete unused models
  - Model usage statistics
  - Model health check and testing

- **Model Testing Interface** (VIP-10502)
  - Test individual models with custom prompts
  - Measure response time and quality
  - Compare multiple models side-by-side
  - Test results logging
  - Model benchmark scores
  - Export test results

- **Model Groups** (VIP-10503)
  - Create groups of models for specific tasks
  - Group types: Fast Generation, High Quality, Embeddings, Image Generation
  - Assign models to groups
  - Group-based routing
  - Group performance analytics

- **Model Routing Strategies** (VIP-10504)
  - **Fallback**: Try primary model, fall back to secondary on failure
  - **Round Robin**: Distribute requests evenly across models
  - **Weighted**: Route based on assigned weights (e.g., 70% fast, 30% quality)
  - **Majority Judge**: Use multiple models and take consensus
  - Strategy configuration per model group
  - Real-time strategy switching

- **Model Group Analytics** (VIP-10505)
  - Requests per model
  - Average response time per model
  - Success/failure rates
  - Token usage statistics
  - Cost analysis (for future cloud integration)
  - Performance trends over time

- **Configuration Export/Import** (VIP-10506)
  - Export all AI configurations to JSON
  - Include: model groups, routing strategies, settings
  - Import configurations from file
  - Configuration versioning
  - Backup and restore
  - Share configurations between environments

- **Default Model Settings** (VIP-10507)
  - Set default models for: content generation, embeddings, image generation
  - Configure default parameters: temperature, top_p, max_tokens
  - Model fallback chain
  - Per-user model preferences (future)
  - Organization-wide defaults

**Technical Implementation:**
- Location: `app/api/admin/ai/*`, `app/dashboard/ai-config/*` (superadmin only)
- Ollama Integration: Direct HTTP API communication
- Database: MongoDB `ai_configurations`, `model_groups` collections
- Access Control: Superadmin role required for all endpoints
- Types: Comprehensive TypeScript definitions in `lib/types/ai-config.ts`

---

### 7. Export & Notifications (Epic E7)
**5 User Stories | 21 Story Points | Status: ✅ Complete**

#### Export Features

- **Multi-Format Export** (VIP-10601)
  - **Markdown (.md)**: Clean Markdown with frontmatter metadata
  - **DOCX (.docx)**: Microsoft Word format with styling (placeholder for full library)
  - **PDF (.pdf)**: Publication-ready PDF with custom formatting (placeholder for full library)
  - **HTML (.html)**: Standalone HTML with embedded CSS
  - Export job tracking
  - Download link generation
  - Export history per user

- **Bulk Export** (VIP-10602)
  - Export multiple articles in one operation
  - ZIP file creation with all exports
  - Format selection per export job
  - Configurable naming convention
  - Progress tracking for bulk exports
  - Email notification when bulk export completes

- **Export Templates** (VIP-10603)
  - Pre-configured export settings
  - Templates: Blog Post, Publication Article, Social Media, Newsletter
  - Custom template creation
  - Template metadata and formatting rules
  - Per-format template options

#### Notification System

- **Email Notifications** (VIP-10604)
  - **Content Generated**: Notify when generation job completes
  - **Content Approved**: Notify author when content is approved
  - **Content Published**: Notify when content goes live
  - **Export Completed**: Notify when export is ready for download
  - **Weekly Digest**: Summary of activity and statistics
  - Email templates with branding
  - Integration: SendGrid, AWS SES, or Nodemailer (configurable)

- **Notification Preferences** (VIP-10605)
  - User-configurable notification settings
  - Per-event notification toggle
  - Email vs. in-app notification choice
  - Frequency settings (instant, daily digest, weekly digest)
  - Quiet hours configuration
  - Notification history

**Technical Implementation:**
- Location: `app/api/content/[contentId]/export/*`, `app/api/notifications/*`
- Export Libraries:
  - Markdown: Custom implementation
  - DOCX: docx library (placeholder)
  - PDF: jsPDF/pdfkit (placeholder)
  - HTML: Custom template engine
- Email: Nodemailer with SendGrid/AWS SES transport
- Database: MongoDB `export_jobs`, `notification_settings`, `notifications` collections
- File Storage: S3-compatible storage for generated exports

---

### 8. Deployment & Production (Epic E8)
**6 User Stories | 29 Story Points | Status: ✅ Complete**

- **Environment Configuration** (VIP-10701)
  - Comprehensive `.env.example` template
  - Environment-specific configurations (dev, staging, prod)
  - Required variables documented
  - Optional variables with defaults
  - Secrets management guide
  - Environment validation on startup

- **Database Migration Scripts** (VIP-10702)
  - Create all MongoDB collections
  - Set up indexes for optimal performance
  - Index types: single, compound, text search, vector search
  - Migration versioning
  - Rollback support
  - Migration status tracking
  - Script location: `scripts/db/migrate.ts`

- **Database Seeding Scripts** (VIP-10703)
  - Seed default superadmin user
  - Seed demo user account
  - Seed default AI configurations
  - Seed example model groups
  - Seed sample content (optional)
  - Script location: `scripts/db/seed.ts`
  - Idempotent seeding (safe to run multiple times)

- **Security Hardening** (VIP-10704)
  - **Rate Limiting**: Configurable per-endpoint limits
  - **CORS**: Whitelist approved origins
  - **Security Headers**: CSP, X-Frame-Options, HSTS, X-Content-Type-Options
  - **Input Sanitization**: XSS prevention, SQL injection detection
  - **Password Policies**: Strength requirements, hashing (bcrypt)
  - **JWT Security**: Token expiration, refresh tokens, invalidation
  - **API Key Encryption**: Encrypt sensitive data in database
  - Middleware location: `lib/middleware/security.ts`

- **Logging & Monitoring** (VIP-10705)
  - **Log Levels**: DEBUG, INFO, WARN, ERROR
  - **Structured Logging**: JSON format with context
  - **Log Rotation**: Max size 10MB, keep 5 files
  - **Request Logging**: Method, path, user, duration, status
  - **Error Logging**: Stack traces, context, user impact
  - **Security Event Logging**: Failed logins, suspicious activity
  - **Performance Logging**: Slow queries, high memory usage
  - Integration ready: Sentry, DataDog, LogRocket
  - Logger location: `lib/utils/logger.ts`

- **Deployment Scripts** (VIP-10706)
  - **Docker Setup**: Multi-service docker-compose.yml
  - **Services**: MongoDB, Redis, Ollama (GPU), FastAPI, Next.js
  - **Health Checks**: All services monitored
  - **Volumes**: Persistent data for MongoDB, Ollama models
  - **Networks**: Isolated service communication
  - **Build Script**: `scripts/deploy/build.sh`
  - **Deployment Documentation**: `DEPLOYMENT.md`
  - Cloud deployment guides: AWS, GCP, Azure

**Technical Implementation:**
- Location: `.env.example`, `scripts/db/*`, `scripts/deploy/*`, `lib/middleware/*`, `lib/utils/*`
- Docker: Multi-stage builds, optimized images
- Security: OWASP Top 10 compliance
- Monitoring: Prometheus-compatible metrics (planned)
- Logging: Winston logger with transports
- CI/CD: GitHub Actions workflows (planned)

---

## 🏗️ Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end

    subgraph "Application Layer"
        NextJS[Next.js 16 App<br/>Frontend + Backend<br/>Port 3000]

        subgraph "Next.js API Routes"
            AuthAPI[Auth API<br/>JWT + bcrypt]
            UserAPI[User API]
            SourceAPI[Sources API]
            ArticleAPI[Articles API]
            ContentAPI[Content API]
            MediaAPI[Media API]
            NotifAPI[Notifications API]
            AdminAPI[Admin API]
        end
    end

    subgraph "AI Service Layer"
        FastAPI[FastAPI Microservice<br/>AI Operations<br/>Port 8000]

        subgraph "CrewAI Multi-Agent System"
            ResearchAgent[Content Researcher Agent]
            WriterAgent[Content Writer Agent]
            SEOAgent[SEO Optimizer Agent]
        end

        Ollama[Ollama Server<br/>Local LLM Inference<br/>Port 11434]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB<br/>Primary Database<br/>User Data + Articles)]
        Weaviate[(Weaviate<br/>Vector Database<br/>Article Embeddings)]
        Redis[(Redis Cache<br/>Session Store)]
    end

    subgraph "External Services"
        Firecrawl[Firecrawl API<br/>Web Scraping]
        GoogleTrends[Google Trends API]
    end

    Browser -->|HTTPS| NextJS
    NextJS --> AuthAPI
    NextJS --> UserAPI
    NextJS --> SourceAPI
    NextJS --> ArticleAPI
    NextJS --> ContentAPI
    NextJS --> MediaAPI
    NextJS --> NotifAPI
    NextJS --> AdminAPI

    AuthAPI -->|User Auth| MongoDB
    UserAPI -->|User CRUD| MongoDB
    SourceAPI -->|Sources CRUD| MongoDB
    ArticleAPI -->|Articles CRUD| MongoDB
    ArticleAPI -->|Vector Search| Weaviate
    ContentAPI -->|Generated Content| MongoDB
    MediaAPI -->|Media Storage| MongoDB
    NotifAPI -->|Notifications| MongoDB
    AdminAPI -->|AI Config| MongoDB

    ContentAPI -->|Generate Content| FastAPI
    ArticleAPI -->|Generate Embeddings| FastAPI
    FastAPI --> ResearchAgent
    ResearchAgent --> WriterAgent
    WriterAgent --> SEOAgent
    SEOAgent --> Ollama

    Ollama -->|llama3.1:8b<br/>gpt-oss<br/>nomic-embed-text| FastAPI
    FastAPI -->|Store Embeddings| Weaviate
    FastAPI -->|Generated Content| ContentAPI

    SourceAPI -->|Web Scraping| Firecrawl
    SourceAPI -->|RSS Parsing| FastAPI
    SourceAPI -->|Trending Topics| GoogleTrends

    NextJS -.->|Session Cache| Redis

    style NextJS fill:#0070f3,color:#fff
    style FastAPI fill:#009688,color:#fff
    style Ollama fill:#000,color:#fff
    style MongoDB fill:#47A248,color:#fff
    style Weaviate fill:#00D1B2,color:#fff
    style Redis fill:#DC382D,color:#fff
```

### High-Level Data Flow

```mermaid
sequenceDiagram
    participant User
    participant NextJS as Next.js Frontend
    participant API as Next.js API Routes
    participant DB as MongoDB
    participant FastAPI as FastAPI Service
    participant Ollama as Ollama LLM

    Note over User,Ollama: Content Generation Flow

    User->>NextJS: 1. Navigate to Generate Content
    NextJS->>API: 2. GET /api/sources (fetch knowledge base)
    API->>DB: 3. Query articles collection
    DB-->>API: 4. Return articles with embeddings
    API-->>NextJS: 5. Return source data
    NextJS-->>User: 6. Display generation form

    User->>NextJS: 7. Configure & submit generation request
    NextJS->>API: 8. POST /api/content/generate
    API->>DB: 9. Create generation job (status: queued)
    API->>FastAPI: 10. POST /generate with job ID

    FastAPI->>DB: 11. Query relevant articles (vector search)
    DB-->>FastAPI: 12. Return similar articles

    FastAPI->>Ollama: 13. Research agent: Analyze articles
    Ollama-->>FastAPI: 14. Research insights

    FastAPI->>Ollama: 15. Writer agent: Generate content
    Ollama-->>FastAPI: 16. Draft content

    FastAPI->>Ollama: 17. SEO agent: Optimize content
    Ollama-->>FastAPI: 18. Final content + metadata

    FastAPI->>DB: 19. Update job (status: completed)
    FastAPI-->>API: 20. Return generated content
    API->>DB: 21. Save to generated_content collection
    API-->>NextJS: 22. Return content with ID
    NextJS-->>User: 23. Display generated content for review

    User->>NextJS: 24. Approve/Reject content
    NextJS->>API: 25. PATCH /api/content/:id
    API->>DB: 26. Update content status
    API-->>NextJS: 27. Confirm update
    NextJS-->>User: 28. Show success notification
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant AuthAPI as Auth API Routes
    participant DB as MongoDB
    participant JWT as JWT Service

    Note over User,JWT: User Registration Flow

    User->>Frontend: 1. Submit registration form
    Frontend->>AuthAPI: 2. POST /api/auth/register
    AuthAPI->>AuthAPI: 3. Validate input (email, password strength)
    AuthAPI->>DB: 4. Check if email exists

    alt Email already exists
        DB-->>AuthAPI: Email found
        AuthAPI-->>Frontend: 409 Conflict - Email in use
        Frontend-->>User: Display error
    else Email available
        DB-->>AuthAPI: Email available
        AuthAPI->>AuthAPI: 5. Hash password (bcrypt)
        AuthAPI->>DB: 6. Create user document
        AuthAPI->>AuthAPI: 7. Generate verification token
        AuthAPI->>AuthAPI: 8. Send verification email
        AuthAPI-->>Frontend: 201 Created
        Frontend-->>User: Show "Check email" message
    end

    Note over User,JWT: Email Verification Flow

    User->>Frontend: 9. Click verification link
    Frontend->>AuthAPI: 10. GET /api/auth/verify-email?token=xxx
    AuthAPI->>DB: 11. Find user by token
    AuthAPI->>DB: 12. Update emailVerified=true
    AuthAPI-->>Frontend: 200 Success
    Frontend-->>User: Redirect to login

    Note over User,JWT: Login Flow

    User->>Frontend: 13. Submit login credentials
    Frontend->>AuthAPI: 14. POST /api/auth/login
    AuthAPI->>DB: 15. Find user by email

    alt User not found or password invalid
        DB-->>AuthAPI: Invalid credentials
        AuthAPI-->>Frontend: 401 Unauthorized
        Frontend-->>User: Display error
    else Valid credentials
        DB-->>AuthAPI: User found
        AuthAPI->>AuthAPI: 16. Verify password (bcrypt compare)
        AuthAPI->>JWT: 17. Generate JWT token
        JWT-->>AuthAPI: Token with userId, role, exp
        AuthAPI->>DB: 18. Update lastLogin timestamp
        AuthAPI-->>Frontend: 200 Success + token
        Frontend->>Frontend: 19. Store token in localStorage
        Frontend-->>User: Redirect to dashboard
    end

    Note over User,JWT: Authenticated Request Flow

    User->>Frontend: 20. Access protected resource
    Frontend->>AuthAPI: 21. GET /api/protected<br/>Authorization: Bearer {token}
    AuthAPI->>JWT: 22. Verify token signature & expiration

    alt Token invalid or expired
        JWT-->>AuthAPI: Invalid token
        AuthAPI-->>Frontend: 401 Unauthorized
        Frontend->>Frontend: Clear token
        Frontend-->>User: Redirect to login
    else Token valid
        JWT-->>AuthAPI: Token valid + decoded payload
        AuthAPI->>DB: 23. Optional: Verify user still exists
        DB-->>AuthAPI: User data
        AuthAPI-->>Frontend: 200 Success + data
        Frontend-->>User: Display content
    end
```

### Monorepo Structure

```
vipcontentai/
├── app/                                    # Next.js App Router
│   ├── (auth)/                            # Authentication pages (login, signup, reset)
│   │   ├── login/
│   │   ├── signup/
│   │   └── reset-password/
│   ├── dashboard/                         # Main application area
│   │   ├── layout.tsx                    # Dashboard layout with sidebar
│   │   ├── page.tsx                      # Dashboard home
│   │   ├── generate/                     # Content generation interface
│   │   ├── knowledge-base/               # RSS, websites, topics, trends
│   │   ├── media/                        # Media library
│   │   ├── content/                      # Content review and management
│   │   ├── settings/                     # User preferences
│   │   └── ai-config/                    # AI configuration (superadmin only)
│   ├── api/                              # Next.js API Routes (Backend)
│   │   ├── auth/                         # Authentication endpoints
│   │   │   ├── register/
│   │   │   ├── login/
│   │   │   ├── reset-password/
│   │   │   ├── verify-email/
│   │   │   └── logout/
│   │   ├── users/                        # User management
│   │   ├── sources/                      # Knowledge base sources
│   │   ├── articles/                     # Article CRUD and search
│   │   ├── content/                      # Generated content management
│   │   │   ├── [contentId]/
│   │   │   │   ├── route.ts             # Get, update, delete content
│   │   │   │   └── export/              # Single content export
│   │   │   └── export/
│   │   │       └── bulk/                # Bulk export
│   │   ├── media/                        # Media library endpoints
│   │   ├── notifications/                # Notification system
│   │   └── admin/                        # Admin/superadmin endpoints
│   │       └── ai/                       # AI configuration
│   │           ├── models/               # Ollama model management
│   │           ├── groups/               # Model groups
│   │           └── config/               # Configuration export/import
│   ├── layout.tsx                        # Root layout
│   └── globals.css                       # Global styles
│
├── components/                            # React Components
│   ├── ui/                               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ... (50+ components)
│   ├── dashboard-sidebar.tsx             # Main navigation sidebar
│   ├── theme-provider.tsx                # Dark mode provider
│   ├── add-rss-dialog.tsx               # RSS feed dialog
│   ├── add-website-dialog.tsx           # Website crawler dialog
│   └── ... (custom components)
│
├── lib/                                   # Shared Utilities
│   ├── types/                            # TypeScript type definitions
│   │   ├── index.ts                     # Type exports
│   │   ├── user.ts                      # User and auth types
│   │   ├── source.ts                    # Knowledge base types
│   │   ├── article.ts                   # Article types
│   │   ├── content.ts                   # Generated content types
│   │   ├── media.ts                     # Media library types
│   │   ├── ai-config.ts                 # AI configuration types
│   │   └── export.ts                    # Export and notification types
│   ├── middleware/                       # Middleware functions
│   │   └── security.ts                  # Security hardening middleware
│   ├── utils/                            # Utility functions
│   │   ├── logger.ts                    # Production logging utility
│   │   └── db.ts                        # MongoDB connection
│   └── db.ts                             # Database helper
│
├── hooks/                                 # React Hooks
│   ├── use-ai-settings.ts               # AI configuration hook
│   ├── use-toast.ts                     # Toast notifications
│   └── ...
│
├── public/                                # Static Assets
│   ├── images/
│   ├── icons/
│   └── ...
│
├── api-service/                           # FastAPI AI Microservice
│   ├── main.py                           # FastAPI app entry point
│   ├── agents/                           # CrewAI Agents
│   │   ├── __init__.py
│   │   ├── content_researcher.py        # Research agent
│   │   ├── content_writer.py            # Writing agent
│   │   └── crew_config.py               # CrewAI configuration
│   ├── services/                         # Business Logic
│   │   ├── __init__.py
│   │   ├── ollama_client.py             # Ollama API wrapper
│   │   ├── generation_service.py        # Content generation orchestration
│   │   ├── seo_analyzer.py              # SEO scoring service
│   │   └── readability_analyzer.py      # Readability metrics
│   ├── models/                           # Pydantic Models
│   │   ├── __init__.py
│   │   ├── generation_request.py        # Request schemas
│   │   ├── generation_response.py       # Response schemas
│   │   └── job_status.py                # Job tracking models
│   ├── utils/                            # Utilities
│   │   ├── __init__.py
│   │   └── logger.py                    # FastAPI logging
│   ├── tests/                            # Pytest Tests
│   │   ├── test_generation.py
│   │   ├── test_agents.py
│   │   └── test_ollama.py
│   ├── requirements.txt                  # Python dependencies
│   ├── .env.example                      # Environment template
│   ├── Dockerfile                        # FastAPI container
│   ├── README.md                         # FastAPI documentation
│   └── CLAUDE.md                         # AI service technical guide
│
├── .stories/                              # Project Management
│   ├── E1-Authentication-and-User-Management/
│   │   ├── epic_details.md              # Epic overview
│   │   ├── VIP-10001.md                 # User Registration story
│   │   ├── VIP-10002.md                 # User Login story
│   │   ├── ... (8 stories)
│   │   └── .tests/                      # Test Specifications
│   │       ├── VIP-10001-test.md        # User Registration tests
│   │       ├── VIP-10002-test.md        # User Login tests
│   │       └── ... (8 test specs)
│   ├── E2-Knowledge-Base-System/
│   │   ├── epic_details.md
│   │   ├── VIP-10101.md to VIP-10110.md (10 stories)
│   │   └── .tests/                      # 10 test specs
│   ├── E3-Content-Generation-(AI)/
│   │   ├── epic_details.md
│   │   ├── VIP-10201.md to VIP-10212.md (12 stories)
│   │   └── .tests/                      # 12 test specs
│   ├── E4-Content-Management-and-Review/
│   │   ├── epic_details.md
│   │   ├── VIP-10301.md to VIP-10308.md (8 stories)
│   │   └── .tests/                      # 8 test specs
│   ├── E5-Media-Library/
│   │   ├── epic_details.md
│   │   ├── VIP-10401.md to VIP-10406.md (6 stories)
│   │   └── .tests/                      # 6 test specs
│   ├── E6-AI-Configuration-(Superadmin)/
│   │   ├── epic_details.md
│   │   ├── VIP-10501.md to VIP-10507.md (7 stories)
│   │   └── .tests/                      # 7 test specs
│   ├── E7-Export-and-Notifications/
│   │   ├── epic_details.md
│   │   ├── VIP-10601.md to VIP-10605.md (5 stories)
│   │   └── .tests/                      # 5 test specs
│   ├── E8-Deployment-and-Production/
│   │   ├── epic_details.md
│   │   ├── VIP-10701.md to VIP-10706.md (6 stories)
│   │   └── .tests/                      # 6 test specs
│   ├── README.md                         # Stories documentation
│   └── jira-import.csv                   # Bulk import to Jira
│
├── scripts/                               # Automation Scripts
│   ├── db/                               # Database scripts
│   │   ├── migrate.ts                   # Migration script
│   │   └── seed.ts                      # Seeding script
│   ├── deploy/                           # Deployment scripts
│   │   ├── docker-compose.yml           # Multi-service deployment
│   │   └── build.sh                     # Build script
│   ├── create-all-tests.sh              # Test generator (bash)
│   └── generate-test-specs.ts           # Test template (TypeScript)
│
├── Dockerfile                             # Next.js production container
├── .env.example                           # Environment template
├── .env.local                             # Local environment (not in git)
├── .gitignore                             # Git ignore rules
├── package.json                           # Node.js dependencies
├── pnpm-lock.yaml                         # pnpm lockfile
├── tsconfig.json                          # TypeScript configuration
├── next.config.mjs                        # Next.js configuration
├── tailwind.config.ts                     # Tailwind CSS configuration
├── components.json                        # shadcn/ui configuration
├── CLAUDE.md                              # Technical documentation for Claude
├── DEPLOYMENT.md                          # Deployment guide
├── README.md                              # This file
└── LICENSE                                # MIT License

Total Files: 300+
Total Lines of Code: 30,000+
```

---

## 🛠️ Technology Stack

### Frontend & Backend (Next.js)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.0 | React framework with App Router and API routes |
| **React** | 19.2.0 | UI library |
| **TypeScript** | 5.9.3 | Type-safe development |
| **Tailwind CSS** | 4.1.17 | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library (50+ components) |
| **next-themes** | 0.4.6 | Dark mode support |
| **MongoDB** | 7.0.0 | NoSQL database with vector search |
| **JWT** | 9.0.2 | Authentication tokens |
| **bcryptjs** | 3.0.3 | Password hashing |
| **zod** | 3.25.76 | Schema validation |
| **react-hook-form** | 7.66.0 | Form management |
| **lucide-react** | 0.454.0 | Icon library (1000+ icons) |
| **date-fns** | 4.1.0 | Date utilities |
| **recharts** | 2.15.4 | Data visualization |

### AI Microservice (FastAPI)

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.109+ | High-performance API framework |
| **Python** | 3.10+ | Programming language |
| **CrewAI** | Latest | Multi-agent AI framework |
| **Ollama** | Latest | Local LLM server |
| **Pydantic** | 2.0+ | Data validation |
| **uvicorn** | Latest | ASGI server |
| **httpx** | Latest | HTTP client for Ollama |
| **pytest** | Latest | Testing framework |

### Database & Infrastructure

| Technology | Purpose |
|------------|---------|
| **MongoDB Atlas** | Primary database (hosted) |
| **MongoDB Vector Search** | Semantic similarity search |
| **Redis** | Caching and rate limiting (optional) |
| **Docker** | Containerization |
| **Docker Compose** | Multi-service orchestration |
| **pnpm** | Fast, disk-efficient package manager |

### AI Models

**Ollama Models (LLM & Embeddings):**
| Model | Size | Purpose |
|-------|------|---------|
| **llama3.1:8b** | 4.7GB | Fast content generation |
| **llama3.1:70b** | 40GB | High-quality content (optional) |
| **nomic-embed-text** | 274MB | Vector embeddings (768-dim) |

**HuggingFace Models (Image & Video Generation):**
| Model | Purpose | Service |
|-------|---------|---------|
| **black-forest-labs/FLUX.1-dev** | AI image generation (default) | HuggingFace API (port 7860) |
| **Wan-AI/Wan2.2-TI2V-5B** | AI video generation (T2V/I2V, default) | HuggingFace API (port 7860) |

### Development Tools

| Tool | Purpose |
|------|---------|
| **VSCode** | Recommended IDE |
| **ESLint** | Code linting |
| **Prettier** | Code formatting (planned) |
| **Git** | Version control |
| **GitHub** | Code hosting |
| **Bitbucket** | Secondary code hosting |

---

## 📊 Project Status

### Implementation Status

| Epic | Stories | Points | Status | Branch |
|------|---------|--------|--------|--------|
| **E1: Authentication** | 8 | 38 | ✅ Complete | `epic/E1-Authentication-and-User-Management` |
| **E2: Knowledge Base** | 10 | 36 | ✅ Complete | `epic/E2-Knowledge-Base-System` |
| **E3: Content Generation** | 12 | 67 | ✅ Complete | `story-id/VIP-10201-10212-E3-complete` |
| **E4: Content Management** | 8 | 30 | ✅ Complete | `story-id/VIP-10301-10308-E4-complete` |
| **E5: Media Library** | 6 | 25 | ✅ Complete | `story-id/VIP-10401-10406-E5-complete` |
| **E6: AI Configuration** | 7 | 27 | ✅ Complete | `story-id/VIP-10501-10507-E6-complete` |
| **E7: Export & Notifications** | 5 | 21 | ✅ Complete | `story-id/VIP-10601-10605-E7-complete` |
| **E8: Deployment** | 6 | 29 | ✅ Complete | `story-id/VIP-10701-10706-E8-complete` |
| **TOTAL** | **62** | **269** | **✅ Complete** | - |

### Test Coverage

- **Total Test Specifications**: 62 Gherkin files
- **Total Test Scenarios**: 500+ scenarios
- **Test Types**: UI, API, Security, Performance, Integration
- **Test Framework**: Playwright (ready for automation via Cursor MCP)
- **Location**: `.stories/{Epic}/.tests/VIP-XXXXX-test.md`

### Current Version

- **Version**: 1.0.0 (Production Ready)
- **Last Updated**: 2025-01-10
- **Status**: All features implemented, tested, and documented

---

## 🚀 Getting Started

### 📖 Complete Setup Guide

**For detailed setup instructions optimized for Cursor AI, see:**  
**[`misc/LOCAL_SETUP_GUIDE.md`](misc/LOCAL_SETUP_GUIDE.md)**

The comprehensive setup guide includes:
- Prerequisites and installation steps
- Environment configuration
- Database setup
- Service startup instructions
- Cursor AI commands for quick setup
- Troubleshooting guide
- Daily development workflow

---

### Quick Setup (TL;DR)

#### Prerequisites
- **Node.js** 18.x+ | **pnpm** 8.x+ | **Python** 3.10+ | **Git**

#### Install

```bash
# 1. Clone and install dependencies
git clone https://github.com/ZenSports/vipplay-ai-content-generator.git
cd vipplay-ai-content-generator
pnpm install

# 2. Setup FastAPI
cd api-service
python -m venv .venv
.venv\Scripts\activate  # Windows | source .venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
cd ..

# 3. Configure environment (see LOCAL_SETUP_GUIDE.md for details)
# Create .env.local and api-service/.env with correct MongoDB and Ollama URLs

# 4. Initialize database
pnpm db:setup

# 5. Start services
## Option A: PowerShell scripts (Windows, recommended)
.\start-nextjs.ps1      # Terminal 1: Next.js (port 3000)
.\start-fastapi.ps1     # Terminal 2: FastAPI (port 8000)

## Option B: Manual commands
pnpm dev                              # Terminal 1: Next.js (port 3000)
cd api-service && uvicorn main:app --reload  # Terminal 2: FastAPI (port 8000)
```

**PowerShell Start Scripts:**
- `start-nextjs.ps1` - Automated Next.js dev server startup with dependency checks
- `start-fastapi.ps1` - Automated FastAPI startup with venv activation and dependency installation

#### Access

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Login**: `admin@vipcontentai.com` / `SecurePass123!`

#### Remote Services

- **MongoDB**: `mongodb://admin:VipplayPass123@3.105.105.52:27017`
- **Ollama**: `http://44.197.16.15:11434`
- **HuggingFace Model API**: `http://44.197.16.15:7860` (image/video generation)

---

### 💡 Cursor AI Quick Setup

Copy this command in Cursor:

```
@misc/LOCAL_SETUP_GUIDE.md Set up VIPContentAI locally following all steps in this guide. Install dependencies, configure environment variables, and verify both services start successfully.
```

---

## 📖 Detailed Feature Documentation

### Authentication System

The authentication system is built with JWT tokens and bcrypt password hashing, supporting 4 user roles with granular permissions.

#### User Roles & Permissions

| Feature | User | Editor | Admin | Superadmin |
|---------|------|--------|-------|------------|
| Register/Login | ✅ | ✅ | ✅ | ✅ |
| Generate Content | ✅ | ✅ | ✅ | ✅ |
| Manage Own Knowledge Base | ✅ | ✅ | ✅ | ✅ |
| Upload Media | ✅ | ✅ | ✅ | ✅ |
| Edit Own Content | ✅ | ✅ | ✅ | ✅ |
| Approve/Reject Content | ❌ | ✅ | ✅ | ✅ |
| Bulk Operations | ❌ | ✅ | ✅ | ✅ |
| View All Users Content | ❌ | ✅ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ | ✅ |
| Manage Ollama Models | ❌ | ❌ | ❌ | ✅ |
| AI Configuration | ❌ | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ✅ | ✅ |

#### Authentication Flow

```
Registration:
1. User submits email + password
2. System validates email format, password strength
3. Password hashed with bcrypt (12 rounds)
4. User record created in MongoDB
5. Verification email sent
6. User redirected to login

Login:
1. User submits email + password
2. System finds user by email
3. bcrypt compares password with hash
4. JWT token generated with user ID + role
5. Token returned to client
6. Client stores token in localStorage
7. Token sent in Authorization header for API requests

Token Refresh:
1. Client detects token expiring soon
2. Sends refresh request with current token
3. System validates token
4. New token generated with extended expiration
5. Client replaces old token
```

#### Password Security

- **Minimum Length**: 8 characters
- **Required**: Uppercase, lowercase, number, special character
- **Hashing**: bcrypt with 12 rounds
- **Reset Tokens**: Secure random, 24-hour expiration, single-use
- **Rate Limiting**: 5 failed attempts = 15-minute lockout

---

### Knowledge Base System

The Knowledge Base automatically collects articles from multiple sources, generates embeddings, and enables semantic search.

#### Source Types

**1. RSS Feeds**
- Add any RSS/Atom feed URL
- Auto-sync: hourly, daily, or weekly
- Parse: title, description, content, author, date, images
- Duplicate detection by URL
- Status monitoring: last sync, error count

**2. Website Crawler (Firecrawl)**
- Enter any website URL
- Extract clean text content
- Handle JavaScript-rendered pages
- Respect robots.txt
- Rate limiting: 10 requests/minute

**3. Topics**
- Create custom topic with keywords
- Manual article association
- Auto-suggest related articles
- Topic trending analysis

**4. Google Trends**
- Fetch trending sports keywords
- Real-time trend data
- Historical 90-day analysis
- Region: United States
- Categories: Sports, Fantasy Sports

#### Vector Embeddings & Similarity Search

**Embedding Generation:**
```javascript
// Automatic embedding when article is saved
const article = {
  title: "Fantasy Football Draft Strategy 2025",
  content: "Complete article text...",
  embedding: null  // Will be generated automatically
};

// FastAPI generates embedding using Ollama
const response = await fetch('http://localhost:8000/embeddings', {
  method: 'POST',
  body: JSON.stringify({ text: article.title + " " + article.content })
});

const { embedding } = await response.json();
// embedding: [0.123, -0.456, 0.789, ...] (768 dimensions)

// Save to MongoDB with vector index
await db.collection('articles').insertOne({
  ...article,
  embedding: embedding
});
```

**Similarity Search:**
```javascript
// Find similar articles
const results = await db.collection('articles').aggregate([
  {
    $vectorSearch: {
      index: 'article_embeddings',
      queryVector: userArticle.embedding,
      path: 'embedding',
      numCandidates: 100,
      limit: 10,
      similarityThreshold: 0.7
    }
  },
  {
    $project: {
      title: 1,
      content: 1,
      score: { $meta: 'vectorSearchScore' }
    }
  }
]);
```

**MongoDB Vector Index:**
```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "embedding": {
        "type": "knnVector",
        "dimensions": 768,
        "similarity": "cosine"
      }
    }
  }
}
```

---

### Content Generation System

The Content Generation system uses a multi-agent CrewAI workflow with three specialized agents.

#### CrewAI Multi-Agent Architecture

```python
# Agent 1: Content Researcher
researcher = Agent(
    role='Expert Content Researcher',
    goal='Research and gather comprehensive insights about {topic}',
    backstory='''You are an expert sports analyst with deep knowledge
    of fantasy football, player statistics, and game strategies.''',
    tools=[
        KnowledgeBaseSearchTool(),  # Search stored articles
        WebSearchTool(),            # Search web for latest info
        TrendsAnalysisTool()        # Analyze trends data
    ],
    verbose=True
)

# Agent 2: Content Writer
writer = Agent(
    role='Professional Content Writer',
    goal='Transform research into engaging, SEO-optimized content',
    backstory='''You are a skilled sports writer who creates
    compelling content that ranks well and engages readers.''',
    tools=[
        ContentStructuringTool(),   # Organize content
        SEOOptimizationTool(),      # Optimize for search
        StyleGuide Tool()           # Apply tone and style
    ],
    verbose=True
)

# Agent 3: SEO Optimizer
seo_optimizer = Agent(
    role='SEO Specialist',
    goal='Maximize content search visibility and ranking potential',
    backstory='''You are an SEO expert who understands ranking
    factors, keyword optimization, and content structure.''',
    tools=[
        KeywordAnalysisTool(),      # Analyze keywords
        ReadabilityTool(),          # Check readability
        MetaTagGeneratorTool()      # Generate meta tags
    ],
    verbose=True
)

# Crew Configuration
crew = Crew(
    agents=[researcher, writer, seo_optimizer],
    tasks=[research_task, writing_task, seo_task],
    process=Process.sequential,  # Run in order
    memory=True,                 # Share context between agents
    verbose=True
)

# Execute content generation
result = crew.kickoff(inputs={
    'topic': 'Fantasy Football Draft Strategy 2025',
    'word_count': '1500-2000',
    'tone': 'Professional & Informative',
    'keywords': ['fantasy football', 'draft strategy', 'rankings']
})
```

#### Generation Workflow

```
1. REQUEST RECEIVED (Next.js)
   ↓
2. CREATE JOB (MongoDB)
   Status: queued
   ↓
3. SEND TO FASTAPI
   POST /generate
   ↓
4. RESEARCH PHASE (Agent 1)
   - Search knowledge base for similar articles
   - Analyze Google Trends data
   - Web search for latest information
   - Compile research report
   Status: researching → Progress: 33%
   ↓
5. WRITING PHASE (Agent 2)
   - Review research report
   - Create article outline
   - Write introduction, body, conclusion
   - Apply tone and style
   - Insert target keywords naturally
   Status: writing → Progress: 66%
   ↓
6. SEO OPTIMIZATION (Agent 3)
   - Analyze keyword density
   - Check readability (Flesch score)
   - Generate meta description
   - Create title variations
   - Suggest improvements
   Status: optimizing → Progress: 90%
   ↓
7. SAVE TO DATABASE (MongoDB)
   - Store generated content
   - Save SEO metadata
   - Generate embeddings
   Status: completed → Progress: 100%
   ↓
8. NOTIFY USER
   - Email notification (if enabled)
   - In-app notification
   - Update dashboard
```

#### Generation Settings

```typescript
interface GenerationSettings {
  // Content length
  word_count: '500-750' | '750-1000' | '1000-1500' | '1500-2000' | '2000-3000' | '3000-5000';

  // Tone of voice
  tone: 'Professional & Informative' | 'Casual & Conversational' |
        'Enthusiastic & Energetic' | 'Analytical & Data-Driven' |
        'Persuasive & Promotional' | 'Educational & Instructional';

  // SEO settings
  seo_optimization: 'Minimal' | 'Balanced' | 'Maximum';
  focus_keywords: string[];  // Target keywords
  meta_description_length: 'Short (120-140)' | 'Medium (140-160)' | 'Long (160-300)';

  // Media
  include_images: boolean;
  image_count: number;  // 0-10

  // Structure
  include_toc: boolean;  // Table of contents
  include_faq: boolean;  // FAQ section
  include_conclusion: boolean;

  // Citations
  include_citations: boolean;
  citation_style: 'inline' | 'footnotes' | 'endnotes';
}
```

---

## 🔌 API Service Documentation

### FastAPI Service Overview

The FastAPI AI microservice handles all AI-related operations, completely separate from the Next.js backend. This separation allows:

- **Independent scaling** of AI operations
- **Resource isolation** (GPU for Ollama, CPU for Next.js)
- **Technology independence** (Python for AI, Node.js for web)
- **Easy deployment** (can run on different servers)

### API Endpoints

#### Health & Status

**GET /health**
```bash
curl http://localhost:8000/health
```
Response:
```json
{
  "status": "healthy",
  "ollama_connected": true,
  "ollama_version": "0.1.24",
  "available_models": ["llama3.1:8b", "nomic-embed-text"]
}
```

**GET /models**
```bash
curl http://localhost:8000/models
```
Response:
```json
{
  "models": [
    {
      "name": "llama3.1:8b",
      "size": "4.7GB",
      "family": "llama",
      "parameter_size": "8B",
      "quantization": "Q4_K_M"
    },
    {
      "name": "nomic-embed-text",
      "size": "274MB",
      "family": "bert",
      "dimensions": 768
    }
  ]
}
```

---

#### Content Generation

**POST /generate**

Generate content using multi-agent workflow.

Request:
```json
{
  "mode": "topic",
  "input": {
    "topic": "Fantasy Football Draft Strategy 2025"
  },
  "settings": {
    "word_count": "1500-2000",
    "tone": "Professional & Informative",
    "seo_optimization": "Maximum",
    "focus_keywords": ["fantasy football", "draft strategy", "rankings"],
    "include_images": true,
    "include_toc": true,
    "include_faq": true
  },
  "user_id": "user123"
}
```

Response:
```json
{
  "job_id": "job_abc123xyz",
  "status": "queued",
  "created_at": "2025-01-10T10:30:00Z",
  "estimated_duration": 120
}
```

**GET /jobs/{job_id}**

Get generation job status and progress.

Response:
```json
{
  "job_id": "job_abc123xyz",
  "status": "processing",
  "progress": {
    "current_stage": "writing",
    "total_stages": 3,
    "percentage": 66,
    "message": "Content Writer agent is creating the article..."
  },
  "started_at": "2025-01-10T10:30:05Z",
  "estimated_completion": "2025-01-10T10:32:05Z"
}
```

When complete:
```json
{
  "job_id": "job_abc123xyz",
  "status": "completed",
  "result": {
    "title": "Fantasy Football Draft Strategy 2025: Complete Guide",
    "content": "Full article content in Markdown...",
    "word_count": 1847,
    "seo": {
      "score": 92,
      "meta_description": "Learn the best fantasy football draft strategies...",
      "keywords": {
        "fantasy football": { "density": 2.3, "count": 42 },
        "draft strategy": { "density": 1.8, "count": 33 }
      },
      "suggestions": [
        "Consider adding more internal links",
        "Meta description could be shorter"
      ]
    },
    "readability": {
      "flesch_reading_ease": 68.2,
      "flesch_kincaid_grade": 8.5,
      "average_sentence_length": 18.3,
      "complex_words": 127
    },
    "images": [
      {
        "url": "http://localhost:8000/generated/image1.png",
        "alt": "Fantasy football draft board",
        "caption": "Example draft board showing player rankings"
      }
    ]
  },
  "completed_at": "2025-01-10T10:32:03Z",
  "duration": 118
}
```

---

#### Embeddings

**POST /embeddings**

Generate vector embeddings for text.

Request:
```json
{
  "text": "Fantasy Football Draft Strategy 2025 - Complete guide...",
  "model": "nomic-embed-text"
}
```

Response:
```json
{
  "embedding": [0.123, -0.456, 0.789, ...],  // 768 dimensions
  "model": "nomic-embed-text",
  "dimensions": 768,
  "tokens": 247
}
```

**POST /embeddings/batch**

Generate embeddings for multiple texts (more efficient).

Request:
```json
{
  "texts": [
    "First article text...",
    "Second article text...",
    "Third article text..."
  ],
  "model": "nomic-embed-text"
}
```

Response:
```json
{
  "embeddings": [
    [0.123, -0.456, ...],
    [0.234, -0.567, ...],
    [0.345, -0.678, ...]
  ],
  "count": 3,
  "model": "nomic-embed-text"
}
```

---

#### Image Generation

**POST /api/images/generate**

Generate AI images using HuggingFace Model API (FLUX.1-dev).

Request:
```json
{
  "prompt": "Fantasy football draft board with player names and rankings, realistic, detailed",
  "negative_prompt": "blurry, low quality, distorted",
  "width": 1024,
  "height": 768,
  "steps": 50,
  "cfg_scale": 7.5,
  "seed": 12345
}
```

Response:
```json
{
  "success": true,
  "image_url": "http://44.197.16.15:7860/download/...",
  "job_id": "...",
  "prompt": "Fantasy football draft board...",
  "width": 1024,
  "height": 768,
  "seed": 12345,
  "generation_time": 8.3
}
```

#### Video Generation

**POST /api/videos/generate**

Generate AI videos using HuggingFace Model API (Wan-AI/Wan2.2-TI2V-5B). Supports both Text-to-Video (T2V) and Image-to-Video (I2V).

**Text-to-Video Request:**
```json
{
  "prompt": "A cat walks on the grass, realistic style.",
  "model_id": "Wan-AI/Wan2.2-TI2V-5B",
  "num_inference_steps": 9,
  "seed": 42,
  "num_frames": 14
}
```

**Image-to-Video Request:**
```json
{
  "prompt": "A cat walks on the grass, realistic style.",
  "model_id": "Wan-AI/Wan2.2-TI2V-5B",
  "image": "base64_encoded_image_or_url",
  "num_inference_steps": 9,
  "seed": 42
}
```

Response:
```json
{
  "success": true,
  "video_url": "http://44.197.16.15:7860/download/...",
  "job_id": "...",
  "type": "video",
  "prompt": "A cat walks on the grass, realistic style.",
  "generation_time": 45.23
}
```

---

### FastAPI Service Architecture

```python
# main.py - FastAPI application entry point
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="VIPContentAI - AI Service",
    description="AI operations microservice using CrewAI and Ollama",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    ollama_status = await check_ollama_connection()
    return {
        "status": "healthy",
        "ollama_connected": ollama_status
    }

# Content generation endpoint
@app.post("/generate")
async def generate_content(
    request: GenerationRequest,
    background_tasks: BackgroundTasks
):
    # Create job
    job_id = create_job(request)

    # Run generation in background
    background_tasks.add_task(run_generation, job_id, request)

    return {"job_id": job_id, "status": "queued"}

# Job status endpoint
@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = await get_job_from_db(job_id)
    return job
```

---

## 💾 Database Schema

### Database Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ sources : creates
    users ||--o{ generated_content : owns
    users ||--o{ media : uploads
    users ||--o{ notifications : receives
    users ||--o{ notification_settings : has
    users ||--o{ ai_configurations : configures
    users ||--o{ model_groups : creates

    sources ||--o{ articles : contains
    sources {
        ObjectId _id PK
        ObjectId userId FK
        string type "rss|website|topic|trend"
        string name
        string url
        string syncFrequency
        datetime lastSync
        datetime nextSync
        string status
        int articleCount
    }

    articles {
        ObjectId _id PK
        ObjectId sourceId FK
        ObjectId userId FK
        string title
        string content
        string excerpt
        array embedding "768-dim vector"
        array keywords
        array topics
        string sentiment
        int readingTime
        datetime publishedAt
    }

    generated_content ||--o{ content_versions : has
    generated_content {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId generationJobId FK
        string title
        string content
        string status "pending|approved|rejected"
        object seoAnalysis
        int wordCount
        float readabilityScore
        datetime generatedAt
    }

    generation_jobs ||--o{ generated_content : produces
    generation_jobs {
        ObjectId _id PK
        ObjectId userId FK
        string status "queued|processing|completed|failed"
        string mode "topic|keywords|trends|spin"
        object settings
        int progress
        datetime startedAt
        datetime completedAt
    }

    media {
        ObjectId _id PK
        ObjectId userId FK
        string type "image|video"
        string url
        string prompt
        object metadata
        array tags
        datetime generatedAt
    }

    export_jobs {
        ObjectId _id PK
        ObjectId userId FK
        array contentIds FK
        string format "markdown|docx|pdf|html"
        string status "queued|processing|completed|failed"
        string downloadUrl
        datetime createdAt
    }

    notifications {
        ObjectId _id PK
        ObjectId userId FK
        string type
        string title
        string message
        boolean read
        datetime createdAt
    }

    notification_settings {
        ObjectId _id PK
        ObjectId userId FK
        boolean contentGenerated
        boolean contentApproved
        boolean exportCompleted
        boolean weeklyDigest
    }

    ai_configurations {
        ObjectId _id PK
        ObjectId userId FK
        string provider "ollama|openai|anthropic"
        object credentials
        boolean isActive
        datetime lastTested
    }

    model_groups {
        ObjectId _id PK
        ObjectId userId FK
        string name
        array models
        string routingStrategy "fallback|round_robin|weighted"
        object routingConfig
    }

    content_versions {
        ObjectId _id PK
        ObjectId contentId FK
        int versionNumber
        string content
        object changes
        datetime createdAt
    }

    users {
        ObjectId _id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        string role "user|editor|admin|superadmin"
        boolean emailVerified
        datetime lastLogin
        object settings
    }
```

### Database Connection & Setup

**MongoDB Configuration (AWS Server):**
- **Server**: `3.105.105.52:27017`
- **Database**: `vipcontentai`
- **User**: `admin`
- **Connection String**: `mongodb://admin:VipplayPass123@3.105.105.52:27017`

**Weaviate Vector Database:**
- **URL**: `http://3.105.105.52:8080`
- **Purpose**: Vector embeddings and similarity search for articles

**Collections Status:**
- MongoDB server is configured and running
- Database `vipcontentai` needs to be initialized
- 12 collections need to be created via migration
- Vector search handled by Weaviate

**Setup Instructions:**
```bash
# Install dependencies (if not already done)
pnpm install

# Run database migration (creates all collections + indexes)
pnpm db:migrate

# Seed with sample data (optional)
pnpm db:seed

# Or do both at once
pnpm db:reset
```

See [scripts/db/README.md](scripts/db/README.md) for comprehensive database documentation including:
- Complete connection details
- All 12 collection schemas
- Index configurations
- Vector search setup
- Query examples
- Troubleshooting guide

### MongoDB Collections

#### 1. users
Stores user accounts, authentication, and roles.

```javascript
{
  _id: ObjectId("..."),
  email: "john.doe@example.com",
  passwordHash: "$2a$12$...",  // bcrypt hash
  firstName: "John",
  lastName: "Doe",
  role: "user",  // user, editor, admin, superadmin
  emailVerified: true,
  emailVerificationToken: null,
  emailVerificationExpires: null,
  resetPasswordToken: null,
  resetPasswordExpires: null,
  lastLogin: ISODate("2025-01-10T10:30:00Z"),
  settings: {
    theme: "dark",
    notifications: {
      contentGenerated: true,
      contentApproved: true,
      exportCompleted: true,
      weeklyDigest: false
    },
    defaultGenerationSettings: {
      word_count: "1500-2000",
      tone: "Professional & Informative",
      seo_optimization: "Maximum"
    }
  },
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-10T10:30:00Z")
}
```

**Indexes:**
- `email: 1` (unique)
- `role: 1`
- `createdAt: -1`

---

#### 2. sources
Knowledge base sources (RSS, websites, topics, trends).

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  type: "rss",  // rss, website, topic, trend
  name: "ESPN Fantasy Football",

  // RSS-specific
  url: "https://www.espn.com/espn/rss/fantasy/news",
  syncFrequency: "daily",  // hourly, daily, weekly
  lastSync: ISODate("2025-01-10T06:00:00Z"),
  nextSync: ISODate("2025-01-11T06:00:00Z"),

  // Website-specific
  crawlDepth: 2,
  crawlFrequency: "weekly",

  // Topic-specific
  keywords: ["fantasy football", "draft", "rankings"],

  // Trend-specific
  region: "US",
  category: "Sports",

  // Common
  status: "active",  // active, paused, error
  errorCount: 0,
  lastError: null,
  articleCount: 147,

  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-10T06:00:00Z")
}
```

**Indexes:**
- `userId: 1, type: 1`
- `status: 1`
- `nextSync: 1`

---

#### 3. articles
Captured articles with vector embeddings.

```javascript
{
  _id: ObjectId("..."),
  sourceId: ObjectId("..."),
  userId: ObjectId("..."),

  title: "Top 10 Fantasy Football Draft Picks 2025",
  content: "Full article text in Markdown...",
  excerpt: "Short excerpt for previews...",

  url: "https://example.com/article",
  author: "John Smith",
  publishedAt: ISODate("2025-01-09T12:00:00Z"),

  // Vector embedding (768 dimensions)
  embedding: [0.123, -0.456, 0.789, ...],

  // Metadata
  keywords: ["fantasy football", "draft", "rankings", "2025"],
  topics: ["Fantasy Sports", "NFL"],
  sentiment: "positive",
  readingTime: 8,  // minutes

  // Media
  images: [
    {
      url: "https://example.com/image.jpg",
      alt: "Fantasy football draft board",
      width: 1200,
      height: 800
    }
  ],

  // Stats
  viewCount: 0,
  usedInGeneration: false,

  createdAt: ISODate("2025-01-09T12:05:00Z"),
  updatedAt: ISODate("2025-01-09T12:05:00Z")
}
```

**Indexes:**
- `userId: 1, createdAt: -1`
- `sourceId: 1`
- `keywords: 1`
- `title: 'text', content: 'text', keywords: 'text'` (full-text search)
- `embedding: 'knnVector'` (vector search)

---

#### 4. generated_content
AI-generated content with SEO and readability data.

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  jobId: "job_abc123xyz",

  // Content
  title: "Fantasy Football Draft Strategy 2025: Complete Guide",
  content: "Full article content in Markdown...",
  excerpt: "Learn the best fantasy football draft strategies for 2025...",
  wordCount: 1847,

  // Generation details
  mode: "topic",  // topic, keywords, trends, spin
  input: {
    topic: "Fantasy Football Draft Strategy 2025"
  },
  settings: {
    word_count: "1500-2000",
    tone: "Professional & Informative",
    seo_optimization: "Maximum",
    focus_keywords: ["fantasy football", "draft strategy"]
  },

  // SEO data
  seo: {
    score: 92,
    metaDescription: "Learn the best fantasy football draft strategies...",
    keywords: {
      "fantasy football": { density: 2.3, count: 42 },
      "draft strategy": { density: 1.8, count: 33 }
    },
    suggestions: ["Add more internal links", "Shorten meta description"]
  },

  // Readability
  readability: {
    fleschReadingEase: 68.2,
    fleschKincaidGrade: 8.5,
    averageSentenceLength: 18.3,
    complexWords: 127
  },

  // Media
  featuredImage: {
    url: "/media/featured_xyz.png",
    alt: "Fantasy football draft board"
  },
  images: [
    { url: "/media/img1.png", alt: "Player rankings" },
    { url: "/media/img2.png", alt: "Draft strategy chart" }
  ],

  // Workflow
  status: "pending",  // pending, approved, rejected, published
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  publishedAt: null,

  // Versioning
  version: 1,
  versions: [
    {
      version: 1,
      content: "Original content...",
      editedBy: ObjectId("..."),
      editedAt: ISODate("2025-01-10T11:00:00Z"),
      changes: "Initial generation"
    }
  ],

  // Analytics
  views: 0,
  exports: 0,

  createdAt: ISODate("2025-01-10T10:32:03Z"),
  updatedAt: ISODate("2025-01-10T10:32:03Z")
}
```

**Indexes:**
- `userId: 1, status: 1, createdAt: -1`
- `jobId: 1` (unique)
- `status: 1`
- `title: 'text', content: 'text', keywords: 'text'`

---

#### 5. media
Media library (images and videos).

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),

  type: "image",  // image, video
  filename: "fantasy_draft_board.png",
  originalFilename: "draft-board.png",

  url: "/media/fantasy_draft_board.png",
  thumbnailUrl: "/media/thumbnails/fantasy_draft_board_thumb.png",

  // Metadata
  title: "Fantasy Football Draft Board",
  description: "Example draft board showing player rankings",
  alt: "Fantasy football draft board with top 100 players",

  // File info
  mimeType: "image/png",
  size: 1024000,  // bytes
  width: 1920,
  height: 1080,

  // AI generation (if applicable)
  generatedByAI: true,
  generationPrompt: "Fantasy football draft board, realistic, detailed",
  generationModel: "black-forest-labs/FLUX.1-dev",

  // Organization
  tags: ["fantasy", "football", "draft", "rankings"],
  category: "Sports",

  // Usage
  usedIn: [ObjectId("..."), ObjectId("...")],  // Content IDs
  usageCount: 5,

  createdAt: ISODate("2025-01-10T10:00:00Z"),
  updatedAt: ISODate("2025-01-10T10:00:00Z")
}
```

**Indexes:**
- `userId: 1, createdAt: -1`
- `type: 1`
- `tags: 1`

---

#### 6. generation_jobs
Background job tracking for content generation.

```javascript
{
  _id: ObjectId("..."),
  jobId: "job_abc123xyz",
  userId: ObjectId("..."),

  status: "completed",  // queued, processing, completed, failed

  // Progress
  progress: {
    currentStage: "completed",
    totalStages: 3,
    percentage: 100,
    message: "Content generation completed successfully"
  },

  // Input
  request: {
    mode: "topic",
    input: { topic: "Fantasy Football Draft Strategy 2025" },
    settings: { word_count: "1500-2000", tone: "Professional" }
  },

  // Output
  result: {
    contentId: ObjectId("..."),
    title: "Fantasy Football Draft Strategy 2025: Complete Guide",
    wordCount: 1847,
    seoScore: 92
  },

  // Timing
  createdAt: ISODate("2025-01-10T10:30:00Z"),
  startedAt: ISODate("2025-01-10T10:30:05Z"),
  completedAt: ISODate("2025-01-10T10:32:03Z"),
  duration: 118,  // seconds

  // Error handling
  error: null,
  retryCount: 0,
  maxRetries: 3
}
```

**Indexes:**
- `jobId: 1` (unique)
- `userId: 1, createdAt: -1`
- `status: 1`

---

#### 7. model_groups
AI model groups with routing strategies.

```javascript
{
  _id: ObjectId("..."),
  name: "Fast Generation",
  description: "Quick content generation for drafts",

  models: ["llama3.1:8b", "mistral:7b"],

  routingStrategy: "fallback",  // fallback, round-robin, weighted, majority-judge

  // Fallback: primary -> secondary -> tertiary
  fallbackOrder: ["llama3.1:8b", "mistral:7b"],

  // Weighted: percentage distribution
  weights: {
    "llama3.1:8b": 70,
    "mistral:7b": 30
  },

  isActive: true,

  // Usage stats
  stats: {
    totalRequests: 1247,
    successRate: 98.5,
    averageResponseTime: 4.2,  // seconds
    modelUsage: {
      "llama3.1:8b": 872,
      "mistral:7b": 375
    }
  },

  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-10T10:00:00Z"),
  createdBy: ObjectId("...")
}
```

**Indexes:**
- `name: 1` (unique)
- `isActive: 1`

---

#### 8. ai_configurations
AI provider configurations and settings.

```javascript
{
  _id: ObjectId("..."),
  provider: "ollama",  // ollama, openai, anthropic, google, openrouter, custom

  name: "Production Ollama",

  config: {
    baseUrl: "http://localhost:11434",
    defaultModel: "llama3.1:8b",
    embeddingModel: "nomic-embed-text",

    // Model parameters
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 4096,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0
  },

  isActive: true,
  isDefault: true,

  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-10T10:00:00Z")
}
```

**Indexes:**
- `provider: 1`
- `isActive: 1, isDefault: 1`

---

## 🧪 Testing

### Test Specifications

The project includes **62 comprehensive Gherkin test specifications** covering all user stories across 8 epics.

#### Test Organization

```
.stories/
├── E1-Authentication-and-User-Management/
│   └── .tests/
│       ├── VIP-10001-test.md    # User Registration
│       ├── VIP-10002-test.md    # User Login
│       ├── VIP-10003-test.md    # Password Reset
│       ├── VIP-10004-test.md    # JWT Token Management
│       ├── VIP-10005-test.md    # User Profile Management
│       ├── VIP-10006-test.md    # RBAC
│       ├── VIP-10007-test.md    # Email Verification
│       └── VIP-10008-test.md    # User Logout
│
├── E2-Knowledge-Base-System/
│   └── .tests/
│       ├── VIP-10101-test.md to VIP-10110-test.md (10 files)
│
├── E3-Content-Generation-(AI)/
│   └── .tests/
│       ├── VIP-10201-test.md to VIP-10212-test.md (12 files)
│
├── E4-Content-Management-and-Review/
│   └── .tests/
│       ├── VIP-10301-test.md to VIP-10308-test.md (8 files)
│
├── E5-Media-Library/
│   └── .tests/
│       ├── VIP-10401-test.md to VIP-10406-test.md (6 files)
│
├── E6-AI-Configuration-(Superadmin)/
│   └── .tests/
│       ├── VIP-10501-test.md to VIP-10507-test.md (7 files)
│
├── E7-Export-and-Notifications/
│   └── .tests/
│       ├── VIP-10601-test.md to VIP-10605-test.md (5 files)
│
└── E8-Deployment-and-Production/
    └── .tests/
        ├── VIP-10701-test.md to VIP-10706-test.md (6 files)
```

#### Test Specification Format

Each test file contains:

1. **Feature Description**: User story and acceptance criteria
2. **Test Scenarios**: Gherkin format (Given-When-Then)
3. **API Tests**: HTTP requests and expected responses
4. **Security Tests**: XSS, SQL injection, authorization
5. **Performance Tests**: Response time benchmarks

**Example: VIP-10001-test.md (User Registration)**

```gherkin
# VIP-10001: User Registration - Test Specification

## Feature: User Registration
As a new user, I want to register for an account so that I can access the VIPContentAI platform

### Test Scenarios

#### Scenario: Successful user registration with valid details
Given I am on the registration page
When I enter "john.doe@example.com" in the email field
And I enter "John" in the first name field
And I enter "Doe" in the last name field
And I enter "SecurePass123!" in the password field
And I enter "SecurePass123!" in the confirm password field
And I click the "Register" button
Then I should see a success message "Registration successful"
And I should be redirected to the login page
And I should receive a verification email at "john.doe@example.com"

#### Scenario: Registration fails with existing email
Given I am on the registration page
And a user with email "existing@example.com" already exists
When I enter "existing@example.com" in the email field
And I enter "Jane" in the first name field
And I enter "Smith" in the last name field
And I enter "SecurePass123!" in the password field
And I enter "SecurePass123!" in the confirm password field
And I click the "Register" button
Then I should see an error message "Email already registered"
And I should remain on the registration page

#### Scenario: Registration fails with weak password
Given I am on the registration page
When I enter "test@example.com" in the email field
And I enter "Test" in the first name field
And I enter "User" in the last name field
And I enter "password" in the password field
And I enter "password" in the confirm password field
And I click the "Register" button
Then I should see an error message "Password must contain uppercase, lowercase, number, and special character"
And the password field should be highlighted

### API Tests

#### Test: Successful registration
POST /api/auth/register
{
  "email": "newuser@example.com",
  "firstName": "New",
  "lastName": "User",
  "password": "SecurePass123!"
}

Expected Response: 201 Created
{
  "success": true,
  "message": "Registration successful",
  "userId": "..."
}

#### Test: Registration with existing email
POST /api/auth/register
{
  "email": "existing@example.com",
  "firstName": "Test",
  "lastName": "User",
  "password": "SecurePass123!"
}

Expected Response: 409 Conflict
{
  "success": false,
  "error": "Email already registered"
}

### Security Tests

#### Test: SQL Injection Prevention
POST /api/auth/register
{
  "email": "test@example.com' OR '1'='1",
  "firstName": "Test",
  "lastName": "User",
  "password": "SecurePass123!"
}

Expected: Input sanitized, registration fails with invalid email format

#### Test: XSS Prevention
POST /api/auth/register
{
  "email": "test@example.com",
  "firstName": "<script>alert('XSS')</script>",
  "lastName": "User",
  "password": "SecurePass123!"
}

Expected: Script tags removed or escaped, registration succeeds with sanitized name
```

### Running Tests with Playwright

The test specifications are designed to be automated using Playwright. You can use **Cursor MCP** to generate Playwright tests from these Gherkin specs.

**Planned Workflow:**

```bash
# 1. Generate Playwright tests from Gherkin specs
cursor mcp playwright generate .stories/E1-Authentication-and-User-Management/.tests/

# 2. Review generated test files
# → tests/e1-authentication/vip-10001-user-registration.spec.ts

# 3. Run tests
npx playwright test

# 4. View test report
npx playwright show-report
```

**Example Generated Test (from Gherkin):**

```typescript
// tests/e1-authentication/vip-10001-user-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('VIP-10001: User Registration', () => {
  test('Successful user registration with valid details', async ({ page }) => {
    // Given I am on the registration page
    await page.goto('http://localhost:3000/signup');

    // When I enter details
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');

    // And I click the Register button
    await page.click('button:has-text("Register")');

    // Then I should see success message
    await expect(page.locator('text=Registration successful')).toBeVisible();

    // And I should be redirected to login page
    await expect(page).toHaveURL('http://localhost:3000/login');
  });

  test('Registration fails with existing email', async ({ page }) => {
    // Given existing user
    // (Assume user exists from previous test or seed data)

    await page.goto('http://localhost:3000/signup');
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    await page.click('button:has-text("Register")');

    // Then error message should appear
    await expect(page.locator('text=Email already registered')).toBeVisible();

    // And should stay on registration page
    await expect(page).toHaveURL('http://localhost:3000/signup');
  });
});
```

---

## 📅 Project Management

### User Stories & Epics

The project is organized into **8 epics** with **62 user stories** totaling **269 story points**.

#### Epic Breakdown

| Epic ID | Epic Name | Stories | Points | Duration | Status |
|---------|-----------|---------|--------|----------|--------|
| **E1** | Authentication & User Management | 8 | 38 | 2 weeks | ✅ Complete |
| **E2** | Knowledge Base System | 10 | 32 | 2 weeks | ✅ Complete |
| **E3** | Content Generation (AI) | 12 | 67 | 4 weeks | ✅ Complete |
| **E4** | Content Management & Review | 8 | 30 | 2 weeks | ✅ Complete |
| **E5** | Media Library | 6 | 25 | 2 weeks | ✅ Complete |
| **E6** | AI Configuration (Superadmin) | 7 | 27 | 2 weeks | ✅ Complete |
| **E7** | Export & Notifications | 5 | 21 | 2 weeks | ✅ Complete |
| **E8** | Deployment & Production | 6 | 29 | 2 weeks | ✅ Complete |
| **TOTAL** | - | **62** | **269** | **18 weeks** | **✅ Complete** |

### Story Naming Convention

Stories are named using the format: `VIP-XXXXX`

- **VIP-10001 to VIP-10008**: Epic E1 (Authentication)
- **VIP-10101 to VIP-10110**: Epic E2 (Knowledge Base)
- **VIP-10201 to VIP-10212**: Epic E3 (Content Generation)
- **VIP-10301 to VIP-10308**: Epic E4 (Content Management)
- **VIP-10401 to VIP-10406**: Epic E5 (Media Library)
- **VIP-10501 to VIP-10507**: Epic E6 (AI Configuration)
- **VIP-10601 to VIP-10605**: Epic E7 (Export & Notifications)
- **VIP-10701 to VIP-10706**: Epic E8 (Deployment & Production)

### Story File Format

Each story file (e.g., `VIP-10001.md`) contains:

1. **Story ID & Title**
2. **Epic Link**
3. **Priority** (High, Medium, Low)
4. **Story Points** (Fibonacci: 1, 2, 3, 5, 8, 13)
5. **User Story** (As a... I want... So that...)
6. **Acceptance Criteria** (Given-When-Then or checklist)
7. **Technical Details** (Implementation notes, API endpoints, database changes)
8. **Definition of Done** (Checklist of completion criteria)

**Example: VIP-10001.md**

```markdown
# VIP-10001: User Registration

**Epic**: E1 - Authentication and User Management
**Priority**: High
**Story Points**: 5

## User Story
As a new user, I want to register for an account with my email and password so that I can access the VIPContentAI platform and start generating content.

## Acceptance Criteria
1. User can access registration page at /signup
2. Form includes: email, first name, last name, password, confirm password
3. Email validation: must be valid format
4. Password validation: min 8 chars, uppercase, lowercase, number, special char
5. Password confirmation must match
6. Successful registration creates user in database
7. Password is hashed with bcrypt (12 rounds)
8. Verification email sent to user
9. User redirected to login page after registration
10. Clear error messages for validation failures

## Technical Details
- **Frontend**: `app/(auth)/signup/page.tsx`
- **API Endpoint**: `POST /api/auth/register`
- **Database**: Create user in `users` collection
- **Email**: Send verification email with token
- **Validation**: Use zod schema validation

## Definition of Done
- [ ] Registration page implemented with form
- [ ] API endpoint created and tested
- [ ] Email validation working
- [ ] Password strength validation working
- [ ] Password hashing with bcrypt
- [ ] User created in MongoDB
- [ ] Verification email sent
- [ ] Error handling implemented
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Code reviewed and merged
```

### Using Stories in Development

**Finding a Story:**

```bash
# By story ID
cat .stories/E1-Authentication-and-User-Management/VIP-10001.md

# Search by keyword
grep -r "User Registration" .stories/

# List all stories in an epic
ls .stories/E1-Authentication-and-User-Management/*.md
```

**Creating a Feature Branch:**

```bash
# Format: story-id/VIP-XXXXX-short-description
git checkout -b story-id/VIP-10001-user-registration
```

**Commit Message Format:**

```bash
git commit -m "[VIP-10001] Implement user registration form"
git commit -m "[VIP-10001] Add API endpoint for user registration"
git commit -m "[VIP-10001] Add email verification flow"
```

### Jira Import

A CSV file is provided for bulk import to Jira:

**File**: `.stories/jira-import.csv`

**Format:**
```csv
Issue Type,Summary,Description,Priority,Story Points,Epic Link,Acceptance Criteria
Story,User Registration,As a new user I want to register...,High,5,E1,"1. User can access registration page..."
```

**To Import to Jira:**
1. Go to Jira → Issues → Import issues from CSV
2. Upload `.stories/jira-import.csv`
3. Map fields: Issue Type → Type, Summary → Summary, etc.
4. Import all 62 stories
5. Stories will be organized by epic

---

## 🚢 Deployment

### Deployment Architecture Diagram

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Container Orchestration - Docker Compose"
            subgraph "Application Containers"
                Next[Next.js Container<br/>Port 3000<br/>Node 20 Alpine]
                FastAPI[FastAPI Container<br/>Port 8000<br/>Python 3.10]
            end

            subgraph "AI Infrastructure"
                Ollama[Ollama Container<br/>Port 11434<br/>GPU Runtime<br/>NVIDIA L4/L40S]
                Models[Persistent Models<br/>/var/lib/ollama<br/>llama3.1:8b<br/>mistral:7b<br/>nomic-embed]
            end

            subgraph "Data Layer"
                Mongo[MongoDB Container<br/>Port 27017<br/>Version 7.0<br/>Persistent Volume]
                Redis[Redis Container<br/>Port 6379<br/>Alpine<br/>Session Cache]
            end

            subgraph "Reverse Proxy"
                Nginx[Nginx Container<br/>Ports 80/443<br/>SSL/TLS<br/>Let's Encrypt]
            end
        end

        subgraph "AWS Cloud Services (Optional)"
            EC2[EC2 GPU Instance<br/>g6.xlarge or g6e.xlarge<br/>Ubuntu 24.04 DL AMI<br/>NVIDIA Drivers]
            EBS[EBS gp3 Volume<br/>100GB+ Storage<br/>3000 IOPS]
            SG[Security Group<br/>443: HTTPS<br/>22: SSH<br/>Egress: All]
            EIP[Elastic IP<br/>Static Address]
            Route53[Route53 DNS<br/>api.vipcontentai.com]
            CW[CloudWatch<br/>Logs & Metrics<br/>Alarms]
        end
    end

    subgraph "External Services"
        Atlas[(MongoDB Atlas<br/>Cloud Database<br/>Vector Search)]
        Firecrawl[Firecrawl API<br/>Web Scraping]
        GoogleAPI[Google Trends API]
    end

    Internet[Internet Users] -->|HTTPS| Nginx
    Nginx -->|Proxy Pass| Next
    Nginx -->|API Proxy| FastAPI

    Next --> Mongo
    Next --> Redis
    Next --> FastAPI
    FastAPI --> Ollama
    Ollama --> Models
    FastAPI --> Mongo

    Next -.->|Alternative| Atlas
    FastAPI -.->|Alternative| Atlas
    Next --> Firecrawl
    Next --> GoogleAPI

    EC2 -.->|Hosts| Ollama
    EC2 --> EBS
    EC2 --> SG
    EC2 --> EIP
    EIP --> Route53
    EC2 --> CW

    style Next fill:#0070f3,color:#fff
    style FastAPI fill:#009688,color:#fff
    style Ollama fill:#000,color:#fff
    style Nginx fill:#269539,color:#fff
    style Mongo fill:#47A248,color:#fff
    style Redis fill:#DC382D,color:#fff
    style EC2 fill:#FF9900,color:#000
    style Atlas fill:#47A248,color:#fff
```

### Content Generation Workflow Diagram

```mermaid
flowchart TD
    Start([User Initiates Content Generation])
    Start --> SelectMode{Select Generation Mode}

    SelectMode -->|Topic-Based| TopicMode[Topic Mode<br/>Enter topic + keywords]
    SelectMode -->|Keywords| KeywordMode[Keyword Mode<br/>Enter keywords list]
    SelectMode -->|Trends| TrendMode[Trend Mode<br/>Google Trends integration]
    SelectMode -->|Spin| SpinMode[Spin Mode<br/>Upload existing content]

    TopicMode --> Configure
    KeywordMode --> Configure
    TrendMode --> Configure
    SpinMode --> Configure

    Configure[Configure Settings<br/>- Word count<br/>- Tone<br/>- SEO level<br/>- Images]

    Configure --> BulkChoice{Bulk Generation?}

    BulkChoice -->|No| SingleGen[Generate Single Article]
    BulkChoice -->|Yes| BulkGen[Generate 2-50 Articles]

    SingleGen --> CreateJob
    BulkGen --> CreateJob

    CreateJob[Create Generation Job<br/>Status: Queued]
    CreateJob --> CallFastAPI[Send to FastAPI<br/>POST /generate]

    CallFastAPI --> VectorSearch[Query Articles<br/>MongoDB Vector Search<br/>768-dim embeddings]

    VectorSearch --> ResearchAgent[Research Agent<br/>Analyze similar articles<br/>Extract insights<br/>Identify trends]

    ResearchAgent --> WriterAgent[Writer Agent<br/>Generate content<br/>Follow tone guidelines<br/>Match word count]

    WriterAgent --> SEOAgent[SEO Agent<br/>Optimize keywords<br/>Meta description<br/>Readability score]

    SEOAgent --> SaveContent[Save to DB<br/>generated_content<br/>Status: Pending]

    SaveContent --> UpdateJob[Update Job<br/>Status: Completed<br/>Progress: 100%]

    UpdateJob --> Notification[Send Notification<br/>Content ready for review]

    Notification --> Review[User Reviews Content<br/>in Content Manager]

    Review --> Decision{User Decision}

    Decision -->|Approve| Approve[Status: Approved<br/>Save version]
    Decision -->|Edit| Edit[Edit Content<br/>Create version]
    Decision -->|Reject| Reject[Status: Rejected<br/>Archive]

    Edit --> Decision

    Approve --> Export{Export?}
    Export -->|Yes| ExportChoice{Select Format}
    Export -->|No| Done

    ExportChoice --> Markdown[Markdown .md]
    ExportChoice --> DOCX[Word Document .docx]
    ExportChoice --> PDF[PDF Document .pdf]
    ExportChoice --> HTML[HTML File .html]

    Markdown --> Done([Content Generation Complete])
    DOCX --> Done
    PDF --> Done
    HTML --> Done
    Reject --> Done

    style Start fill:#4CAF50,color:#fff
    style CreateJob fill:#2196F3,color:#fff
    style ResearchAgent fill:#FF9800,color:#fff
    style WriterAgent fill:#FF9800,color:#fff
    style SEOAgent fill:#FF9800,color:#fff
    style Approve fill:#4CAF50,color:#fff
    style Reject fill:#f44336,color:#fff
    style Done fill:#4CAF50,color:#fff
```

### Deployment Options

VIPContentAI can be deployed in three ways:

1. **Local Deployment**: Run on a local machine for development
2. **Docker Deployment**: Containerized deployment with docker-compose
3. **Cloud Deployment**: Deploy to AWS, GCP, or Azure

### Docker Deployment (Recommended)

The easiest way to deploy VIPContentAI is using Docker Compose, which orchestrates all services.

#### Services Included

- **MongoDB**: Database
- **Redis**: Caching and rate limiting
- **Ollama**: LLM server with GPU support
- **FastAPI**: AI microservice
- **Next.js**: Frontend and backend

#### Deployment Steps

```bash
# 1. Clone repository
git clone https://github.com/Trigent-Software-Pvt-Ltd/vip_app.git
cd vip_app

# 2. Configure environment
cp .env.example .env
# Edit .env with production values

# 3. Build and start services
cd scripts/deploy
docker-compose up -d

# 4. Check service status
docker-compose ps

# 5. View logs
docker-compose logs -f

# 6. Access application
# Next.js: http://localhost:3000
# FastAPI: http://localhost:8000
# Ollama: http://localhost:11434
```

#### Docker Compose Configuration

**File**: `scripts/deploy/docker-compose.yml`

```yaml
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: vipcontentai-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: vipcontentai
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/vipcontentai --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: vipcontentai-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Ollama LLM Server (with GPU support)
  ollama:
    image: ollama/ollama:latest
    container_name: vipcontentai-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/version"]
      interval: 30s
      timeout: 10s
      retries: 3

  # FastAPI AI Service
  api-service:
    build:
      context: ../../api-service
      dockerfile: Dockerfile
    container_name: vipcontentai-api
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      OLLAMA_BASE_URL: http://ollama:11434
      DEFAULT_MODEL: llama3.1:8b
      EMBEDDING_MODEL: nomic-embed-text
    depends_on:
      ollama:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Next.js Application
  app:
    build:
      context: ../..
      dockerfile: Dockerfile
    container_name: vipcontentai-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/vipcontentai?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      FASTAPI_AI_SERVICE_URL: http://api-service:8000
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
      api-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mongodb_data:
  redis_data:
  ollama_models:

networks:
  default:
    name: vipcontentai-network
```

### Cloud Deployment

#### AWS Deployment

**Recommended Architecture:**

- **EC2 Instances**:
  - t3.large for Next.js (2 vCPU, 8GB RAM)
  - g4dn.xlarge for Ollama (4 vCPU, 16GB RAM, NVIDIA T4 GPU)
- **RDS MongoDB**: Or use MongoDB Atlas
- **ElastiCache Redis**: For caching and rate limiting
- **S3**: For media storage
- **CloudFront**: CDN for static assets
- **Route 53**: DNS management
- **ALB**: Application Load Balancer

**Deployment Steps:**

1. **Create EC2 Instances**
   ```bash
   # Launch instances with Docker pre-installed
   aws ec2 run-instances --image-id ami-xxxxx --instance-type g4dn.xlarge
   ```

2. **Install Nvidia Drivers** (for Ollama instance)
   ```bash
   sudo apt-get update
   sudo apt-get install nvidia-driver-525
   ```

3. **Deploy with Docker Compose**
   ```bash
   scp -r . ec2-user@instance-ip:~/vipcontentai
   ssh ec2-user@instance-ip
   cd vipcontentai
   docker-compose up -d
   ```

4. **Configure Load Balancer**
   - Target: EC2 instance port 3000
   - Health check: /api/health
   - SSL certificate: AWS Certificate Manager

#### GCP Deployment

**Recommended Architecture:**

- **Compute Engine**: n1-standard-2 for Next.js
- **Compute Engine**: n1-standard-4 + NVIDIA T4 for Ollama
- **Cloud MongoDB**: Or use MongoDB Atlas
- **Cloud Memorystore**: Redis
- **Cloud Storage**: Media files
- **Cloud CDN**: Static assets
- **Cloud Load Balancing**: HTTPS load balancer

#### Azure Deployment

**Recommended Architecture:**

- **Azure VMs**: Standard_D2s_v3 for Next.js
- **Azure VMs**: Standard_NC6s_v3 (Tesla V100) for Ollama
- **Azure Cosmos DB**: MongoDB API
- **Azure Cache for Redis**: Caching
- **Azure Blob Storage**: Media files
- **Azure CDN**: Static assets
- **Azure Application Gateway**: Load balancing

### Post-Deployment

#### 1. Database Initialization

```bash
# SSH into server
ssh user@server-ip

# Run migrations
cd vipcontentai
docker-compose exec app pnpm run db:migrate

# Seed database
docker-compose exec app pnpm run db:seed
```

#### 2. Pull Ollama Models

```bash
# Enter Ollama container
docker-compose exec ollama bash

# Pull models
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# Verify
ollama list
```

#### 3. Configure SSL

```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 4. Set Up Monitoring

- **Application Logs**: `docker-compose logs -f app`
- **Ollama Logs**: `docker-compose logs -f ollama`
- **FastAPI Logs**: `docker-compose logs -f api-service`
- **MongoDB Logs**: `docker-compose logs -f mongodb`

#### 5. Backup Strategy

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out=/backup

# Backup Ollama models
docker-compose exec ollama tar -czf /backup/ollama-models.tar.gz /root/.ollama

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

---

## 🔒 Security

VIPContentAI implements comprehensive security measures following OWASP Top 10 guidelines.

### Security Features

#### 1. Authentication Security

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: Signed with HS256, configurable expiration
- **Token Refresh**: Automatic token renewal before expiration
- **Session Management**: Secure session storage, logout invalidates tokens
- **Email Verification**: Required before account activation

#### 2. Input Validation & Sanitization

```typescript
// lib/middleware/security.ts
export function sanitizeInput(input: string): string {
  // Remove HTML tags
  input = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  input = input.replace(/<[^>]+>/g, '');

  // Escape special characters
  input = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return input;
}

// SQL injection detection
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
    /(UNION.*SELECT)/i,
    /(--|\*\/|\/\*)/,
    /'.*OR.*'/i
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}
```

#### 3. Rate Limiting

```typescript
// Rate limiting configuration
const rateLimits = {
  api: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100
  },
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5  // Stricter for auth endpoints
  },
  generation: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 10  // Limited for expensive operations
  }
};

// Implementation
export function rateLimit(options: RateLimitOptions) {
  const requests = new Map<string, number[]>();

  return (req: NextRequest) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();

    // Get request timestamps for this IP
    let timestamps = requests.get(ip) || [];

    // Remove old timestamps outside window
    timestamps = timestamps.filter(t => now - t < options.windowMs);

    // Check if limit exceeded
    if (timestamps.length >= options.maxRequests) {
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Add current timestamp
    timestamps.push(now);
    requests.set(ip, timestamps);

    return null;  // Allow request
  };
}
```

#### 4. Security Headers

```typescript
// lib/middleware/security.ts
export function securityHeaders() {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:8000",
      "frame-ancestors 'none'"
    ].join('; '),

    // HSTS (force HTTPS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}
```

#### 5. CORS Configuration

```typescript
// Next.js middleware
export function corsHeaders(origin: string) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://vipcontentai.com',
    'https://www.vipcontentai.com'
  ];

  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    };
  }

  return {};
}
```

#### 6. API Key Encryption

```typescript
// Encrypt sensitive data before storing in database
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY!;  // 32-byte key

export function encryptAPIKey(apiKey: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptAPIKey(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey, 'hex'),
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

#### 7. Security Event Logging

```typescript
// lib/utils/logger.ts
export class Logger {
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SECURITY',
      event,
      severity,
      details,
      environment: process.env.NODE_ENV
    };

    // Log to file
    this.log('WARN', JSON.stringify(logEntry));

    // Alert for critical events
    if (severity === 'critical') {
      this.sendAlert(logEntry);
    }
  }
}

// Usage
logger.logSecurityEvent('Failed login attempt', 'medium', {
  email: 'attacker@example.com',
  ip: '192.168.1.100',
  attemptCount: 5
});

logger.logSecurityEvent('SQL injection detected', 'critical', {
  input: "' OR '1'='1",
  endpoint: '/api/users',
  ip: '192.168.1.100'
});
```

### Security Checklist

**Before Production Deployment:**

- [ ] Change all default passwords
- [ ] Generate strong JWT secret (min 32 characters)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS with production URLs only
- [ ] Set up rate limiting on all endpoints
- [ ] Enable MongoDB authentication
- [ ] Encrypt API keys in database
- [ ] Configure security headers
- [ ] Set up logging and monitoring
- [ ] Enable automatic security updates
- [ ] Regular security audits
- [ ] Backup and disaster recovery plan
- [ ] Penetration testing

---

## 👥 Contributing

We welcome contributions to VIPContentAI! Here's how you can help:

### Development Workflow

1. **Pick a User Story**
   - Browse `.stories/` folder
   - Find an unassigned story
   - Comment on GitHub issue to claim it

2. **Create Feature Branch**
   ```bash
   git checkout -b story-id/VIP-XXXXX-short-description
   ```

3. **Implement According to Acceptance Criteria**
   - Read story file thoroughly
   - Follow technical details
   - Meet all acceptance criteria

4. **Write Tests**
   - Follow Gherkin test specifications in `.tests/` folders
   - Ensure all scenarios pass

5. **Commit with Story ID**
   ```bash
   git commit -m "[VIP-XXXXX] Brief description of changes"
   ```

6. **Push and Create Pull Request**
   ```bash
   git push origin story-id/VIP-XXXXX-short-description
   ```

   **PR Template:**
   ```markdown
   ## Story: VIP-XXXXX - [Story Title]

   ### Changes
   - Implemented [feature/fix]
   - Added [tests/documentation]

   ### Acceptance Criteria Met
   - [x] Criterion 1
   - [x] Criterion 2
   - [x] Criterion 3

   ### Testing
   - [ ] Unit tests passing
   - [ ] Integration tests passing
   - [ ] Manual testing completed

   ### Screenshots (if applicable)
   [Add screenshots]

   ### Related Issues
   Closes #[issue number]
   ```

### Code Style

- **TypeScript**: Follow project tsconfig.json
- **Python**: Follow PEP 8
- **Components**: Use functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: JSDoc for functions, inline comments for complex logic

### Git Commit Messages

```bash
# Good examples:
[VIP-10001] Implement user registration form
[VIP-10002] Add JWT authentication middleware
[VIP-10003] Fix password reset email template

# Bad examples:
Update stuff
Fixed bug
WIP
```

---

## ❓ Troubleshooting

### Common Issues & Solutions

#### 1. Ollama Connection Failed

**Error**: `Failed to connect to Ollama at http://localhost:11434`

**Solutions:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# If not running, start it
ollama serve

# Check if models are installed
ollama list

# Pull missing models
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

---

#### 2. MongoDB Connection Error

**Error**: `MongooseError: connect ECONNREFUSED`

**Solutions:**
```bash
# Check MongoDB connection string
echo $MONGODB_URI

# Test connection (AWS MongoDB)
mongosh "mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai"

# Check if MongoDB server is accessible
nc -zv 3.105.105.52 27017
```

---

#### 3. FastAPI Service Not Starting

**Error**: `ModuleNotFoundError: No module named 'crewai'`

**Solutions:**
```bash
# Activate virtual environment
cd api-service
source .venv/bin/activate  # macOS/Linux
.venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt --upgrade

# Verify installation
pip list | grep crewai
```

---

#### 4. Generation Job Stuck

**Error**: Job status shows "processing" but never completes

**Solutions:**
```bash
# Check FastAPI logs
cd api-service
tail -f logs/app.log

# Check Ollama logs
ollama logs

# Manually cancel job in MongoDB
mongosh
use vipcontentai
db.generation_jobs.updateOne(
  { jobId: "job_abc123" },
  { $set: { status: "failed", error: "Manual cancellation" } }
)
```

---

#### 5. Slow Content Generation

**Issue**: Generation takes 5+ minutes

**Solutions:**
- **Use smaller model**: Switch from llama3.1:70b to llama3.1:8b
- **Reduce word count**: Use 1000-1500 instead of 3000-5000
- **Enable GPU**: Ensure Ollama is using GPU (check `nvidia-smi`)
- **Use quantized models**: Q4_K_M instead of full precision
- **Increase resources**: More RAM/VRAM

```bash
# Check GPU usage
nvidia-smi

# Check Ollama is using GPU
ollama ps

# Pull quantized model
ollama pull llama3.1:8b-q4_K_M
```

---

#### 6. Docker Container Crashes

**Error**: Container exits immediately after starting

**Solutions:**
```bash
# Check container logs
docker logs vipcontentai-app

# Check docker-compose services
docker-compose ps

# Restart specific service
docker-compose restart app

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

#### 7. Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Find process using port 3000
# macOS/Linux:
lsof -i :3000
# Windows:
netstat -ano | findstr :3000

# Kill process
# macOS/Linux:
kill -9 <PID>
# Windows:
taskkill /PID <PID> /F

# Or use different port
PORT=3001 pnpm dev
```

---

## 📄 License

MIT License

Copyright (c) 2025 VIPContentAI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 📞 Support & Contact

### Documentation

- **Technical Guide**: [CLAUDE.md](CLAUDE.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **User Stories**: [.stories/README.md](.stories/README.md)
- **API Service**: [api-service/README.md](api-service/README.md)

### Community

- **GitHub Issues**: https://github.com/Trigent-Software-Pvt-Ltd/vip_app/issues
- **GitHub Discussions**: https://github.com/Trigent-Software-Pvt-Ltd/vip_app/discussions
- **Bitbucket**: https://bitbucket.org/pushpahiremath_trigent/vip_play

### Resources

- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **CrewAI Docs**: https://docs.crewai.com/
- **Ollama Docs**: https://ollama.ai/docs
- **MongoDB Docs**: https://www.mongodb.com/docs/
- **shadcn/ui**: https://ui.shadcn.com/

---

## 🎉 Acknowledgments

Built with love for sports content creators using:

- **Next.js** - The React Framework
- **FastAPI** - Modern Python web framework
- **CrewAI** - Multi-agent AI orchestration
- **Ollama** - Run LLMs locally
- **MongoDB** - Document database with vector search
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework

---

**🚀 Ready to generate amazing sports content with AI!**

For questions, issues, or contributions, visit our [GitHub repository](https://github.com/Trigent-Software-Pvt-Ltd/vip_app) or [Bitbucket repository](https://bitbucket.org/pushpahiremath_trigent/vip_play).

**Happy Content Creating! 🏈⚾🏀**
