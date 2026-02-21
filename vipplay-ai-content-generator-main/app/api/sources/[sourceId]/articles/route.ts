import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Source, JWTPayload } from '@/lib/types';
import { Article, ArticlePublic } from '@/lib/types/article';
import { ObjectId } from 'mongodb';

/**
 * GET /api/sources/[sourceId]/articles
 * Get articles for a specific source with pagination and filtering
 * Protected route - requires authentication
 */
async function handler(
  request: NextRequest,
  user: JWTPayload,
  context: { params: Promise<{ sourceId: string }> }
) {
  try {
    const { sourceId } = await context.params;

    if (!ObjectId.isValid(sourceId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid source ID',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const sourcesCollection = db.collection<Source>(Collections.SOURCES);
    const articlesCollection = db.collection<Article>(Collections.ARTICLES);

    // Verify source exists and user owns it
    const source = await sourcesCollection.findOne({
      _id: new ObjectId(sourceId),
      userId: new ObjectId(user.userId),
    });

    if (!source) {
      return NextResponse.json(
        {
          success: false,
          message: 'Source not found or you do not have access',
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20'),
      100
    );
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'publishedAt';
    const order = searchParams.get('order') || 'desc';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query filter
    const filter: any = {
      sourceId: new ObjectId(sourceId),
      userId: new ObjectId(user.userId),
    };

    // Add date range filters if provided
    if (startDate || endDate) {
      filter.publishedAt = {};
      if (startDate) {
        filter.publishedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.publishedAt.$lte = new Date(endDate);
      }
    }

    // Build sort object
    const sortField = ['publishedAt', 'createdAt', 'title'].includes(sort)
      ? sort
      : 'publishedAt';
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = { [sortField]: sortOrder };

    // Get total count
    const total = await articlesCollection.countDocuments(filter);

    // Get articles with pagination
    const articles = await articlesCollection
      .find(filter)
      .sort(sortObj)
      .skip(offset)
      .limit(limit)
      .toArray();

    // Convert to public format
    const publicArticles: ArticlePublic[] = articles.map((article) => ({
      _id: article._id!.toString(),
      sourceId: article.sourceId.toString(),
      userId: article.userId.toString(),
      title: article.title,
      content: article.content,
      summary: article.summary,
      url: article.url,
      author: article.author,
      publishedAt: article.publishedAt,
      fetchedAt: article.fetchedAt,
      imageUrl: article.imageUrl,
      tags: article.tags,
      createdAt: article.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        articles: publicArticles,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get articles error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get articles',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const GET = withAuth(handler);
