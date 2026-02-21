# Story to Application Page Mapping

**Last Updated**: 2025-11-11
**Total Stories**: 62
**Application URL**: https://v0-ai-content-generator-ruddy.vercel.app/

## Overview

This document maps each user story (VIP-XXXXX) to the application pages/routes where they are implemented and the screenshots needed for documentation.

---

## Authentication Pages (Public)

### Pages Available
- `/login` - User login page
- `/signup` - User registration page
- `/forgot-password` - Password recovery page

---

## Dashboard Pages (Protected)

### Pages Available
- `/dashboard` - Main dashboard/home
- `/dashboard/generate` - Content generation interface
- `/dashboard/knowledge-base` - Knowledge base management
- `/dashboard/media` - Media library
- `/dashboard/content` - Content review and management
- `/dashboard/settings` - User settings
- `/dashboard/ai-config` - AI configuration (superadmin only)

---

## Epic E1: Authentication & User Management (7 Stories)

| Story ID | Title | Page | Components | Screenshot Needed |
|----------|-------|------|------------|------------------|
| **VIP-10001** | User Registration | `/signup` | Email input, Password input, Confirm password, Full name input, Register button | ✅ YES |
| **VIP-10002** | User Login with JWT | `/login` | Email input, Password input, Login button, Forgot password link | ✅ YES |
| **VIP-10003** | JWT Token Management | API only (no UI) | Backend JWT utilities | ❌ NO |
| **VIP-10004** | Password Change | `/dashboard/settings` | Current password input, New password input, Confirm password, Save button | ✅ YES |
| **VIP-10005** | User Profile Management | `/dashboard/settings` | Profile form (name, email, avatar), Update profile button | ✅ YES |
| **VIP-10006** | Email Verification System | `/login` or verification link | Email verification page/flow | ✅ YES |
| **VIP-10007** | Email Verification | API only | Backend email handling | ❌ NO |
| **VIP-10008** | Role-Based Access Control | `/dashboard/settings` + `/dashboard/ai-config` | Role selector (superadmin view), permission indicators | ✅ YES |

**Pages to Screenshot**: `/signup`, `/login`, `/forgot-password`, `/dashboard/settings`

---

## Epic E2: Knowledge Base System (10 Stories)

| Story ID | Title | Page | Components | Screenshot Needed |
|----------|-------|------|------------|------------------|
| **VIP-10101** | RSS Feed Integration | `/dashboard/knowledge-base` | Add RSS feed button, RSS feed list | ✅ YES |
| **VIP-10102** | Website Crawler | `/dashboard/knowledge-base` | Add website button, Website list, Crawl button | ✅ YES |
| **VIP-10103** | Topic Management | `/dashboard/knowledge-base` | Topic creation form, Topic list | ✅ YES |
| **VIP-10104** | Google Trends Integration | `/dashboard/knowledge-base` | Add trends source, Trends list | ✅ YES |
| **VIP-10105** | Article Storage with Embeddings | API only | Backend article storage, vector embedding handling | ❌ NO |
| **VIP-10106** | Semantic Article Search | `/dashboard/knowledge-base` | Search bar, search results with relevance scores | ✅ YES |
| **VIP-10107** | Full-Text Article Search | `/dashboard/knowledge-base` | Text search filters, keyword highlighting | ✅ YES |
| **VIP-10108** | Source Status Management | `/dashboard/knowledge-base` | Status badges, pause/resume buttons | ✅ YES |
| **VIP-10109** | Article Metadata Extraction | `/dashboard/knowledge-base` | Metadata display in article details | ✅ YES |
| **VIP-10110** | Knowledge Base Dashboard | `/dashboard/knowledge-base` | Statistics cards, source health indicators, recent articles | ✅ YES |

**Pages to Screenshot**: `/dashboard/knowledge-base`

---

## Epic E3: Content Generation (12 Stories)

