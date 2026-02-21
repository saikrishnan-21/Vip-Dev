# Refactor Code

Refactor existing code to improve quality, maintainability, and performance while preserving functionality.

## Requirements

1. **Preserve functionality** - All existing behavior must work
2. **Improve code quality** - Better structure, readability, maintainability
3. **Add tests** - Ensure refactoring doesn't break anything
4. **Follow best practices** - Use project conventions
5. **Document changes** - Explain what was refactored and why

## Refactoring Checklist

### Code Quality
- [ ] Remove code duplication (DRY principle)
- [ ] Simplify complex functions (Single Responsibility)
- [ ] Improve variable/function names
- [ ] Add missing type annotations
- [ ] Remove unused code
- [ ] Extract reusable logic into utilities

### Performance
- [ ] Optimize database queries
- [ ] Add caching where appropriate
- [ ] Remove unnecessary re-renders (React)
- [ ] Use async/await for I/O operations
- [ ] Batch operations when possible

### Maintainability
- [ ] Break large functions into smaller ones
- [ ] Extract constants and configuration
- [ ] Add comments for complex logic
- [ ] Improve error handling
- [ ] Add proper logging

### Type Safety
- [ ] Add missing TypeScript types
- [ ] Add Python type hints
- [ ] Use strict typing
- [ ] Define interfaces/models
- [ ] Remove `any` types

## Common Refactoring Patterns

### 1. Extract Function
```typescript
// Before
function processUser(user: User) {
  // 50 lines of code
  const validated = validateEmail(user.email);
  const normalized = normalizePhone(user.phone);
  const hashed = hashPassword(user.password);
  // ... more logic
}

// After
function processUser(user: User) {
  const validatedUser = validateUserData(user);
  const normalizedUser = normalizeUserData(validatedUser);
  return createUserRecord(normalizedUser);
}
```

### 2. Extract Component
```tsx
// Before
function Dashboard() {
  return (
    <div>
      {/* 200 lines of JSX */}
    </div>
  );
}

// After
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardStats />
      <DashboardContent />
      <DashboardFooter />
    </div>
  );
}
```

### 3. Use Dependency Injection
```python
# Before
def generate_content(topic: str):
    ollama = OllamaService("http://localhost:11434")  # Hardcoded
    return ollama.generate(topic)

# After
def generate_content(
    topic: str,
    ollama: Annotated[OllamaService, Depends(get_ollama_service)]
):
    return ollama.generate(topic)
```

### 4. Extract Configuration
```typescript
// Before
const response = await fetch("http://localhost:8000/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" }
});

// After
const API_CONFIG = {
  baseUrl: process.env.FASTAPI_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
};

const response = await apiClient.post("/api/generate", data);
```

## Usage Example

```
/refactor-code
Refactor app/api/auth/register/route.ts to:
- Extract validation logic
- Improve error handling
- Add proper logging
- Simplify nested logic
```

## What to Include

1. **Analysis**: What needs refactoring and why
2. **Changes**: Detailed explanation of each change
3. **Code**: Refactored code with improvements
4. **Tests**: Ensure nothing broke
5. **Summary**: List of improvements made

## Safety Guidelines

- ✅ Run tests before and after
- ✅ Refactor in small steps
- ✅ Keep commits atomic
- ✅ Review changes carefully
- ✅ Document breaking changes
- ❌ Don't change functionality
- ❌ Don't skip testing
- ❌ Don't refactor everything at once

