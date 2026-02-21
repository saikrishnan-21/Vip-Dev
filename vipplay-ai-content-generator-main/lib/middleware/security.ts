/**
 * Security Middleware
 * VIP-10704: Security Hardening
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting store (in-memory, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
}): (req: NextRequest) => NextResponse | null {
  return (req: NextRequest) => {
    if (process.env.RATE_LIMIT_ENABLED === 'false') {
      return null;
    }

    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    let record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
      // Create new record
      record = {
        count: 1,
        resetTime: now + options.windowMs
      };
      rateLimitStore.set(ip, record);
      return null;
    }

    if (record.count >= options.maxRequests) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds`
        },
        { status: 429 }
      );
    }

    record.count++;
    return null;
  };
}

/**
 * CORS middleware
 */
export function cors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get('origin');
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  }

  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Max-Age', '86400');

  return res;
}

/**
 * Security headers middleware
 */
export function securityHeaders(res: NextResponse): NextResponse {
  // Prevent clickjacking
  res.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  // Permissions Policy
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return res;
}

/**
 * Input sanitization
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate request payload size
 */
export function validatePayloadSize(req: NextRequest, maxSize: number = 10 * 1024 * 1024): NextResponse | null {
  const contentLength = req.headers.get('content-length');

  if (contentLength && parseInt(contentLength) > maxSize) {
    return NextResponse.json(
      {
        error: 'Payload too large',
        message: `Maximum payload size is ${maxSize / 1024 / 1024}MB`
      },
      { status: 413 }
    );
  }

  return null;
}

/**
 * API key validation (for service-to-service communication)
 */
export function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key');
  const validApiKeys = process.env.API_KEYS?.split(',') || [];

  return validApiKeys.length === 0 || (!!apiKey && validApiKeys.includes(apiKey));
}

/**
 * SQL injection prevention patterns
 */
const SQL_INJECTION_PATTERNS = [
  /(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute)(\s|$)/i,
  /(\s|^)(or|and)(\s+)[\w\d]+(\s*)=(\s*)[\w\d]+/i,
  /-{2,}/,
  /\/\*/,
  /\*\//,
  /;/
];

/**
 * Check for SQL injection attempts
 */
export function hasSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for XSS attempts
 */
export function hasXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
