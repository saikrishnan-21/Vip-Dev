import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Source, SourcePublic, JWTPayload } from '@/lib/types';
import { ObjectId } from 'mongodb';

/**
 * GET /api/sources
 * List all sources for current user
 * Protected route - requires authentication
 * Query params: type, status, page, limit
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Filter by type
    const status = searchParams.get('status'); // Filter by status
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const db = await getDatabase();
    const sourcesCollection = db.collection<Source>(Collections.SOURCES);

    // Build filter query
    const filter: any = {
      userId: new ObjectId(user.userId),
    };

    if (type) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    // Get sources and total count
    const [sources, total] = await Promise.all([
      sourcesCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      sourcesCollection.countDocuments(filter),
    ]);

    // Convert to public source objects
    const publicSources: SourcePublic[] = sources.map((source) => ({
      _id: source._id!.toString(),
      userId: source.userId.toString(),
      type: source.type,
      name: source.name,
      description: source.description,
      status: source.status,
      feedUrl: source.feedUrl,
      websiteUrl: source.websiteUrl,
      topicKeywords: source.topicKeywords,
      trendRegion: source.trendRegion,
      trendCategory: source.trendCategory,
      articlesCount: source.articlesCount,
      lastFetchedAt: source.lastFetchedAt,
      fetchFrequency: source.fetchFrequency,
      createdAt: source.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        sources: publicSources,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List sources error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve sources',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const GET = withAuth(handler);
