import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, hasRole } from './get-user-from-request';
import { JWTPayload, UserRole } from '@/lib/types/user';

/**
 * Higher-order function to protect API routes with authentication
 * Supports both regular routes and dynamic routes with context parameter
 * @param handler - The route handler function
 * @param options - Optional configuration (required role)
 * @returns Protected route handler
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, user: JWTPayload, context?: T) => Promise<NextResponse>,
  options?: {
    requiredRole?: UserRole;
  }
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      // Extract user from request
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

      // Check role if required
      if (options?.requiredRole) {
        if (!hasRole(user, options.requiredRole)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Forbidden - Insufficient permissions',
            },
            { status: 403 }
          );
        }
      }

      // Call the actual handler with user context (and optional dynamic route context)
      return await handler(request, user, context);
    } catch (error) {
      console.error('Authentication middleware error:', error);

      return NextResponse.json(
        {
          success: false,
          message: 'Authentication error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware specifically for superadmin routes
 * Supports both regular routes and dynamic routes with context parameter
 */
export function withSuperadmin<T = any>(
  handler: (request: NextRequest, user: JWTPayload, context?: T) => Promise<NextResponse>
) {
  return withAuth<T>(handler, { requiredRole: 'superadmin' });
}
