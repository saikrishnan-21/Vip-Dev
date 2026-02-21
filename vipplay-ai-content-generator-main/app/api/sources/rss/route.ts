import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Source, SourcePublic, JWTPayload } from '@/lib/types';
import { createRSSSourceSchema } from '@/lib/validations/source';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * POST /api/sources/rss
 * Create new RSS feed source
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = createRSSSourceSchema.parse(body);

    // Get database connection
    const db = await getDatabase();
    const sourcesCollection = db.collection<Source>(Collections.SOURCES);

    // Check if RSS feed URL already exists for this user
    const existingSource = await sourcesCollection.findOne({
      userId: new ObjectId(user.userId),
      feedUrl: validatedData.feedUrl,
    });

    if (existingSource) {
      return NextResponse.json(
        {
          success: false,
          message: 'RSS feed already added',
        },
        { status: 400 }
      );
    }

    // Create source document
    const now = new Date();
    const newSource: Omit<Source, '_id'> = {
      userId: new ObjectId(user.userId),
      type: 'rss',
      name: validatedData.name,
      description: validatedData.description,
      status: 'active',
      feedUrl: validatedData.feedUrl,
      fetchFrequency: validatedData.fetchFrequency || 60, // Default 60 minutes
      articlesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Insert source into database
    const result = await sourcesCollection.insertOne(newSource as Source);

    // Create public source object
    const sourcePublic: SourcePublic = {
      _id: result.insertedId.toString(),
      userId: user.userId,
      type: newSource.type,
      name: newSource.name,
      description: newSource.description,
      status: newSource.status,
      feedUrl: newSource.feedUrl,
      fetchFrequency: newSource.fetchFrequency,
      articlesCount: newSource.articlesCount,
      createdAt: newSource.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'RSS feed source created successfully',
        source: sourcePublic,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create RSS source error:', error);

    // Handle Zod validation errors
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
        message: 'An error occurred while creating RSS source',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAuth(handler);
