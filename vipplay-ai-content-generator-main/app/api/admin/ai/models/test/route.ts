/**
 * Model Testing API Route (Superadmin)
 * VIP-10503: Test Model Connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import type { ModelTestResult } from '@/lib/types/ai-config';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/admin/ai/models/test - Test a model connection and response
 * Body: { model: string, prompt?: string }
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
    const { model, prompt = 'Hello, respond with "OK" if you can read this.' } = body;

    if (!model) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      );
    }

    try {
      // Call FastAPI service to test model
      const response = await fetch(`${FASTAPI_URL}/models/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        const testResult: ModelTestResult = {
          model,
          success: false,
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
          testedAt: new Date()
        };

        return NextResponse.json({
          message: 'Model test failed',
          result: testResult
        }, { status: 200 });
      }

      const data = await response.json();
      
      // FastAPI returns result with testedAt as timestamp, convert to Date
      const result = data.result;
      if (result.testedAt) {
        result.testedAt = new Date(result.testedAt * 1000); // Convert Unix timestamp to Date
      }

      return NextResponse.json(data);

    } catch (testError: any) {
      const testResult: ModelTestResult = {
        model,
        success: false,
        responseTime: 0,
        error: testError.message,
        testedAt: new Date()
      };

      return NextResponse.json({
        message: 'Model test failed',
        result: testResult
      }, { status: 200 });
    }

  } catch (error: any) {
    console.error('Model test error:', error);
    return NextResponse.json(
      { error: 'Failed to test model', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai/models/test/batch - Test multiple models
 * Body: { models: string[], prompt?: string }
 * Requires: superadmin role
 */
export async function PUT(request: NextRequest) {
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
    const { models, prompt = 'Hello, respond with "OK" if you can read this.' } = body;

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'Models array is required' },
        { status: 400 }
      );
    }

    // Test all models in parallel via FastAPI
    const testPromises = models.map(async (model) => {
      try {
        const response = await fetch(`${FASTAPI_URL}/models/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            prompt
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: response.statusText }));
          return {
            model,
            success: false,
            responseTime: 0,
            error: errorData.detail || `HTTP ${response.status}`,
            testedAt: new Date()
          } as ModelTestResult;
        }

        const data = await response.json();
        const result = data.result;
        
        // Convert timestamp to Date if present
        if (result.testedAt && typeof result.testedAt === 'number') {
          result.testedAt = new Date(result.testedAt * 1000);
        }

        return result as ModelTestResult;

      } catch (testError: any) {
        return {
          model,
          success: false,
          responseTime: 0,
          error: testError.message,
          testedAt: new Date()
        } as ModelTestResult;
      }
    });

    const results = await Promise.all(testPromises);

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgResponseTime: results
        .filter(r => r.success && r.responseTime)
        .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.filter(r => r.success).length || 0
    };

    return NextResponse.json({
      message: 'Batch model test completed',
      summary,
      results
    });

  } catch (error: any) {
    console.error('Batch model test error:', error);
    return NextResponse.json(
      { error: 'Failed to test models', details: error.message },
      { status: 500 }
    );
  }
}
