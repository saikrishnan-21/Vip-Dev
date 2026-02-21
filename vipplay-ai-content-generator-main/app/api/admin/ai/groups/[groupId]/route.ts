/**
 * Individual Model Group Management API Route (Superadmin)
 * VIP-10504: Create Model Groups
 * VIP-10505: Configure Routing Strategies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { ModelGroup } from '@/lib/types/ai-config';

/**
 * GET /api/admin/ai/groups/[groupId] - Get single model group
 * Requires: superadmin role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;

    if (!ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<ModelGroup>('model_groups');

    const group = await collection.findOne({
      _id: new ObjectId(groupId)
    });

    if (!group) {
      return NextResponse.json({ error: 'Model group not found' }, { status: 404 });
    }

    // Convert ObjectIds to strings for JSON serialization
    const groupWithStringIds = {
      ...group,
      _id: group._id.toString(),
      createdBy: group.createdBy?.toString() || group.createdBy
    };

    return NextResponse.json({ group: groupWithStringIds });

  } catch (error: any) {
    console.error('Get model group error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model group', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ai/groups/[groupId] - Update model group
 * Body: { name?, description?, models?, routingStrategy?, priority?, isActive? }
 * Requires: superadmin role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;

    if (!ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      models,
      routingStrategy,
      priority,
      isActive
    } = body;

    const db = await getDatabase();
    const collection = db.collection<ModelGroup>('model_groups');

    // Get current group
    const currentGroup = await collection.findOne({
      _id: new ObjectId(groupId)
    });

    if (!currentGroup) {
      return NextResponse.json({ error: 'Model group not found' }, { status: 404 });
    }

    // Build update object
    const updateFields: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) {
      // Check for duplicate name
      const existing = await collection.findOne({
        name,
        _id: { $ne: new ObjectId(groupId) }
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Model group with this name already exists' },
          { status: 409 }
        );
      }
      updateFields.name = name;
    }

    if (description !== undefined) updateFields.description = description;
    if (isActive !== undefined) updateFields.isActive = isActive;

    if (models !== undefined) {
      if (!Array.isArray(models) || models.length === 0) {
        return NextResponse.json(
          { error: 'Models must be a non-empty array' },
          { status: 400 }
        );
      }
      updateFields.models = models;
    }

    if (routingStrategy !== undefined) {
      const validStrategies = ['round-robin', 'least-load', 'priority', 'random'];
      if (!validStrategies.includes(routingStrategy)) {
        return NextResponse.json(
          { error: `Invalid routing strategy. Must be one of: ${validStrategies.join(', ')}` },
          { status: 400 }
        );
      }
      updateFields.routingStrategy = routingStrategy;
    }

    if (priority !== undefined) {
      const finalModels = models || currentGroup.models;
      const finalStrategy = routingStrategy || currentGroup.routingStrategy;

      if (finalStrategy === 'priority') {
        if (!Array.isArray(priority) || priority.length !== finalModels.length) {
          return NextResponse.json(
            { error: 'Priority array must match models array length for priority routing' },
            { status: 400 }
          );
        }
      }
      updateFields.priority = priority;
    }

    // Update group
    const result = await collection.updateOne(
      { _id: new ObjectId(groupId) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes made' },
        { status: 400 }
      );
    }

    // Fetch updated group
    const updatedGroup = await collection.findOne({
      _id: new ObjectId(groupId)
    });

    if (!updatedGroup) {
      return NextResponse.json({ error: 'Model group not found' }, { status: 404 });
    }

    // Convert ObjectIds to strings for JSON serialization
    const groupWithStringIds = {
      ...updatedGroup,
      _id: updatedGroup._id.toString(),
      createdBy: updatedGroup.createdBy?.toString() || updatedGroup.createdBy
    };

    return NextResponse.json({
      message: 'Model group updated successfully',
      group: groupWithStringIds
    });

  } catch (error: any) {
    console.error('Update model group error:', error);
    return NextResponse.json(
      { error: 'Failed to update model group', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/ai/groups/[groupId] - Delete model group
 * Requires: superadmin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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

    const { groupId } = await params;

    if (!ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<ModelGroup>('model_groups');

    const result = await collection.deleteOne({
      _id: new ObjectId(groupId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Model group not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Model group deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete model group error:', error);
    return NextResponse.json(
      { error: 'Failed to delete model group', details: error.message },
      { status: 500 }
    );
  }
}
