import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Source, SourcePublic, JWTPayload } from '@/lib/types';
import { createTrendsSourceSchema } from '@/lib/validations/source';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * POST /api/sources/trends
 * Create a new Google Trends source for tracking trending topics
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const validatedData = createTrendsSourceSchema.parse(body);

    // Get database connection
    const db = await getDatabase();
    const sourcesCollection = db.collection<Source>(Collections.SOURCES);

    // Check for duplicate trend source name for this user
    const existingSource = await sourcesCollection.findOne({
      userId: new ObjectId(user.userId),
      type: 'trends',
      name: validatedData.name,
    });

    if (existingSource) {
      return NextResponse.json(
        {
          success: false,
          message: 'Trend source with this name already exists',
        },
        { status: 409 }
      );
    }

    // Create new Google Trends source
    const now = new Date();
    const newSource: Omit<Source, '_id'> = {
      userId: new ObjectId(user.userId),
      type: 'trends',
      name: validatedData.name,
      description: validatedData.description,
      status: 'active',
      trendRegion: validatedData.trendRegion,
      trendCategory: validatedData.trendCategory,
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
      trendRegion: newSource.trendRegion,
      trendCategory: newSource.trendCategory,
      articlesCount: newSource.articlesCount,
      createdAt: newSource.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Google Trends source created successfully',
        source: publicSource,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create trends source error:', error);

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
        message: 'Failed to create Google Trends source',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAuth(handler);
