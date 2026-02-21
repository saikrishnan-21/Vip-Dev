# Debug Issue

Systematically debug and fix an issue in the VIPContentAI codebase.

## Debugging Process

### 1. Understand the Problem
- What is the expected behavior?
- What is the actual behavior?
- When did this start happening?
- Can you reproduce it consistently?
- What are the error messages (if any)?

### 2. Gather Information

#### For Next.js Issues
- Check browser console for errors
- Check Next.js dev server terminal output
- Review Network tab for failed requests
- Check relevant API route logs
- Verify MongoDB connection

#### For FastAPI Issues
- Check FastAPI server terminal output
- Review `/docs` endpoint for API schema
- Verify Ollama service is running (`http://localhost:11434`)
- Check CrewAI agent logs
- Test endpoints directly with curl/Postman

### 3. Locate the Issue

#### Common Next.js Issues
1. **Hydration Errors**
   - Mismatch between server and client rendering
   - Fix: Ensure consistent rendering, use `mounted` state

2. **API Route Errors**
   - Check `app/api/[route]/route.ts`
   - Verify authentication middleware
   - Check MongoDB connection
   - Review request/response format

3. **Build Errors**
   - TypeScript type errors
   - Missing dependencies
   - Environment variables not set

4. **Authentication Issues**
   - JWT token expiration
   - Cookie settings (httpOnly, secure)
   - Middleware not applied

#### Common FastAPI Issues
1. **Ollama Connection**
   - Is Ollama running? `curl http://localhost:11434/api/tags`
   - Check `OLLAMA_URL` environment variable
   - Verify model is pulled: `ollama list`

2. **Pydantic Validation**
   - Check request schema matches endpoint
   - Review validation error details
   - Verify Pydantic v2 syntax

3. **CrewAI Errors**
   - Agent/task configuration errors
   - LLM timeout issues
   - Missing context between tasks

4. **CORS Issues**
   - Check CORS middleware configuration
   - Verify Next.js origin is allowed

### 4. Test Hypothesis

#### Isolate the Problem
- Comment out sections to narrow down
- Add console.log/print statements
- Test with minimal reproducible case
- Check with different inputs

#### Verify Dependencies
```bash
# Next.js
pnpm install
pnpm build

# FastAPI
pip install -r requirements.txt
ollama list  # Verify models
```

### 5. Fix the Issue

#### Code Changes
- Make minimal, focused changes
- Follow project conventions
- Add error handling if missing
- Update types if necessary

#### Add Safeguards
```typescript
// Next.js: Add validation
const validated = schema.safeParse(data);
if (!validated.success) {
  return NextResponse.json(
    { success: false, error: validated.error },
    { status: 400 }
  );
}

// Add error handling
try {
  // risky operation
} catch (error) {
  console.error('[MODULE_NAME]', error);
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}
```

```python
# FastAPI: Add validation
try:
    result = await service.operation()
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Operation failed: {str(e)}")
```

### 6. Verify the Fix

#### Test Cases
- [ ] Original issue is resolved
- [ ] No regression (other features still work)
- [ ] Error handling is comprehensive
- [ ] Edge cases are handled
- [ ] Performance is acceptable

#### Manual Testing
```bash
# Next.js
pnpm dev
# Test in browser

# FastAPI
uvicorn main:app --reload
# Test with curl or in /docs
```

### 7. Document the Fix

Add comments explaining:
- What the issue was
- Why the fix works
- Any edge cases to be aware of

Update test specifications if needed:
- Add test scenario for the bug
- Ensure it's covered in `.stories/.tests/`

## Common Debugging Tools

### Next.js
```typescript
// Server-side logging
console.log('[API]', variable);

// Client-side logging
console.log('[CLIENT]', state);

// Network inspection
// Open DevTools → Network tab

// React DevTools
// Inspect component props and state
```

### FastAPI
```python
# Logging
import logging
logger = logging.getLogger(__name__)
logger.info(f"Processing: {data}")

# Print debugging
print(f"DEBUG: {variable}")

# Pydantic error details
from pydantic import ValidationError
try:
    validated = Model.model_validate(data)
except ValidationError as e:
    print(e.errors())
```

### Ollama
```bash
# Check service status
curl http://localhost:11434/api/tags

# Test model
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Test",
  "stream": false
}'

# View logs
ollama logs
```

## Issue Patterns

### Pattern: "Module not found"
- **Cause**: Missing dependency or wrong import path
- **Fix**: Install package or use correct path alias

### Pattern: "Cannot read property of undefined"
- **Cause**: Accessing nested property before checking existence
- **Fix**: Use optional chaining (`obj?.prop`) or null checks

### Pattern: "Hydration error"
- **Cause**: Server/client render mismatch
- **Fix**: Use `useEffect` for client-only code, ensure consistent rendering

### Pattern: "CORS error"
- **Cause**: API doesn't allow origin
- **Fix**: Add origin to CORS configuration

### Pattern: "Validation error"
- **Cause**: Request doesn't match schema
- **Fix**: Check request format, update schema, or fix client code

## Debugging Checklist

- [ ] Read and understand error message
- [ ] Check relevant logs (terminal, browser console)
- [ ] Verify services are running (Next.js, FastAPI, Ollama, MongoDB)
- [ ] Test with minimal reproduction
- [ ] Isolate the problematic code section
- [ ] Check for typos and syntax errors
- [ ] Verify environment variables are set
- [ ] Review recent changes (git diff)
- [ ] Check dependencies are installed
- [ ] Test with different inputs
- [ ] Add logging/print statements
- [ ] Review documentation for APIs used
- [ ] Ask: "What changed since it last worked?"
