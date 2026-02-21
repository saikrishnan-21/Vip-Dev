/**
 * Ollama Models Management API Route (Superadmin)
 * VIP-10501: List Ollama Models
 * VIP-10502: Pull New Ollama Models
 * VIP-10503: Test Model Connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * GET /api/admin/ai/models - List all Ollama models
 * Requires: superadmin role
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check superadmin role
    if (payload.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden. Superadmin access required.' },
        { status: 403 }
      );
    }

    // Call FastAPI service to list models
    const response = await fetch(`${FASTAPI_URL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`FastAPI service error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      models: data.models || [],
      count: data.models?.length || 0,
      fastapiUrl: FASTAPI_URL
    });

  } catch (error: any) {
    console.error('List models error:', error);
    return NextResponse.json(
      { error: 'Failed to list models', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai/models - Pull a new Ollama model
 * Body: { model: string }
 * Requires: superadmin role
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check superadmin role
    if (payload.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden. Superadmin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { model } = body;

    if (!model) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      );
    }

    // Validate model name format
    const validModelPattern = /^[\w\-\.]+:[\w\-\.]+$|^[\w\-\.]+$/;
    if (!validModelPattern.test(model)) {
      return NextResponse.json(
        { error: 'Invalid model name format' },
        { status: 400 }
      );
    }

    // Call FastAPI service to pull model
    const response = await fetch(`${FASTAPI_URL}/models/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`FastAPI service error: ${errorData.detail || response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 202 });

  } catch (error: any) {
    console.error('Pull model error:', error);
    return NextResponse.json(
      { error: 'Failed to pull model', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ai/models - Delete an Ollama model
 * Query param: model
 * Requires: superadmin role
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check superadmin role
    if (payload.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden. Superadmin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const model = searchParams.get('model');

    if (!model) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      );
    }

    // Note: Model deletion should be done directly via Ollama CLI or API
    // FastAPI service doesn't expose delete endpoint for security reasons
    // This endpoint is kept for API compatibility but returns a message
    return NextResponse.json({
      message: `Model deletion should be performed directly via Ollama CLI: ollama rm ${model}`,
      model,
      note: 'Use Ollama CLI for model deletion'
    }, { status: 501 });

  } catch (error: any) {
    console.error('Delete model error:', error);
    return NextResponse.json(
      { error: 'Failed to delete model', details: error.message },
      { status: 500 }
    );
  }
}
