import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Article, ArticlePublic, JWTPayload } from '@/lib/types';
import { ObjectId } from 'mongodb';

/**
 * GET /api/articles
 * List articles with filtering and pagination
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // createdAt, publishedAt, fetchedAt
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const db = await getDatabase();
    const articlesCollection = db.collection<Article>(Collections.ARTICLES);

    // Build filter query
    const filter: any = {
      userId: new ObjectId(user.userId),
    };

    if (sourceId && ObjectId.isValid(sourceId)) {
      filter.sourceId = new ObjectId(sourceId);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Get articles and total count
    const [articles, total] = await Promise.all([
      articlesCollection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      articlesCollection.countDocuments(filter),
    ]);

    // Convert to public article objects
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
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List articles error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve articles',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const GET = withAuth(handler);
