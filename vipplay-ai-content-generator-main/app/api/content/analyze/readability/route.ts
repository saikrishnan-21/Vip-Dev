import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/content/analyze/readability
 * Analyze content for readability metrics
 * Proxies to FastAPI /api/generation/analyze/readability
 */
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content is required',
        },
        { status: 400 }
      );
    }

    // Call FastAPI readability analysis endpoint (no timeout - it's fast)
    const fastapiResponse = await fetch(`${FASTAPI_URL}/api/generation/analyze/readability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      }),
    });

    if (!fastapiResponse.ok) {
      const errorText = await fastapiResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `Readability analysis failed: ${errorText}`,
        },
        { status: fastapiResponse.status }
      );
    }

    const data = await fastapiResponse.json();

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('[Readability Analysis Error]', error);

    // Handle connection errors
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Readability analysis service unavailable',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze readability',
      },
      { status: 500 }
    );
  }
});

