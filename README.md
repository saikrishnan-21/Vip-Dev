## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/saikrishnan-21/Vip-Dev.git
cd Vip-Dev
```

### 2. Setup Node.js (Frontend)

```bash
# Install dependencies
npm install

# Setup environment variables
# Copy .env.example to .env.local and update values
cp .env.example .env.local

# Setup database (indexes and initial data)
npm run db:setup

# Start development server
npm run dev
```

### 3. Setup Python (FastAPI Service)

```bash
cd api-service
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --port 8000
```

## 🛠️ Troubleshooting

If you encounter issues during installation or runtime, try these commands:

### Resolve Node/Build Errors

```bash
# Clear Next.js cache and reinstall dependencies
rm -rf .next
rm -rf node_modules
npm install
```

### Resolve Python Errors

```bash
# If dependencies are missing or broken, recreate the venv
rm -rf .venv
python -m venv .venv
# Re-activate and install
pip install -r requirements.txt
```

### Check Database Connection

```bash
npm run db:test
```
# Cursor AI Configuration for VIPContentAI

This directory contains Cursor AI configuration to provide consistent development experience across the team for the dual-stack VIPContentAI project.

## Configuration Structure

```
.cursor/
├── README.md                    # This file (main documentation)
├── QUICK-START.md               # Quick reference guide
├── SETUP-GUIDE.md               # Step-by-step setup and usage
├── PROJECT-CONTEXT.md           # High-level project context for AI
├── hooks.json                   # Cursor agent hooks (currently disabled)
├── commands/                    # Custom slash commands (10 total)
│   ├── create-api-route.md            # Create Next.js API route
│   ├── create-component.md            # Create React component
│   ├── create-fastapi-endpoint.md     # Create FastAPI endpoint
│   ├── add-tests.md                   # Add test specifications
│   ├── review-code.md                 # Comprehensive code review
│   ├── debug-issue.md                 # Systematic debugging guide
│   ├── implement-story.md             # Implement complete user story
│   ├── refactor-code.md               # Refactor for quality
│   ├── optimize-performance.md        # Performance optimization
│   └── generate-docs.md               # Generate documentation
└── rules/                       # Project rules (tech stack guidelines)
    ├── nextjs-stack.mdc             # Next.js + TypeScript guidelines
    └── fastapi-stack.mdc            # FastAPI + Python guidelines
```

## Available Commands

Trigger commands in Cursor chat by typing `/` followed by the command name:

**Total Commands: 10**

### `/create-api-route`

Creates a new Next.js API route with:

- Proper authentication middleware
- Zod validation
- Error handling
- MongoDB integration
- TypeScript types

**Usage:** `/create-api-route Create a POST endpoint for user profile updates`

### `/create-component`

Creates a React component with:

- TypeScript prop interfaces
- Client/server directive
- Tailwind CSS styling
- Proper imports and structure

**Usage:** `/create-component Create a UserProfileCard component that displays user info`

### `/create-fastapi-endpoint`

Creates a FastAPI endpoint with:

- Pydantic models
- Async patterns
- Ollama integration
- Error handling
- Type hints

**Usage:** `/create-fastapi-endpoint Create an endpoint for AI content generation from keywords`

### `/add-tests`

Creates comprehensive test specifications with:

- Gherkin scenarios
- Multiple test categories
- Security and accessibility tests
- Edge cases

**Usage:** `/add-tests Add test specs for VIP-10101 RSS feed functionality`

### `/review-code`

Performs comprehensive code review checking:

- Type safety
- Security vulnerabilities
- Best practices
- Performance issues
- Accessibility

**Usage:** `/review-code Review the user authentication API routes`

### `/debug-issue`

Systematic debugging guide for:

- Next.js issues (hydration, API routes, build)
- FastAPI issues (Ollama, Pydantic, CrewAI)
- Common patterns and solutions

**Usage:** `/debug-issue Help debug 401 error on /api/protected/me endpoint`

### `/implement-story`

Implement complete user story with:

- All necessary components and routes
- API implementation (Next.js/FastAPI)
- Test specifications
- Documentation

**Usage:** `/implement-story Implement VIP-10204 topic-based content generation`

### `/refactor-code`

Refactor existing code to improve:

- Code quality and maintainability
- Performance
- Type safety
- Error handling

**Usage:** `/refactor-code Refactor app/api/auth/register/route.ts for better error handling`

### `/optimize-performance`

Analyze and optimize performance:

- Frontend bundle size and rendering
- Backend API response times
- Database query optimization
- AI generation speed

**Usage:** `/optimize-performance Optimize content generation flow to < 10s`

### `/generate-docs`

Generate comprehensive documentation:

- API endpoint documentation
- Component documentation
- Function docstrings
- Feature documentation

**Usage:** `/generate-docs Generate docs for content generation API`

## Tech Stack Rules

### Next.js Stack (Root Level)

**File:** `.cursor/rules/nextjs-stack.md`

Automatically applies to:

- `app/**/*.{ts,tsx}` - API routes and pages
- `components/**/*.{ts,tsx}` - React components
- `lib/**/*.ts` - Utilities and helpers
- `hooks/**/*.ts` - React hooks

**Covers:**

- Next.js 16 App Router patterns
- TypeScript best practices
- API route structure
- Authentication middleware
- MongoDB integration
- Tailwind CSS styling
- shadcn/ui components
- Zod validation
- Security best practices

### FastAPI Stack (api-service/)

**File:** `api-service/.cursor/rules/fastapi-stack.md`

Automatically applies to:

- `api-service/**/*.py` - All Python files

**Covers:**

- FastAPI patterns and structure
- Pydantic v2 models
- CrewAI agent configuration
- Ollama integration (local models only)
- Async/await patterns
- Error handling
- Type hints
- Python best practices (PEP 8)

## Hooks

### After File Edit

- **Prettier Formatting**: Automatically formats code after edits
- Configure in `.cursor/hooks.json`

### Before Shell Execution

- Currently allows all commands
- Can be restricted for security (e.g., block git push --force)

## Using Cursor AI Effectively

### 1. Reference Rules Explicitly

When asking questions, mention the tech stack:

```
Create a new API route for user preferences following Next.js stack guidelines
```

### 2. Use Commands for Common Tasks

Instead of explaining from scratch, use commands:

```
/create-api-route Create GET and PATCH endpoints for /api/sources/[sourceId]
```

### 3. Request Code Reviews

Before committing, get AI review:

```
/review-code Review app/api/auth/register/route.ts for security issues
```

### 4. Debugging Workflow

When stuck, use the debug command:

```
/debug-issue Getting 422 validation error from FastAPI endpoint
```

### 5. Reference User Stories

Link to story files for context:

```
Implement VIP-10204 (see .stories/E3-Content-Generation-(AI)/VIP-10204.md)
```

## Project Context

### Monorepo Structure

This is a **monorepo** with two distinct tech stacks:

1. **Next.js (Root)**: Full-stack application
   - Frontend: React + Tailwind + shadcn/ui
   - Backend: API routes + MongoDB Atlas
   - Auth: JWT with bcrypt

2. **FastAPI (api-service/)**: AI microservice
   - CrewAI multi-agent system
   - Ollama local LLM inference
   - SEO and readability analysis

### Communication Flow

```
User → Next.js Frontend
     ↓
