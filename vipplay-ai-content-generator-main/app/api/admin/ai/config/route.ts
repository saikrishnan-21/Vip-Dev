/**
 * AI Configuration Management API Route (Superadmin)
 * VIP-10506: Export/Import Configuration
 * VIP-10507: Superadmin Access Control
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { AIConfiguration, ModelGroup, ConfigurationExport } from '@/lib/types/ai-config';

/**
 * GET /api/admin/ai/config - List all AI configurations
 * Query params: category, isActive
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
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const db = await getDatabase();
    const collection = db.collection<AIConfiguration>('ai_configurations');

    const filter: any = {};
    if (category) filter.category = category;
    if (isActive !== null) filter.isActive = isActive === 'true';

    const configurations = await collection
      .find(filter)
      .sort({ category: 1, key: 1 })
      .toArray();

    return NextResponse.json({
      configurations,
      count: configurations.length
    });

  } catch (error: any) {
    console.error('List configurations error:', error);
    return NextResponse.json(
      { error: 'Failed to list configurations', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ai/config - Create new AI configuration
 * Body: { key, value, description?, category, isActive }
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
      key,
      value,
      description,
      category,
      isActive = true
    } = body;

    // Validation
    if (!key || value === undefined || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value, category' },
        { status: 400 }
      );
    }

    const validCategories = ['models', 'routing', 'performance', 'limits', 'general'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<AIConfiguration>('ai_configurations');

    // Check for duplicate key
    const existing = await collection.findOne({ key });
    if (existing) {
      return NextResponse.json(
        { error: 'Configuration with this key already exists' },
        { status: 409 }
      );
    }

    const now = new Date();
    const userId = new ObjectId(payload.userId);

    const newConfig: AIConfiguration = {
      key,
      value,
      description,
      category,
      isActive,
      createdAt: now,
      updatedAt: now,
      createdBy: userId
    };

    const result = await collection.insertOne(newConfig);

    return NextResponse.json({
      message: 'Configuration created successfully',
      configId: result.insertedId,
      configuration: { ...newConfig, _id: result.insertedId }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to create configuration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ai/config - Export all configurations
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

    const db = await getDatabase();
    const configCollection = db.collection<AIConfiguration>('ai_configurations');
    const groupsCollection = db.collection<ModelGroup>('model_groups');

    // Get all active configurations
    const configurations = await configCollection
      .find({ isActive: true })
      .toArray();

    // Get all active model groups
    const modelGroups = await groupsCollection
      .find({ isActive: true })
      .toArray();

    const exportData: ConfigurationExport = {
      version: '1.0.0',
      exportedAt: new Date(),
      modelGroups,
      configurations
    };

    return NextResponse.json({
      message: 'Configuration exported successfully',
      export: exportData
    });

  } catch (error: any) {
    console.error('Export configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to export configuration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/ai/config - Import configurations
 * Body: ConfigurationExport
 * Requires: superadmin role
 */
export async function PATCH(request: NextRequest) {
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

    const body: ConfigurationExport = await request.json();

    if (!body.version || !body.modelGroups || !body.configurations) {
      return NextResponse.json(
        { error: 'Invalid import format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const configCollection = db.collection<AIConfiguration>('ai_configurations');
    const groupsCollection = db.collection<ModelGroup>('model_groups');

    const now = new Date();
    const userId = new ObjectId(payload.userId);

    let importedConfigs = 0;
    let importedGroups = 0;
    let skippedConfigs = 0;
    let skippedGroups = 0;

    // Import model groups
    for (const group of body.modelGroups) {
      const existing = await groupsCollection.findOne({ name: group.name });

      if (!existing) {
        const newGroup = {
          ...group,
          _id: undefined,
          createdAt: now,
          updatedAt: now,
          createdBy: userId
        };
        await groupsCollection.insertOne(newGroup);
        importedGroups++;
      } else {
        skippedGroups++;
      }
    }

    // Import configurations
    for (const config of body.configurations) {
      const existing = await configCollection.findOne({ key: config.key });

      if (!existing) {
        const newConfig = {
          ...config,
          _id: undefined,
          createdAt: now,
          updatedAt: now,
          createdBy: userId
        };
        await configCollection.insertOne(newConfig);
        importedConfigs++;
      } else {
        skippedConfigs++;
      }
    }

    return NextResponse.json({
      message: 'Configuration imported successfully',
      summary: {
        modelGroups: {
          imported: importedGroups,
          skipped: skippedGroups
        },
        configurations: {
          imported: importedConfigs,
          skipped: skippedConfigs
        }
      }
    });

  } catch (error: any) {
    console.error('Import configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to import configuration', details: error.message },
      { status: 500 }
    );
  }
}
