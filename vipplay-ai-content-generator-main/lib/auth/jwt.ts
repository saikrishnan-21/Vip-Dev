import jwt from 'jsonwebtoken';
import { JWTPayload } from '@/lib/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';
const JWT_ALGORITHM = (process.env.JWT_ALGORITHM as jwt.Algorithm) || 'HS256';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: JWT_EXPIRES_IN,
  });
}

// Verify and decode JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Decode JWT token without verification (useful for debugging)
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
}
