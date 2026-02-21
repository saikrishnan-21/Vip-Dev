import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { JWTPayload } from '@/lib/types/user';

/**
 * Extract and verify JWT token from request headers
 * @param request - Next.js request object
 * @returns JWT payload or null if invalid/missing
 */
export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  try {
    // Get token from Authorization header (Next.js headers.get() is case-insensitive)
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return null;
    }

    // Check for Bearer prefix (case-insensitive)
    const bearerPrefix = 'Bearer ';
    if (!authHeader.startsWith(bearerPrefix) && !authHeader.toLowerCase().startsWith('bearer ')) {
      return null;
    }

    // Extract token (handle both 'Bearer ' and 'bearer ' prefixes)
    const token = authHeader.substring(authHeader.indexOf(' ') + 1).trim();

    if (!token) {
      return null;
    }

    // Verify and decode token
    const payload = verifyToken(token);

    return payload;
  } catch (error) {
    console.error('Error extracting user from request:', error);
    return null;
  }
}

/**
 * Check if user has required role
 * @param payload - JWT payload
 * @param requiredRole - Role to check ('user' or 'superadmin')
 * @returns true if user has required role
 */
export function hasRole(payload: JWTPayload, requiredRole: 'user' | 'superadmin'): boolean {
  if (requiredRole === 'user') {
    // Both 'user' and 'superadmin' can access 'user' level resources
    return payload.role === 'user' || payload.role === 'superadmin';
  }

  // Only 'superadmin' can access 'superadmin' level resources
  return payload.role === 'superadmin';
}
