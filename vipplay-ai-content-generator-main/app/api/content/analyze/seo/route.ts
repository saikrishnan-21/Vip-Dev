import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/content/analyze/seo
 * Analyze content for SEO metrics
 * Proxies to FastAPI /api/generation/analyze/seo
 */
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { content, title, keywords } = body;

    if (!content || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content and title are required',
        },
        { status: 400 }
      );
    }

    // Call FastAPI SEO analysis endpoint (no timeout - it's fast)
    const fastapiResponse = await fetch(`${FASTAPI_URL}/api/generation/analyze/seo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        title,
        keywords: keywords || [],
      }),
    });

    if (!fastapiResponse.ok) {
      const errorText = await fastapiResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `SEO analysis failed: ${errorText}`,
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
    console.error('[SEO Analysis Error]', error);

    // Handle connection errors
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'SEO analysis service unavailable',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze SEO',
      },
      { status: 500 }
    );
  }
});

