# VIPContentAI - User Stories & Epics

This folder contains all user stories and epics for VIPContentAI backend implementation, organized for easy Jira import.

## 📁 Folder Structure

```
.stories/
├── E1-Authentication-and-User-Management/
│   ├── epic_details.md              # Epic overview and summary
│   ├── VIP-10001.md                 # User Registration
│   ├── VIP-10002.md                 # User Login
│   ├── VIP-10003.md                 # Password Reset Flow
│   └── ... (8 stories total)
├── E2-Knowledge-Base-System/
│   ├── epic_details.md
│   ├── VIP-10101.md                 # Add RSS Feed Source
│   ├── VIP-10102.md                 # Add Website Source with Firecrawl
│   └── ... (10 stories total)
├── E3-Content-Generation-(AI)/
│   ├── epic_details.md
│   ├── VIP-10201.md                 # Set Up FastAPI Microservice
│   └── ... (12 stories total)
├── E4-Content-Management-and-Review/
│   ├── epic_details.md
│   └── ... (8 stories total)
├── E5-Media-Library/
│   ├── epic_details.md
│   └── ... (6 stories total)
├── E6-AI-Configuration-(Superadmin)/
│   ├── epic_details.md
│   └── ... (7 stories total)
├── E7-Export-and-Notifications/
│   ├── epic_details.md
│   └── ... (5 stories total)
├── E8-Deployment-and-Production/
│   ├── epic_details.md
│   └── ... (6 stories total)
├── jira-import.csv                  # Jira bulk import file
├── generate_stories.py              # Story generation script
└── README.md                        # This file
```

## 📊 Project Overview

| Epic | Stories | Story Points | Priority |
|------|---------|--------------|----------|
| **E1**: Authentication & User Management | 8 | 26 | P0 |
| **E2**: Knowledge Base System | 10 | 44 | P0 |
| **E3**: Content Generation (AI) | 12 | 67 | P0 |
| **E4**: Content Management & Review | 8 | 30 | P1 |
| **E5**: Media Library | 6 | 25 | P1 |
| **E6**: AI Configuration (Superadmin) | 7 | 27 | P2 |
| **E7**: Export & Notifications | 5 | 21 | P2 |
| **E8**: Deployment & Production | 6 | 29 | P2 |
| **TOTAL** | **62 stories** | **269 points** | - |

**Estimated Duration**: 18 weeks (4.5 months)

## 🎯 Story ID Conventions

- **Epic IDs**: `VIP-E{N}` (e.g., VIP-E1, VIP-E2)
- **Story IDs**: `VIP-{epic}{seq}` format:
  - E1 stories: VIP-10001 to VIP-10008
  - E2 stories: VIP-10101 to VIP-10110
  - E3 stories: VIP-10201 to VIP-10212
  - E4 stories: VIP-10301 to VIP-10308
  - E5 stories: VIP-10401 to VIP-10406
  - E6 stories: VIP-10501 to VIP-10507
  - E7 stories: VIP-10601 to VIP-10605
  - E8 stories: VIP-10701 to VIP-10706

## 📥 Importing to Jira

### Option 1: CSV Bulk Import (Recommended)

1. Open Jira and navigate to your project
2. Go to **Project Settings** → **Import**
3. Select **CSV** as import source
4. Upload `jira-import.csv`
5. Map columns:
   - Issue Type → Issue Type
   - Summary → Summary
   - Description → Description
   - Priority → Priority
   - Story Points → Story Points
   - Epic Link → Epic Link
   - Status → Status
   - Labels → Labels
6. Click **Begin Import**
7. Verify all 70 items imported (8 epics + 62 stories)

### Option 2: Manual Creation

1. Navigate to each epic folder (e.g., `E1-Authentication-and-User-Management/`)
2. Open `epic_details.md` for epic overview
3. Create epic in Jira with epic ID (VIP-E1, VIP-E2, etc.)
4. For each story file (VIP-10001.md, etc.):
   - Create story in Jira
   - Copy summary, description, and acceptance criteria
   - Link to parent epic
   - Set story points and priority

## 📖 Using the Stories

### For Scrum Masters

1. **Sprint Planning**:
   - Review epic_details.md for each epic
   - Prioritize stories by story ID (lower numbers = higher priority)
   - Start with E1 (Authentication) as it's foundational
   - Aim for 20-30 story points per 2-week sprint

