import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user-from-request';

export async function POST(request: NextRequest) {
  try {
    // Require authentication for logout endpoint
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized - Invalid or missing token',
        },
        { status: 401 }
      );
    }

    // In a stateless JWT system, logout is primarily handled client-side
    // by removing the token from storage. This endpoint exists for:
    // 1. Consistency with REST API patterns
    // 2. Future token blacklisting implementation
    // 3. Logging purposes

    // TODO: Future enhancement - Add token to blacklist/revocation list
    // This could be implemented with Redis or MongoDB with TTL
    // Example: await addToBlacklist(token, expiryTime);

    console.log(`User ${user.email} logged out, token should be removed client-side`);

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Logout failed',
      },
      { status: 500 }
    );
  }
}
