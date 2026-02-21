# Cursor AI Configuration - Complete Setup Guide

## ✅ Current Status

Your Cursor AI configuration is **properly set up** and ready to use! Here's what's configured:

### What's Working:
- ✅ **Rules**: 2 rule files (Next.js and FastAPI stacks)
- ✅ **Commands**: 6 slash commands for common workflows
- ✅ **Hooks**: Configured (currently empty for stability)
- ✅ **Documentation**: Comprehensive README and guides

---

## 📁 File Structure Overview

```
.cursor/
├── README.md              # Main documentation (comprehensive)
├── QUICK-START.md         # Quick reference guide
├── SETUP-GUIDE.md         # This file - step-by-step setup
├── hooks.json            # Cursor agent hooks (currently disabled)
├── commands/             # Slash commands (6 files)
│   ├── create-api-route.md
│   ├── create-component.md
│   ├── create-fastapi-endpoint.md
│   ├── add-tests.md
│   ├── review-code.md
│   └── debug-issue.md
└── rules/                # Project rules
    └── nextjs-stack.md   # Next.js guidelines

api-service/.cursor/
└── rules/
    └── fastapi-stack.md  # FastAPI guidelines
```

---

## 🎯 How It Works

### 1. **Rules** (Auto-Applied Context)

Rules provide automatic context to Cursor AI based on the files you're working on.

#### Next.js Stack Rule
**File**: `.cursor/rules/nextjs-stack.md`
**Applies to**: `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `lib/**/*.ts`, `hooks/**/*.ts`

When you edit these files, Cursor AI automatically knows:
- Next.js 16 App Router patterns
- TypeScript best practices
- API route structure
- MongoDB integration
- Tailwind CSS styling
- Security best practices

#### FastAPI Stack Rule
**File**: `api-service/.cursor/rules/fastapi-stack.md`
**Applies to**: `api-service/**/*.py`

When you edit Python files in `api-service/`, Cursor AI automatically knows:
- FastAPI patterns
- Pydantic v2 models
- CrewAI agent configuration
- Ollama integration
- Async/await patterns

**How to verify rules are working:**
1. Open a file like `app/api/auth/register/route.ts`
2. Start a new Cursor chat (Cmd+K / Ctrl+K)
3. Ask: "What are the coding standards for this file?"
4. Cursor should reference the Next.js stack guidelines

---

### 2. **Commands** (Slash Commands)

Commands are reusable workflows triggered by typing `/` in Cursor chat.

#### Available Commands:

| Command | Purpose | Usage |
|---------|---------|-------|
| `/create-api-route` | Create Next.js API route | `/create-api-route Create POST /api/users/preferences` |
| `/create-component` | Create React component | `/create-component Create UserCard component` |
| `/create-fastapi-endpoint` | Create FastAPI endpoint | `/create-fastapi-endpoint Create content generation endpoint` |
| `/add-tests` | Add test specifications | `/add-tests Add tests for VIP-10101` |
| `/review-code` | Comprehensive code review | `/review-code Review app/api/auth/ folder` |
| `/debug-issue` | Systematic debugging | `/debug-issue Help with 401 error on protected route` |

**How to use commands:**
1. Open Cursor chat (Cmd+K / Ctrl+K)
2. Type `/` to see available commands
3. Select a command or type its name
4. Provide additional context

**Example Session:**
```
You: /create-api-route
Create a POST endpoint at /api/sources/[sourceId]/refresh
that validates sourceId and returns updated source data

