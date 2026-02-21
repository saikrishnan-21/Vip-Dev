/**
 * Individual AI Configuration Management API Route (Superadmin)
 * VIP-10507: Superadmin Access Control
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { AIConfiguration } from '@/lib/types/ai-config';

/**
 * GET /api/admin/ai/config/[configId] - Get single configuration
 * Requires: superadmin role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
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

    const { configId } = params;

    if (!ObjectId.isValid(configId)) {
      return NextResponse.json({ error: 'Invalid config ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<AIConfiguration>('ai_configurations');

    const config = await collection.findOne({
      _id: new ObjectId(configId)
    });

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json({ configuration: config });

  } catch (error: any) {
    console.error('Get configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ai/config/[configId] - Update configuration
 * Body: { value?, description?, isActive? }
 * Requires: superadmin role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
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

    const { configId } = params;

    if (!ObjectId.isValid(configId)) {
      return NextResponse.json({ error: 'Invalid config ID' }, { status: 400 });
    }

    const body = await request.json();
    const { value, description, isActive } = body;

    const db = await getDatabase();
    const collection = db.collection<AIConfiguration>('ai_configurations');

    // Build update object
    const updateFields: any = {
      updatedAt: new Date()
    };

    if (value !== undefined) updateFields.value = value;
    if (description !== undefined) updateFields.description = description;
    if (isActive !== undefined) updateFields.isActive = isActive;

    // Update configuration
    const result = await collection.updateOne(
      { _id: new ObjectId(configId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes made' },
        { status: 400 }
      );
    }

    // Fetch updated configuration
    const updatedConfig = await collection.findOne({
      _id: new ObjectId(configId)
    });

    return NextResponse.json({
      message: 'Configuration updated successfully',
      configuration: updatedConfig
    });

  } catch (error: any) {
    console.error('Update configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ai/config/[configId] - Delete configuration
 * Requires: superadmin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
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

    const { configId } = params;

    if (!ObjectId.isValid(configId)) {
      return NextResponse.json({ error: 'Invalid config ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<AIConfiguration>('ai_configurations');

    const result = await collection.deleteOne({
      _id: new ObjectId(configId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Configuration deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration', details: error.message },
      { status: 500 }
    );
  }
}
