# Code Review

Perform a comprehensive code review focusing on quality, security, and best practices for the VIPContentAI project.

## Review Checklist

### TypeScript/JavaScript (Next.js)
- [ ] **Type Safety**: All functions have explicit type annotations
- [ ] **Async Patterns**: Using async/await correctly, no blocking operations
- [ ] **Error Handling**: Try-catch blocks in API routes, proper error responses
- [ ] **Path Aliases**: Using `@/` imports instead of relative paths
- [ ] **Client Directives**: `"use client"` only when necessary (hooks/events)
- [ ] **API Routes**: Following Next.js 16 App Router conventions
- [ ] **Zod Validation**: Request validation in all API endpoints
- [ ] **Authentication**: Proper use of `withAuth` or `withSuperadmin` middleware
- [ ] **Database**: Using MongoDB singleton, proper error handling
- [ ] **Response Format**: Consistent `{ success, data, error }` structure

### Python (FastAPI)
- [ ] **Type Hints**: All functions have complete type annotations
- [ ] **Async Functions**: Using `async def` for I/O operations
- [ ] **Pydantic Models**: Request/response validation with Pydantic v2
- [ ] **Error Handling**: HTTPException with appropriate status codes
- [ ] **Ollama Only**: No cloud LLM providers (OpenAI, Anthropic, etc.)
- [ ] **CrewAI**: Proper agent and task definitions
- [ ] **Dependencies**: Using FastAPI dependency injection
- [ ] **PEP 8**: Following Python style guide (line length, naming)

### Security
- [ ] **Input Validation**: All user input validated (Zod/Pydantic)
- [ ] **SQL Injection**: Using parameterized queries (MongoDB prevents by default)
- [ ] **XSS Prevention**: Proper sanitization of user content
- [ ] **CSRF Protection**: CSRF tokens for state-changing operations
- [ ] **Authentication**: JWT validation on protected routes
- [ ] **Password Hashing**: bcrypt with 12 rounds minimum
- [ ] **Secrets**: No hardcoded API keys or passwords
- [ ] **Rate Limiting**: Applied to sensitive endpoints

### Performance
- [ ] **Database Queries**: Optimized queries, proper indexes
- [ ] **Caching**: Using appropriate caching strategies
- [ ] **Bundle Size**: No unnecessary dependencies
- [ ] **Async Operations**: Non-blocking I/O operations
- [ ] **N+1 Queries**: Avoiding repeated database calls

### Code Quality
- [ ] **DRY Principle**: No code duplication
- [ ] **Single Responsibility**: Functions do one thing well
- [ ] **Naming**: Clear, descriptive names for variables/functions
- [ ] **Comments**: Complex logic explained with comments
- [ ] **Error Messages**: User-friendly error messages
- [ ] **Logging**: Appropriate logging for debugging
- [ ] **Test Coverage**: Test specifications in `.stories/.tests/`

### Accessibility
- [ ] **Semantic HTML**: Using proper HTML elements
- [ ] **Keyboard Navigation**: All interactive elements accessible via keyboard
- [ ] **ARIA Labels**: Proper aria-label and aria-describedby attributes
- [ ] **Color Contrast**: Sufficient contrast for text readability
- [ ] **Focus Indicators**: Visible focus states for interactive elements

## Review Questions

1. **Does this code follow the project's architecture?**
   - Next.js: Backend API + frontend rendering
   - FastAPI: AI operations only (no auth, no database)

2. **Is error handling comprehensive?**
   - Try-catch blocks
   - Proper status codes
   - User-friendly error messages

3. **Are there potential security vulnerabilities?**
   - XSS, CSRF, SQL injection
   - Authentication/authorization
   - Input validation

4. **Is the code testable?**
   - Clear separation of concerns
   - No hard dependencies
   - Test scenarios documented

5. **Does it follow best practices?**
   - TypeScript/Python conventions
   - Framework-specific patterns (Next.js 16, FastAPI)
   - No anti-patterns

## What to Look For

### Red Flags 🚩
- Missing type annotations
- No error handling
- Hardcoded secrets
- Synchronous I/O operations
- SQL/XSS vulnerabilities
- Missing authentication
- No input validation
- Relative import paths
- Cloud LLM providers in FastAPI

### Green Flags ✅
- Comprehensive type safety
- Proper async/await usage
- Zod/Pydantic validation
- Error handling with proper status codes
- Secure authentication flow
- Path aliases (`@/`)
- Ollama local models only
- Test specifications included
- Clear, commented code

## Review Output Format

Provide feedback in this format:

**Issues Found:**
1. [Severity] [Issue] - [Explanation]
   - File: [file path]
   - Line: [line number]
   - Fix: [suggested fix]

**Suggestions:**
- [Improvement suggestion]

**Strengths:**
- [What's done well]

**Overall Assessment:**
- Security: [Pass/Fail]
- Code Quality: [Grade A-F]
- Best Practices: [Pass/Fail]
- Ready to Merge: [Yes/No]
