# Cursor AI Quick Start Guide

## Installation

1. **Install Cursor**: Download from [cursor.com](https://cursor.com)
2. **Open Project**: Open this folder in Cursor
3. **Configuration Loaded**: Cursor automatically loads `.cursor/` settings

## Using Commands (Slash Commands)

Type `/` in Cursor chat to see available commands:

### Quick Examples

```
/create-api-route
Create a POST endpoint at /api/content/generate that calls FastAPI service

/create-component
Create a ContentCard component that displays article title, summary, and SEO score

/create-fastapi-endpoint
Create an endpoint for generating content from Google Trends data

/add-tests
Add comprehensive test specs for VIP-10301 content listing feature

/review-code
Review app/api/auth/login/route.ts for security vulnerabilities

/debug-issue
Help debug "Module not found" error when importing @/lib/mongodb
```

## Tech Stack Context

### Next.js (Root)
When working on frontend/backend:
- AI knows: Next.js 16, TypeScript, Tailwind, shadcn/ui
- Auto-applies: Type safety, auth patterns, MongoDB usage
- File patterns: `app/**/*.{ts,tsx}`, `components/**/*.tsx`, `lib/**/*.ts`

**Example Chat:**
```
Create a protected API route for updating user preferences
→ AI generates with withAuth middleware, Zod validation, MongoDB operations
```

### FastAPI (api-service/)
When working on AI microservice:
- AI knows: FastAPI, Pydantic v2, CrewAI, Ollama
- Auto-applies: Async patterns, type hints, Ollama-only models
- File patterns: `api-service/**/*.py`

**Example Chat:**
```
Create an endpoint for bulk content generation with progress tracking
→ AI generates with Pydantic models, background tasks, CrewAI agents
```

## Best Practices

### 1. Reference User Stories
```
Implement VIP-10204 topic-based content generation
→ AI reads .stories/E3-Content-Generation-(AI)/VIP-10204.md for requirements
```

### 2. Specify Tech Stack
```
In Next.js, create a dashboard component with real-time updates
→ AI uses Next.js patterns, not generic React

In FastAPI, add SEO analysis to the generation pipeline
→ AI uses Pydantic, async, Ollama integration
```

### 3. Request Code Reviews
```
/review-code
Review the entire app/api/auth/ folder for security issues
→ AI checks: JWT validation, bcrypt usage, CSRF, rate limiting, input validation
```

### 4. Debug Systematically
```
/debug-issue
Getting 500 error from /api/articles/search with empty query
→ AI walks through: check validation, review error logs, test edge cases, suggest fixes
```

## Common Workflows

### Adding a New Feature

1. **Read Story**:
   ```
   Show me the requirements for VIP-10305 (Reject Content with Notes)
   ```

2. **Create API Route**:
   ```
   /create-api-route
   Create POST /api/content/[contentId]/reject with reason field
   ```

3. **Create Component**:
   ```
   /create-component
   Create RejectContentDialog with textarea for rejection reason
   ```

4. **Add Tests**:
   ```
   /add-tests
   Add test specs for VIP-10305 content rejection flow
   ```

5. **Review Code**:
   ```
   /review-code
   Review all changes for VIP-10305
   ```

### Fixing a Bug

1. **Describe Issue**:
   ```
   /debug-issue
   Users getting 401 error on /api/protected/me even with valid token
   ```

2. **Get Diagnosis**:
   - AI checks: JWT middleware, token expiration, cookie settings, MongoDB connection

3. **Apply Fix**:
   ```
   Fix the JWT token validation in lib/auth/with-auth.ts
   → AI suggests code changes with explanation
   ```

4. **Verify**:
   ```
   Test the fix with curl command
   → AI provides test commands
   ```

### Code Review Before Commit

```
/review-code
Review all changes in the current branch against Next.js and security best practices
```

AI checks:
- ✅ Type safety
- ✅ Error handling
- ✅ Security (XSS, CSRF, SQL injection)
- ✅ Input validation
- ✅ Authentication
- ✅ Best practices

## Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K` - Open Cursor chat
- `Cmd+Shift+L` / `Ctrl+Shift+L` - Chat with codebase
- `Cmd+L` / `Ctrl+L` - Edit selection
- `/` - Trigger command suggestions

## Project-Specific Tips

### 1. Dual Stack Awareness
```
❌ "Create an API endpoint for content generation"
   → Ambiguous, could be Next.js or FastAPI

✅ "In FastAPI, create an endpoint for content generation"
   → Clear, AI uses FastAPI patterns

✅ "In Next.js, create an API route that calls FastAPI for generation"
   → Clear, AI uses Next.js → FastAPI flow
```

### 2. Reference Files
```
Based on app/api/auth/register/route.ts, create a similar endpoint for password reset
→ AI analyzes existing pattern, applies to new endpoint
```

### 3. Test Specifications
```
Following the pattern in .stories/E1-Authentication-and-User-Management/.tests/VIP-10001-test.md,
create test specs for the new login feature
→ AI uses Gherkin format, comprehensive coverage
```

### 4. Error Messages
```
Getting this error: [paste error]
→ AI analyzes stack trace, suggests specific fixes
```

## Configuration Files

- **`.cursor/rules/`** - Tech stack guidelines (auto-apply)
- **`.cursor/commands/`** - Slash commands (manual trigger)
- **`.cursor/hooks.json`** - Post-edit actions (currently disabled)
- **`.cursor/README.md`** - Full documentation
- **`.cursor/SETUP-GUIDE.md`** - Detailed setup and usage guide
- **`.cursor/QUICK-START.md`** - This file

## Troubleshooting

### Commands Not Showing
1. Check `.cursor/commands/*.md` files exist
2. Restart Cursor
3. Try typing `/` slowly

### Rules Not Applying
1. Verify file matches glob pattern in rule frontmatter
2. Rules only apply to Agent (chat), not inline edit
3. Check `alwaysApply` setting

### AI Doesn't Understand Context
1. Explicitly mention tech stack: "In Next.js..." or "In FastAPI..."
2. Reference specific files: "Based on app/api/auth/register/route.ts..."
3. Link to user story: "Implement VIP-10204 (see .stories/E3...)"

## Learn More

- **Setup Guide**: `.cursor/SETUP-GUIDE.md` (detailed step-by-step guide)
- **Full Documentation**: `.cursor/README.md`
- **Quick Start**: `.cursor/QUICK-START.md` (this file)
- **Next.js Rules**: `.cursor/rules/nextjs-stack.md`
- **FastAPI Rules**: `api-service/.cursor/rules/fastapi-stack.md`
- **Project Context**: `CLAUDE.md`
- **User Stories**: `.stories/`

## Getting Help

### From AI
```
Explain the architecture of the VIPContentAI project
→ AI describes monorepo, Next.js + FastAPI, data flow

What are the authentication patterns in this project?
→ AI explains JWT, withAuth middleware, cookie settings

How do I integrate a new Ollama model?
→ AI shows FastAPI service configuration, CrewAI setup
```

### From Team
- Check project documentation in `README.md`
- Review user stories in `.stories/`
- See deployment guide in `DEPLOYMENT.md`

---

**Happy Coding with Cursor AI!** 🚀

Your AI pair programmer is configured and ready to help with:
- Next.js 16 full-stack development
- FastAPI AI microservices
- Security best practices
- Comprehensive testing
- Code reviews and debugging
