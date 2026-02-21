/**
 * Model Groups Management API Route (Superadmin)
 * VIP-10504: Create Model Groups
 * VIP-10505: Configure Routing Strategies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { ModelGroup } from '@/lib/types/ai-config';

/**
 * GET /api/admin/ai/groups - List all model groups
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

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const db = await getDatabase();
    const collection = db.collection<ModelGroup>('model_groups');

    const filter: any = {};
    if (isActive !== null) {
      filter.isActive = isActive === 'true';
    }

    const groups = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    const groupsWithStringIds = groups.map((group: any) => ({
      ...group,
      _id: group._id.toString(),
      createdBy: group.createdBy?.toString() || group.createdBy
    }));

    return NextResponse.json({
      groups: groupsWithStringIds,
      count: groupsWithStringIds.length
    });

  } catch (error: any) {
    console.error('List model groups error:', error);
    return NextResponse.json(
      { error: 'Failed to list model groups', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai/groups - Create a new model group
 * Body: { name, description, models, routingStrategy, priority?, isActive }
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
    const {
      name,
      description,
      models,
      routingStrategy,
      priority,
      isActive = true
    } = body;

    // Validation
    if (!name || !description || !models || !routingStrategy) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, models, routingStrategy' },
        { status: 400 }
      );
    }

    if (!Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'Models must be a non-empty array' },
        { status: 400 }
      );
    }

    const validStrategies = ['round-robin', 'least-load', 'priority', 'random'];
    if (!validStrategies.includes(routingStrategy)) {
      return NextResponse.json(
        { error: `Invalid routing strategy. Must be one of: ${validStrategies.join(', ')}` },
        { status: 400 }
      );
    }

    // If priority strategy, validate priority array
    if (routingStrategy === 'priority') {
      if (!priority || !Array.isArray(priority) || priority.length !== models.length) {
        return NextResponse.json(
          { error: 'Priority array must match models array length for priority routing' },
          { status: 400 }
        );
      }
    }

    const db = await getDatabase();
    const collection = db.collection<ModelGroup>('model_groups');

    // Check for duplicate name
    const existing = await collection.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { error: 'Model group with this name already exists' },
        { status: 409 }
      );
    }

    const now = new Date();
    const userId = new ObjectId(payload.userId);

    const newGroup: ModelGroup = {
      name,
      description,
      models,
      routingStrategy,
      priority,
      isActive,
      createdAt: now,
      updatedAt: now,
      createdBy: userId
    };

    const result = await collection.insertOne(newGroup);

    // Convert ObjectId to string for JSON serialization
    const groupWithStringId = {
      ...newGroup,
      _id: result.insertedId.toString(),
      createdBy: userId.toString()
    };

    return NextResponse.json({
      message: 'Model group created successfully',
      groupId: result.insertedId.toString(),
      group: groupWithStringId
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create model group error:', error);
    return NextResponse.json(
      { error: 'Failed to create model group', details: error.message },
      { status: 500 }
    );
  }
}
