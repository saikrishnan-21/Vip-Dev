# Create API Route

Create a new Next.js API route with proper structure, authentication, validation, and error handling.

## Requirements

1. **Route Location**: Create in `app/api/[path]/route.ts`
2. **HTTP Methods**: Implement GET, POST, PATCH, PUT, or DELETE as needed
3. **Authentication**: Use `withAuth` or `withSuperadmin` middleware if protected
4. **Validation**: Use Zod schema for request validation
5. **Error Handling**: Wrap in try-catch, return proper status codes
6. **Response Format**: Return `{ success: boolean, data?: any, error?: string }`
7. **Types**: Create TypeScript interfaces for request/response
8. **Database**: Use MongoDB singleton from `@/lib/mongodb`

## Template Structure

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { db } from '@/lib/mongodb';
import { z } from 'zod';

// Validation schema
const requestSchema = z.object({
  // Define fields
});

// GET handler
async function getHandler(req: NextRequest, context: { userId: string }) {
  try {
    const { userId } = context;
    // Implementation
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST handler
async function postHandler(req: NextRequest, context: { userId: string }) {
  try {
    const body = await req.json();
    const validated = requestSchema.parse(body);

    // Implementation
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Export with middleware
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
```

## What to Include

- Import statements for Next.js, auth middleware, database, Zod
- Request/response type interfaces
- Zod validation schema
- Proper error handling (400, 401, 403, 404, 500)
- Database operations with proper error catching
- Success/error response format
- Comments explaining business logic