Next.js API Routes (auth, data)
     ↓
MongoDB Atlas

Next.js API Routes
     ↓
FastAPI Microservice (AI operations)
     ↓
Ollama Local Models
```

### Key Principles

1. **Separation of Concerns**
   - Next.js: User-facing features, auth, data persistence
   - FastAPI: AI operations only

2. **Type Safety**
   - TypeScript in Next.js (strict mode)
   - Type hints in Python

3. **Security First**
   - JWT authentication
   - Input validation (Zod/Pydantic)
   - CSRF protection
   - Rate limiting

4. **Local AI Only**
   - Ollama models (NO OpenAI, Anthropic, Google)
   - Privacy-focused, cost-effective

5. **Testing**
   - Gherkin specifications in `.stories/.tests/`
   - Coverage across security, accessibility, performance

## Customizing Configuration

### Adding New Commands

1. Create `.cursor/commands/[name].md`
2. Write command description and template
3. Command available as `/[name]`

### Adding Rules

1. Create `.cursor/rules/[name].md` with frontmatter:

```markdown
---
description: Rule description
globs: ["pattern"]
alwaysApply: true|false
---

Rule content
```

### Modifying Hooks

Edit `.cursor/hooks.json`:

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [{ "command": "your-formatter", "args": ["--flag"] }]
  }
}
```

## Best Practices

### ✅ Do

- Use commands for consistent code generation
- Reference rules in chat for context
- Review code before committing
- Follow tech stack conventions
- Add test specifications for new features
- Use type hints/annotations everywhere

### ❌ Don't

- Mix Next.js and FastAPI responsibilities
- Use cloud LLM providers in FastAPI
- Skip input validation
- Forget error handling
- Use relative imports (use path aliases)
- Commit without code review

## Troubleshooting

### Commands Not Showing Up

- Ensure `.cursor/commands/*.md` files exist
- Check file permissions
- Restart Cursor

### Rules Not Applying

- Verify glob patterns in frontmatter
- Check `alwaysApply` setting
- Rules apply to Agent (chat), not inline edit

### Hooks Not Running

- Verify `.cursor/hooks.json` exists and has valid JSON
- Check command is installed (e.g., `prettier` for formatting hooks)
- Test command manually in terminal
- If issues persist, disable hooks by setting them to empty arrays
- See `.cursor/SETUP-GUIDE.md` for detailed hook configuration

## Resources

### Documentation

- [Cursor Rules Docs](https://docs.cursor.com/context/rules)
- [Cursor Hooks Docs](https://docs.cursor.com/agent/hooks)
- [Cursor Commands Docs](https://docs.cursor.com/agent/chat/commands)

### Project Docs

- `README.md` - Project overview
- `CLAUDE.md` - Comprehensive project context
- `DEPLOYMENT.md` - Deployment guide
- `.stories/` - User stories and requirements

### Tech Stack Docs

- [Next.js 16](https://nextjs.org/docs)
- [FastAPI](https://fastapi.tiangolo.com)
- [CrewAI](https://docs.crewai.com)
- [Ollama](https://ollama.ai/docs)

## Team Collaboration

This configuration is version-controlled to ensure:

- ✅ Consistent code style across team
- ✅ Standardized workflows
- ✅ Security best practices enforced
- ✅ New team members onboard quickly
- ✅ AI assistance follows project conventions

When updating configuration, commit changes and notify team members to pull latest.

---

**Maintained by:** VIPContentAI Team
**Last Updated:** 2025-01-15
**Cursor Version:** Latest
