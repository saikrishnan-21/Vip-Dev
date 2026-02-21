import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Source, SourcePublic, JWTPayload } from '@/lib/types';
import { createWebsiteSourceSchema } from '@/lib/validations/source';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * POST /api/sources/website
 * Create a new website source for crawling
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = createWebsiteSourceSchema.parse(body);

    // Get database connection
    const db = await getDatabase();
    const sourcesCollection = db.collection<Source>(Collections.SOURCES);

    // Check if website URL already exists for this user
    const existingSource = await sourcesCollection.findOne({
      userId: new ObjectId(user.userId),
      websiteUrl: validatedData.websiteUrl,
    });

    if (existingSource) {
      return NextResponse.json(
        {
          success: false,
          message: 'Website already added',
        },
        { status: 400 }
      );
    }

    // Create source document
    const now = new Date();
    const newSource: Omit<Source, '_id'> = {
      userId: new ObjectId(user.userId),
      type: 'website',
      name: validatedData.name,
      description: validatedData.description,
      status: 'active',
      websiteUrl: validatedData.websiteUrl,
      fetchFrequency: validatedData.crawlFrequency || 360, // Default 6 hours
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
      websiteUrl: newSource.websiteUrl,
      fetchFrequency: newSource.fetchFrequency,
      articlesCount: newSource.articlesCount,
      createdAt: newSource.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Website source created successfully',
        source: sourcePublic,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create website source error:', error);

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
        message: 'An error occurred while creating website source',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAuth(handler);