2. **Story Refinement**:
   - Each story file contains:
     - User story format (As a... I want... So that...)
     - Acceptance criteria placeholders
     - Technical details section
     - Definition of Done
   - Refine acceptance criteria during backlog grooming
   - Add implementation notes as needed

3. **Tracking Progress**:
   - Update story status in Jira
   - Mark acceptance criteria as done
   - Link related stories (blocks, blocked by)

### For Developers

1. **Implementation**:
   - Read epic_details.md for context
   - Open individual story file (e.g., VIP-10001.md)
   - Review acceptance criteria and technical details
   - Implement according to Definition of Done
   - Update story notes with implementation details

2. **Code Review**:
   - Reference story ID in PR title (e.g., "[VIP-10001] Implement user registration")
   - Verify all acceptance criteria are met
   - Check Definition of Done checklist

## 🔄 Regenerating Stories

If you need to update stories or add new ones:

```bash
cd .stories
python generate_stories.py
```

This will:
- Create/update all epic folders
- Generate all story markdown files
- Regenerate `jira-import.csv`

**Note**: Modify the `stories` dictionary in `generate_stories.py` to add or update stories.

## 📋 Story File Format

Each story file (e.g., `VIP-10001.md`) contains:

```markdown
# VIP-10001: Story Title

**Story ID**: VIP-10001
**Story Type**: Story
**Epic**: Epic Name
**Priority**: High/Medium/Low
**Story Points**: X
**Status**: To Do

## User Story
As a [user type]
I want [goal]
So that [benefit]

## Acceptance Criteria
- [ ] AC1: [Criterion]
- [ ] AC2: [Criterion]

## Technical Details
[Implementation notes]

## Definition of Done
- [ ] Code implemented
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Merged to main

## Notes
[Additional information]
```

## 🎯 Sprint Planning Guide

### Sprint 1 (Weeks 1-2): Authentication Foundation
- VIP-10001: User Registration (3 pts)
- VIP-10002: User Login (3 pts)
- VIP-10004: JWT Token Management (3 pts)
- VIP-10005: Protected Routes Middleware (3 pts)
- VIP-10006: User Profile Management (3 pts)
- **Total**: 15 points

### Sprint 2 (Weeks 3-4): Knowledge Base Foundation
- VIP-10003: Password Reset Flow (5 pts)
- VIP-10007: User Preferences & Settings (3 pts)
- VIP-10008: Role-Based Access Control (3 pts)
- VIP-10101: Add RSS Feed Source (3 pts)
- VIP-10105: Fetch and Parse RSS Articles (5 pts)
- **Total**: 19 points

### Sprint 3 (Weeks 5-6): Knowledge Base Completion
- VIP-10102: Add Website Source with Firecrawl (5 pts)
- VIP-10106: Crawl and Extract Website Content (8 pts)
- VIP-10108: Full-Text Search Articles (3 pts)
- VIP-10110: List Articles by Source (3 pts)
- **Total**: 19 points

### Sprint 4 (Weeks 7-8): AI Service Setup
- VIP-10201: Set Up FastAPI Microservice (5 pts)
- VIP-10202: Configure CrewAI Agents (8 pts)
- VIP-10203: Ollama Integration (5 pts)
- **Total**: 18 points

### Sprint 5 (Weeks 9-10): Content Generation
- VIP-10204: Topic-Based Content Generation (5 pts)
- VIP-10205: Keywords-Based Content Generation (5 pts)
- VIP-10206: Trends-Based Content Generation (5 pts)
- VIP-10209: SEO Analysis & Scoring (5 pts)
- **Total**: 20 points

...and so on for remaining sprints.

## 📚 Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Technical documentation
- [QUICKSTART.md](../QUICKSTART.md) - Setup guide
- [README.md](../README.md) - Product overview
- [api-service/README.md](../api-service/README.md) - FastAPI service docs

## 🤝 Contributing

When adding new stories:
1. Update `generate_stories.py` with new story data
2. Run the script to regenerate files
3. Commit both the script and generated files
4. Update sprint planning guide if needed

## 📧 Support

For questions about stories or sprint planning:
- Review epic_details.md files for context
- Check technical documentation in CLAUDE.md
- Refer to API specifications in README.md
