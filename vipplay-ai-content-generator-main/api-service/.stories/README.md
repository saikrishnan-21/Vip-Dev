# FastAPI AI Service - User Stories

This document references all user stories related to the FastAPI AI microservice from the main project stories.

## 📍 Story Location

All FastAPI service stories are located in the main project `.stories` folder at the **root level**.

**Path**: `../../../.stories/`

## 🎯 FastAPI Service Stories

The FastAPI service is primarily covered in **Epic E3: Content Generation (AI)** but also has dependencies in other epics.

### Epic E3: Content Generation (AI)

**Location**: `.stories/E3-Content-Generation-(AI)/`

| Story ID | Story Title | Story Points | Priority | Description |
|----------|-------------|--------------|----------|-------------|
| **VIP-10201** | Set Up FastAPI Microservice | 5 | High | Initial FastAPI project setup, structure, dependencies |
| **VIP-10202** | Configure CrewAI Agents | 8 | High | Set up content_researcher and content_writer agents |
| **VIP-10203** | Ollama Integration | 5 | High | Integrate Ollama client for LLM inference |
| **VIP-10204** | Topic-Based Content Generation | 5 | High | Implement topic generation endpoint |
| **VIP-10205** | Keywords-Based Content Generation | 5 | High | Implement keywords generation endpoint |
| **VIP-10206** | Trends-Based Content Generation | 5 | High | Implement trends generation endpoint |
| **VIP-10207** | Spin Existing Article | 8 | Medium | Implement article spinning functionality |
| **VIP-10208** | Bulk Generation Queue | 8 | High | Implement job queue for bulk operations |
| **VIP-10209** | SEO Analysis & Scoring | 5 | High | Calculate SEO scores for generated content |
| **VIP-10210** | Readability Analysis | 3 | Medium | Implement Flesch reading ease calculation |
| **VIP-10211** | Progress Tracking | 5 | High | Real-time progress updates for generation |
| **VIP-10212** | Generation Job Management | 5 | Medium | Job status tracking and history |

**Total**: 12 stories, 67 story points

### Epic E2: Knowledge Base System (Embedding Support)

**Location**: `.stories/E2-Knowledge-Base-System/`

| Story ID | Story Title | Story Points | Priority | Description |
|----------|-------------|--------------|----------|-------------|
| **VIP-10107** | Generate Article Vector Embeddings | 5 | Medium | Use Ollama nomic-embed-text for embeddings |
| **VIP-10109** | Vector Similarity Search | 5 | Medium | Find similar articles using embeddings |

**Total**: 2 stories, 10 story points

### Epic E5: Media Library (AI Image Generation)

**Location**: `.stories/E5-Media-Library/`

| Story ID | Story Title | Story Points | Priority | Description |
|----------|-------------|--------------|----------|-------------|
| **VIP-10402** | Generate AI Images | 8 | High | Generate images using Ollama Stable Diffusion |

**Total**: 1 story, 8 story points

## 📊 FastAPI Service Summary

- **Total Stories**: 15 stories
- **Total Story Points**: 85 points (~5-6 weeks)
- **Primary Epic**: E3 (Content Generation)
- **Secondary Epics**: E2 (Embeddings), E5 (Image Generation)

## 🔍 Quick Access Links

### Story Files
- [VIP-10201: Set Up FastAPI Microservice](../../.stories/E3-Content-Generation-(AI)/VIP-10201.md)
- [VIP-10202: Configure CrewAI Agents](../../.stories/E3-Content-Generation-(AI)/VIP-10202.md)
- [VIP-10203: Ollama Integration](../../.stories/E3-Content-Generation-(AI)/VIP-10203.md)
- [VIP-10204: Topic-Based Content Generation](../../.stories/E3-Content-Generation-(AI)/VIP-10204.md)
- [VIP-10205: Keywords-Based Content Generation](../../.stories/E3-Content-Generation-(AI)/VIP-10205.md)
- [VIP-10206: Trends-Based Content Generation](../../.stories/E3-Content-Generation-(AI)/VIP-10206.md)
- [VIP-10207: Spin Existing Article](../../.stories/E3-Content-Generation-(AI)/VIP-10207.md)
- [VIP-10208: Bulk Generation Queue](../../.stories/E3-Content-Generation-(AI)/VIP-10208.md)
- [VIP-10209: SEO Analysis & Scoring](../../.stories/E3-Content-Generation-(AI)/VIP-10209.md)
- [VIP-10210: Readability Analysis](../../.stories/E3-Content-Generation-(AI)/VIP-10210.md)
- [VIP-10211: Progress Tracking](../../.stories/E3-Content-Generation-(AI)/VIP-10211.md)
- [VIP-10212: Generation Job Management](../../.stories/E3-Content-Generation-(AI)/VIP-10212.md)
- [VIP-10107: Generate Article Vector Embeddings](../../.stories/E2-Knowledge-Base-System/VIP-10107.md)
- [VIP-10109: Vector Similarity Search](../../.stories/E2-Knowledge-Base-System/VIP-10109.md)
- [VIP-10402: Generate AI Images](../../.stories/E5-Media-Library/VIP-10402.md)

### Epic Details
- [E3 Epic Details](../../.stories/E3-Content-Generation-(AI)/epic_details.md)
- [E2 Epic Details](../../.stories/E2-Knowledge-Base-System/epic_details.md)
- [E5 Epic Details](../../.stories/E5-Media-Library/epic_details.md)

