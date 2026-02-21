import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Source, SourcePublic, JWTPayload } from '@/lib/types';
import { createTopicSourceSchema } from '@/lib/validations/source';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * POST /api/sources/topic
 * Create a new topic source for manual content organization
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const validatedData = createTopicSourceSchema.parse(body);

    const db = await getDatabase();
    const sourcesCollection = db.collection<Source>(Collections.SOURCES);

    // Check for duplicate topic name for this user
    const existingSource = await sourcesCollection.findOne({
      userId: new ObjectId(user.userId),
      type: 'topic',
      name: validatedData.name,
    });

    if (existingSource) {
      return NextResponse.json(
        {
          success: false,
          message: 'Topic source with this name already exists',
        },
        { status: 409 }
      );
    }

    // Create new topic source
    const now = new Date();
    const newSource: Omit<Source, '_id'> = {
      userId: new ObjectId(user.userId),
      type: 'topic',
      name: validatedData.name,
      description: validatedData.description,
      status: 'active',
      topicKeywords: validatedData.topicKeywords,
      articlesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await sourcesCollection.insertOne(newSource as Source);

    const publicSource: SourcePublic = {
      _id: result.insertedId.toString(),
      userId: user.userId,
      type: newSource.type,
      name: newSource.name,
      description: newSource.description,
      status: newSource.status,
      topicKeywords: newSource.topicKeywords,
      articlesCount: newSource.articlesCount,
      createdAt: newSource.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Topic source created successfully',
        source: publicSource,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create topic source error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create topic source',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAuth(handler);
