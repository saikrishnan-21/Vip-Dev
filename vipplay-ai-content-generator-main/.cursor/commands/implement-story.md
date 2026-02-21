# Implement User Story

Implement a complete user story with all necessary components, API routes, tests, and documentation.

## Requirements

1. **Read the story file** from `.stories/[Epic]/[VIP-ID].md`
2. **Create all necessary files**:
   - API routes (Next.js or FastAPI)
   - React components (if needed)
   - Database schemas/models
   - Test specifications
3. **Follow acceptance criteria** exactly
4. **Include error handling** and edge cases
5. **Add logging** where appropriate

## Implementation Steps

### Step 1: Analyze the Story
- Read `.stories/[Epic]/[VIP-ID].md`
- Understand acceptance criteria
- Identify required components
- Note technical requirements

### Step 2: Plan Implementation
- List files to create/modify
- Identify dependencies
- Plan database changes
- Consider error cases

### Step 3: Backend Implementation
```typescript
// Next.js API Route
app/api/[route]/route.ts
- Create API route with withAuth middleware
- Add Zod validation
- Implement business logic
- Handle errors

// Or FastAPI Endpoint
api-service/routers/[module].py
- Create router with Pydantic models
- Implement async handlers
- Add error handling
```

### Step 4: Frontend Implementation (if needed)
```typescript
// React Components
components/[ComponentName].tsx
- Create component with TypeScript
- Add proper client/server directive
- Style with Tailwind CSS
- Handle loading and error states
```

### Step 5: Add Tests
```markdown
.stories/[Epic]/.tests/[VIP-ID]-test.md
- Positive flow tests
- Validation tests
- Security tests
- API tests
- Accessibility tests
```

### Step 6: Review Checklist
- [ ] All acceptance criteria met
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Tests documented
- [ ] Logging added
- [ ] Type-safe code
- [ ] Security considered
- [ ] Documentation updated

## Usage Example

```
/implement-story
Implement VIP-10204 topic-based content generation
(see .stories/E3-Content-Generation-(AI)/VIP-10204.md)
```

## What to Generate

1. **API Routes**: Complete route files with auth, validation, error handling
2. **Components**: React components with TypeScript and Tailwind
3. **Models**: Pydantic models or TypeScript interfaces
4. **Tests**: Comprehensive test specifications
5. **Documentation**: Update relevant docs
6. **Summary**: Implementation summary with files created

## Best Practices

- Follow project tech stack guidelines
- Use path aliases (`@/`)
- Add proper logging
- Handle all error cases
- Write comprehensive tests
- Document complex logic
- Consider accessibility
- Optimize for performance