| Story ID | Title | Page | Components | Screenshot Needed |
|----------|-------|------|------------|------------------|
| **VIP-10201** | Topic-Based Generation | `/dashboard/generate` | Topic select, Generate button, content preview | ✅ YES |
| **VIP-10202** | Keyword-Based Generation | `/dashboard/generate` | Keyword input, Generate button, content preview | ✅ YES |
| **VIP-10203** | Trend-Based Generation | `/dashboard/generate` | Trend select, Generate button, content preview | ✅ YES |
| **VIP-10204** | Content Spinning | `/dashboard/generate` | Text upload, Spin button, spun content preview | ✅ YES |
| **VIP-10205** | Generation Settings | `/dashboard/generate` | Word count slider, Tone selector, SEO toggle | ✅ YES |
| **VIP-10206** | Bulk Generation | `/dashboard/generate` | Quantity selector (2-50), Generate all button | ✅ YES |
| **VIP-10207** | Progress Tracking | `/dashboard/generate` | Progress bar, Job status, Notifications | ✅ YES |
| **VIP-10208** | CrewAI Setup | API only | Backend agent setup | ❌ NO |
| **VIP-10209** | Research Agent | API only | Backend research logic | ❌ NO |
| **VIP-10210** | Writer Agent | API only | Backend writing logic | ❌ NO |
| **VIP-10211** | SEO Agent | API only | Backend SEO optimization | ❌ NO |
| **VIP-10212** | Agent Orchestration | API only | Backend orchestration | ❌ NO |

**Pages to Screenshot**: `/dashboard/generate`

---

## Epic E4: Content Management & Review (8 Stories)

| Story ID | Title | Page | Components | Screenshot Needed |
|----------|-------|------|------------|------------------|
| **VIP-10301** | Content Listing with Filters | `/dashboard/content` | Content table, Status filter, Sort options | ✅ YES |
| **VIP-10302** | Content Detail View | `/dashboard/content/:id` | Full content display, Metadata, Action buttons | ✅ YES |
| **VIP-10303** | Content Approval | `/dashboard/content` | Approve button, confirmation dialog | ✅ YES |
| **VIP-10304** | Content Rejection | `/dashboard/content` | Reject button, rejection reason form | ✅ YES |
| **VIP-10305** | Content Editing | `/dashboard/content/:id` | Edit button, content editor, save changes | ✅ YES |
| **VIP-10306** | Version History | `/dashboard/content/:id` | Version list, version comparison, rollback | ✅ YES |
| **VIP-10307** | Content Scheduling | `/dashboard/content/:id` | Schedule button, date/time picker | ✅ YES |
| **VIP-10308** | Content Analytics | `/dashboard/content` | Analytics tab, performance metrics | ✅ YES |

**Pages to Screenshot**: `/dashboard/content`, `/dashboard/content/:id`

---

## Epic E5: Media Library (6 Stories)

| Story ID | Title | Page | Components | Screenshot Needed |
|----------|-------|------|------------|------------------|
| **VIP-10401** | Upload Media Assets | `/dashboard/media` | Upload button, file picker | ✅ YES |
| **VIP-10402** | AI-Generated Images | `/dashboard/media` | Generate image button, generation options | ✅ YES |
| **VIP-10403** | AI-Generated Videos | `/dashboard/media` | Generate video button, video generation options | ✅ YES |
| **VIP-10404** | Media Library Browsing | `/dashboard/media` | Media grid/list, pagination | ✅ YES |
| **VIP-10405** | Media Search & Filter | `/dashboard/media` | Search bar, category filter, tag filter | ✅ YES |
| **VIP-10406** | Media Tagging & Organization | `/dashboard/media` | Tag input, organize button, move to folder | ✅ YES |

**Pages to Screenshot**: `/dashboard/media`

---

## Epic E6: AI Configuration (7 Stories)

| Story ID | Title | Page | Components | Screenshot Needed |
|----------|-------|------|------------|------------------|
| **VIP-10501** | AI Provider Setup | `/dashboard/ai-config` | Provider selector, API key input (if applicable) | ✅ YES |
| **VIP-10502** | Ollama Model Management | `/dashboard/ai-config` | Model list, add model, remove model buttons | ✅ YES |
| **VIP-10503** | Model Discovery | `/dashboard/ai-config` | Available models list, download button | ✅ YES |
| **VIP-10504** | Model Testing | `/dashboard/ai-config` | Test button, test prompt input, results display | ✅ YES |
| **VIP-10505** | Model Groups | `/dashboard/ai-config` | Create group button, group configuration | ✅ YES |
| **VIP-10506** | Routing Strategies | `/dashboard/ai-config` | Strategy selector (fallback, round_robin, weighted, majority_judge) | ✅ YES |
| **VIP-10507** | Config Export/Import | `/dashboard/ai-config` | Export button, Import button | ✅ YES |

**Pages to Screenshot**: `/dashboard/ai-config`

---

## Epic E7: Export & Notifications (5 Stories)