Cursor AI: [Generates complete API route with auth, validation, error handling]
```

---

### 3. **Hooks** (Automated Actions)

Hooks run automatically in response to events like file edits or shell executions.

**Current Status**: Disabled for stability
**File**: `.cursor/hooks.json`

#### Why Hooks Are Disabled:
- The original `prettier` hook might fail if Prettier isn't installed globally
- The `beforeShellExecution` hook format might not work as intended
- Empty hooks prevent errors while maintaining the configuration structure

#### How to Enable Hooks (Optional):

**For Prettier Formatting After Edits:**
1. Install Prettier globally:
   ```bash
   npm install -g prettier
   # or
   pnpm add -g prettier
   ```

2. Create a Prettier config (`.prettierrc`):
   ```json
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2
   }
   ```

3. Update `.cursor/hooks.json`:
   ```json
   {
     "version": 1,
     "hooks": {
       "afterFileEdit": [
         {
           "command": "prettier",
           "args": ["--write", "$FILE"],
           "description": "Format code with Prettier after edits"
         }
       ],
       "beforeShellExecution": []
     }
   }
   ```

**For Git Hooks:**
You can also add Git hooks to prevent dangerous operations:
```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [],
    "beforeShellExecution": [
      {
        "command": "bash",
        "args": ["-c", "if [[ \"$COMMAND\" == *\"push --force\"* ]]; then echo '{\"allow\": false, \"reason\": \"Force push not allowed\"}'; else echo '{\"allow\": true}'; fi"],
        "description": "Prevent force push to protected branches"
      }
    ]
  }
}
```

---

## 🚀 Step-by-Step Usage Guide

### Scenario 1: Creating a New API Route

**Goal**: Create a new API endpoint for user preferences

**Steps:**
1. Open Cursor chat (Cmd+K / Ctrl+K)
2. Type: `/create-api-route`
3. Add details:
   ```
   /create-api-route
   Create GET and PATCH endpoints at /api/users/preferences
   - GET: Return user preferences
   - PATCH: Update preferences with Zod validation
   - Protected with withAuth middleware
   - MongoDB operations
   ```
4. Cursor generates the complete route file
5. Review the generated code
6. Save to `app/api/users/preferences/route.ts`

**What Cursor includes automatically** (thanks to rules):
- Proper imports (NextRequest, NextResponse, withAuth)
- Zod validation schema
- Error handling with try-catch
- Correct response format
- TypeScript types

---

### Scenario 2: Creating a React Component

**Goal**: Create a notification badge component

**Steps:**
1. Open Cursor chat (Cmd+K / Ctrl+K)
2. Type:
   ```
   /create-component
   Create NotificationBadge component that:
   - Shows unread notification count
   - Appears red when count > 0
   - Uses Tailwind CSS
   - Client component with click handler
   ```
3. Cursor generates the component
4. Save to `components/NotificationBadge.tsx`

**What Cursor includes automatically** (thanks to rules):
- `"use client"` directive (since it has a click handler)
- TypeScript prop interface
- Tailwind CSS classes
- Proper component structure

---

### Scenario 3: Debugging an Issue

**Goal**: Fix a 401 error on a protected route

**Steps:**
1. Open Cursor chat (Cmd+K / Ctrl+K)
2. Type:
   ```
   /debug-issue
   Getting 401 Unauthorized error on /api/protected/me
   even with a valid JWT token in cookies
   ```
3. Cursor walks through systematic debugging:
   - Check JWT middleware implementation
   - Verify cookie settings (httpOnly, secure)
   - Test token expiration
   - Review MongoDB connection
4. Suggests specific fixes with code examples
5. Provides test commands to verify the fix

---

### Scenario 4: Code Review Before Commit

**Goal**: Review changes for security and best practices

**Steps:**
1. Make your code changes
2. Open Cursor chat (Cmd+K / Ctrl+K)
3. Type:
   ```
   /review-code
   Review all changes in app/api/auth/ folder
   Focus on security vulnerabilities and authentication flow
   ```
4. Cursor performs comprehensive review:
   - Type safety
   - Error handling
   - Security (XSS, CSRF, SQL injection)
   - Input validation
   - Best practices
5. Provides detailed feedback with severity levels
6. Suggests specific fixes

---

### Scenario 5: Adding Test Specifications

**Goal**: Create test specs for a new feature

**Steps:**
1. Open Cursor chat (Cmd+K / Ctrl+K)
2. Type:
   ```
   /add-tests
   Create comprehensive test specs for VIP-10305 (Reject Content with Notes)
   Include positive flow, validation, security, and accessibility tests
   ```
3. Cursor generates Gherkin scenarios:
   - Positive flow tests
   - Validation tests
   - Security tests (XSS, CSRF)
   - API tests (status codes)
   - Accessibility tests (WCAG)
4. Save to `.stories/E3-Content-Generation-(AI)/.tests/VIP-10305-test.md`

---

## 💡 Pro Tips

### 1. **Reference Rules Explicitly**
Even though rules auto-apply, you can reference them explicitly:
```
Following the Next.js stack guidelines, create an API route for...
```

### 2. **Combine Commands with Context**
Provide file references for better results:
```
/create-component
Based on the pattern in components/UserCard.tsx,
create a similar SourceCard component
```

### 3. **Use Commands in Sequence**
For complete features:
```
1. /create-api-route [create backend]
2. /create-component [create frontend]
3. /add-tests [add test specs]
4. /review-code [review everything]
```

### 4. **Reference User Stories**
Link to story files for complete context:
```
/create-api-route
Implement the API for VIP-10204 topic-based content generation
(see .stories/E3-Content-Generation-(AI)/VIP-10204.md)
```

### 5. **Iterative Development**
Start broad, then refine:
```
1. "Create a user dashboard component"
2. [Review generated code]
3. "Add real-time updates using WebSockets"
4. [Review again]
5. "Add loading states and error handling"
```

---

## 🔍 Troubleshooting

### Issue: Commands Don't Show Up

**Solution:**
1. Verify `.cursor/commands/*.md` files exist
2. Restart Cursor (close and reopen)
3. Try typing `/` slowly in chat
4. Check file permissions (should be readable)

### Issue: Rules Don't Apply

**Solution:**
1. Verify the file you're editing matches the glob pattern:
   - Next.js rule: `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, etc.
   - FastAPI rule: `api-service/**/*.py`
2. Rules only apply to Agent (chat), not inline edits
3. Check `alwaysApply: true` is set in rule frontmatter
4. Try explicitly mentioning: "Following the Next.js stack guidelines..."

### Issue: Hooks Fail or Cause Errors

**Solution:**
1. Check if the command in hooks.json is installed and accessible
2. Test the command manually in terminal
3. If issues persist, disable hooks by setting them to empty arrays:
   ```json
   {
     "version": 1,
     "hooks": {
       "afterFileEdit": [],
       "beforeShellExecution": []
     }
   }
   ```

### Issue: Cursor Doesn't Understand Project Context

**Solution:**
1. Explicitly mention the tech stack:
   - "In Next.js, create..."
   - "In FastAPI, add..."
2. Reference specific files:
   - "Based on app/api/auth/register/route.ts..."
3. Link to user stories:
   - "Implement VIP-10204 (see .stories/E3...)"
4. Use commands that already have context built-in

---

## 🧪 Testing Your Configuration

### Test 1: Verify Rules Work

1. Open `app/api/auth/register/route.ts`
2. Start Cursor chat (Cmd+K / Ctrl+K)
3. Ask: "What coding standards should I follow for this file?"
4. ✅ Expected: Cursor mentions Next.js 16, TypeScript, Zod validation, etc.

### Test 2: Verify Commands Work

1. Open Cursor chat (Cmd+K / Ctrl+K)
2. Type `/`
3. ✅ Expected: You see a list of 6 commands

### Test 3: Verify Next.js Rule Applies

1. Open `components/ui/button.tsx`
2. Start Cursor chat (Cmd+K / Ctrl+K)
3. Ask: "How should I style this component?"
4. ✅ Expected: Cursor mentions Tailwind CSS, utility classes, CSS variables

### Test 4: Verify FastAPI Rule Applies

1. Open `api-service/main.py`
2. Start Cursor chat (Cmd+K / Ctrl+K)
3. Ask: "How should I create a new endpoint?"
4. ✅ Expected: Cursor mentions Pydantic models, async/await, Ollama integration

### Test 5: Use a Command

1. Open Cursor chat (Cmd+K / Ctrl+K)
2. Type: `/review-code Review app/api/auth/register/route.ts`
3. ✅ Expected: Cursor performs comprehensive review with security checks

---

## 📚 Additional Resources

### Documentation Files
- **`.cursor/README.md`** - Comprehensive documentation (all details)
- **`.cursor/QUICK-START.md`** - Quick reference guide
- **`.cursor/SETUP-GUIDE.md`** - This file
- **`CLAUDE.md`** - Full project context for AI
- **`DEPLOYMENT.md`** - Deployment guide

### Official Cursor Docs
- [Cursor Rules](https://docs.cursor.com/context/rules)
- [Cursor Commands](https://docs.cursor.com/agent/chat/commands)
- [Cursor Hooks](https://docs.cursor.com/agent/hooks)

### Project Docs
- **`.stories/`** - User stories and requirements
- **`README.md`** - Project overview
- **`api-service/README.md`** - FastAPI service docs

---

## 🎓 Best Practices Summary

### ✅ DO
- Use commands for consistent code generation
- Reference rules explicitly when needed
- Review code before committing (`/review-code`)
- Follow tech stack conventions automatically applied by rules
- Add test specifications for new features (`/add-tests`)
- Use type hints/annotations everywhere
- Combine commands with specific context

### ❌ DON'T
- Mix Next.js and FastAPI responsibilities
- Use cloud LLM providers in FastAPI (Ollama only)
- Skip input validation
- Forget error handling
- Use relative imports (use `@/` path aliases)
- Commit without code review
- Ignore linter errors

---

## 🤝 Team Collaboration

This configuration is **version-controlled** to ensure:
- ✅ Consistent code style across team
- ✅ Standardized workflows
- ✅ Security best practices enforced
- ✅ New team members onboard quickly
- ✅ AI assistance follows project conventions

**When updating:**
1. Make changes to `.cursor/` files
2. Test changes locally
3. Commit changes
4. Notify team to pull latest
5. Team restarts Cursor to load new config

---

## 🎉 You're All Set!

Your Cursor AI configuration is properly set up and ready to use!

### Quick Start Checklist:
- [x] Rules configured (Next.js and FastAPI)
- [x] Commands available (6 slash commands)
- [x] Hooks configured (currently disabled for stability)
- [x] Documentation complete

### Next Steps:
1. **Test the configuration** using the tests above
2. **Try a command**: Open Cursor chat and type `/`
3. **Start coding**: Create a new feature using `/create-api-route`
4. **Get help**: Ask Cursor questions about your codebase

### Need Help?
- Read **`.cursor/README.md`** for comprehensive details
- Read **`.cursor/QUICK-START.md`** for quick reference
- Ask Cursor AI: "Explain the VIPContentAI architecture"
- Reference user stories in `.stories/` for requirements

---

**Happy Coding with Cursor AI!** 🚀

*Last Updated: 2025-01-15*
*Maintained by: VIPContentAI Team*