## 🎯 Development Phases for FastAPI Service

### Phase 1: Foundation (Sprint 4, Weeks 7-8)
**Stories**: VIP-10201, VIP-10202, VIP-10203
- Set up FastAPI project structure
- Configure CrewAI agents (researcher, writer)
- Integrate Ollama client
- **Deliverable**: Working FastAPI service with health check and model listing

### Phase 2: Core Generation (Sprint 5, Weeks 9-10)
**Stories**: VIP-10204, VIP-10205, VIP-10206, VIP-10209
- Implement 3 generation modes (topic, keywords, trends)
- Add SEO analysis service
- **Deliverable**: Generate content via API endpoints with SEO scores

### Phase 3: Advanced Features (Sprint 6, Weeks 11-12)
**Stories**: VIP-10207, VIP-10208, VIP-10210, VIP-10211
- Add article spinning functionality
- Implement bulk generation queue
- Add readability analysis
- Real-time progress tracking
- **Deliverable**: Production-ready generation service with job management

### Phase 4: Embeddings & Media (Sprint 7-8)
**Stories**: VIP-10107, VIP-10109, VIP-10402, VIP-10212
- Generate embeddings for articles
- Implement similarity search
- Add AI image generation
- Job history management
- **Deliverable**: Complete AI service with all features

## 🏗️ Project Structure (FastAPI Focus)

```
api-service/
├── main.py                      # FastAPI app (VIP-10201)
├── agents/
│   ├── content_researcher.py    # Research agent (VIP-10202)
│   ├── content_writer.py        # Writer agent (VIP-10202)
│   └── crew_config.py           # CrewAI setup (VIP-10202)
├── services/
│   ├── ollama_client.py         # Ollama integration (VIP-10203)
│   ├── generation_service.py    # Generation logic (VIP-10204-10208)
│   ├── seo_analyzer.py          # SEO scoring (VIP-10209)
│   ├── readability_analyzer.py  # Readability (VIP-10210)
│   ├── embedding_service.py     # Embeddings (VIP-10107)
│   └── image_generation.py      # Image gen (VIP-10402)
├── models/
│   ├── generation_request.py    # Request models
│   ├── generation_response.py   # Response models
│   └── job_status.py            # Job tracking (VIP-10211, VIP-10212)
├── tests/
│   └── ... (test files for each service)
└── .stories/
    └── README.md                # This file
```

## 📋 Jira Labels for FastAPI Stories

When viewing in Jira, filter by these labels:
- `fastapi` - All FastAPI service stories
- `ai-service` - Alternative label
- `e3` - Content Generation epic stories
- `ollama` - Stories involving Ollama integration
- `crewai` - Stories involving CrewAI agents

## 🔄 Workflow

### For FastAPI Developers

1. **Sprint Planning**:
   - Focus on stories labeled `fastapi` or in E3 epic
   - Start with VIP-10201 (FastAPI setup)
   - Follow sequential order for dependencies

2. **Daily Development**:
   - Reference story ID in commits: `[VIP-10201] Set up FastAPI structure`
   - Check acceptance criteria in story file
   - Update technical notes as you implement

3. **Code Review**:
   - PR title: `[VIP-10202] Configure CrewAI agents`
   - Link Jira story in PR description
   - Verify all acceptance criteria met

### Integration with Next.js

Several stories require coordination with Next.js backend:
- VIP-10204-10208: Next.js calls FastAPI endpoints
- VIP-10211: Progress updates sent to Next.js
- VIP-10107: Next.js triggers embedding generation

Check `.stories/E3-Content-Generation-(AI)/epic_details.md` for integration details.

## 📚 Related Documentation

- [FastAPI Service README](../README.md) - Setup and development guide
- [FastAPI Service CLAUDE.md](../CLAUDE.md) - Technical guidance for Claude Code
- [Main Project Stories](../../.stories/README.md) - All project stories
- [Root CLAUDE.md](../../CLAUDE.md) - Overall architecture
- [QUICKSTART.md](../../QUICKSTART.md) - Getting started guide

## ✅ Definition of Done (FastAPI Specific)

For each FastAPI story to be considered complete:
- [ ] Code implemented in appropriate service/agent file
- [ ] API endpoint created (if applicable) and documented in `/docs`
- [ ] Unit tests written and passing (pytest)
- [ ] Integration test with mock Next.js request
- [ ] Ollama connection tested
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Code reviewed and merged
- [ ] Story marked as Done in Jira

## 🚀 Getting Started

1. Read [api-service/README.md](../README.md) for setup instructions
2. Start with VIP-10201 (Set Up FastAPI Microservice)
3. Reference story files for detailed acceptance criteria
4. Follow implementation order to avoid dependencies issues

## 🤝 Communication

**Cross-Team Dependencies**:
- FastAPI service provides endpoints for Next.js backend
- Coordinate on API contracts (request/response formats)
- Sync on job tracking and progress updates
- Align on error handling and status codes

**Standup Focus**:
- Which FastAPI story are you working on? (VIP-XXXXX)
- Any blockers with Ollama or CrewAI?
- Integration points with Next.js needed?

---

**Note**: This is a reference document. All actual story files and epic details are in the main `.stories` folder at the project root.