| Story ID | Title | Page | Components | Screenshot Needed |
|----------|-------|------|------------|------------------|
| **VIP-10601** | Single Content Export | `/dashboard/content/:id` | Export button, format selector (MD, DOCX, PDF, HTML) | ✅ YES |
| **VIP-10602** | Bulk Content Export | `/dashboard/content` | Bulk export button, content selection, format selector | ✅ YES |
| **VIP-10603** | Email Notifications | `/dashboard/settings` | Email notification preferences | ✅ YES |
| **VIP-10604** | Notification Center | `/dashboard` or `/dashboard/settings` | Notification bell icon, notification list | ✅ YES |
| **VIP-10605** | Export Queue Management | `/dashboard/content` | Export jobs list, queue status | ✅ YES |

**Pages to Screenshot**: `/dashboard/content/:id`, `/dashboard/content`, `/dashboard/settings`, `/dashboard`

---

## Epic E8: Deployment & Production (6 Stories)

| Story ID | Title | Page | Components | Screenshot Needed |
|----------|-------|------|------------|------------------|
| **VIP-10701** | Docker Setup | Deployment/README | Infrastructure documentation | ❌ NO |
| **VIP-10702** | Security Middleware | Backend/API | Rate limiting, CORS, CSP headers | ❌ NO |
| **VIP-10703** | Production Logging | Backend | Logging configuration | ❌ NO |
| **VIP-10704** | Database Documentation | Documentation | Schema and index documentation | ❌ NO |
| **VIP-10705** | Terraform Configuration | Infrastructure | AWS deployment setup | ❌ NO |
| **VIP-10706** | Deployment Guide | Documentation | Runbook and deployment procedures | ❌ NO |

**Pages to Screenshot**: None (infrastructure/documentation only)

---

## Summary: Pages Requiring Screenshots

### Priority 1: Core Authentication & Dashboard
1. `/login` - VIP-10002
2. `/signup` - VIP-10001
3. `/forgot-password` - VIP-10006
4. `/dashboard` - VIP-10604

### Priority 2: Knowledge Base
5. `/dashboard/knowledge-base` - VIP-10101 through VIP-10110

### Priority 3: Content Generation
6. `/dashboard/generate` - VIP-10201 through VIP-10207

### Priority 4: Content Management
7. `/dashboard/content` - VIP-10301, VIP-10303, VIP-10304, VIP-10308
8. `/dashboard/content/:id` - VIP-10302, VIP-10305, VIP-10306, VIP-10307, VIP-10601, VIP-10602

### Priority 5: Media Library
9. `/dashboard/media` - VIP-10401 through VIP-10406

### Priority 6: Settings & Configuration
10. `/dashboard/settings` - VIP-10004, VIP-10005, VIP-10008, VIP-10603, VIP-10604
11. `/dashboard/ai-config` - VIP-10501 through VIP-10507

---

## Screenshot Naming Convention

Screenshots will be saved to `.stories/.screenshots/` with the following naming:

```
VIP-XXXXX-[page-identifier].png
```

Examples:
- `VIP-10001-signup.png` - Signup page for registration story
- `VIP-10002-login.png` - Login page for login story
- `VIP-10101-knowledge-base-rss.png` - Knowledge base RSS section
- `VIP-10201-generate-topic.png` - Content generation topic mode
- `VIP-10301-content-list.png` - Content listing page
- `VIP-10401-media-library.png` - Media library page

---

## Stories NOT Requiring Screenshots

These stories are API/backend only and don't need UI screenshots:

**E1**: VIP-10003, VIP-10007
**E2**: VIP-10105
**E3**: VIP-10208, VIP-10209, VIP-10210, VIP-10211, VIP-10212
**E8**: VIP-10701 through VIP-10706

**Total**: 14 stories (no UI screenshots needed)
**Total requiring screenshots**: 48 stories

---

## Next Steps

1. ✅ Create `.stories/.screenshots` folder
2. ✅ Create story-page mapping document (this file)
3. ⏳ Use Playwright MCP to take screenshots for each page
4. ⏳ Save screenshots with story-id naming convention
5. ⏳ Update Jira stories with details and attached screenshots
6. ⏳ Link branches and PRs to Jira stories
7. ⏳ Verify all synchronization

---

## Application Details

**URL**: https://v0-ai-content-generator-ruddy.vercel.app/
**Browser**: Chromium (via Playwright)
**Default User**: demo@contentai.com (pre-authenticated in dashboard)
**Superadmin Access**: Enabled (for AI Config pages)

---

Generated: 2025-11-11
Document Owner: Claude Code
