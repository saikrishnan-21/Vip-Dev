import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Article, ArticlePublic, JWTPayload } from '@/lib/types';
import { ObjectId } from 'mongodb';

/**
 * GET /api/articles/search
 * Full-text search articles by keywords with pagination and filtering
 * Query parameter 'q' is optional - if omitted, returns all articles with filters
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const sourceId = searchParams.get('sourceId');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, date, title, fetchedAt
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid pagination parameters (page >= 1, limit 1-100)',
        },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const db = await getDatabase();
    const articlesCollection = db.collection<Article>(Collections.ARTICLES);

    // Build search filter
    const filter: any = {
      userId: new ObjectId(user.userId),
    };

    // Add full-text search if query provided
    if (query && query.trim().length > 0) {
      filter.$text = { $search: query };
    }

    // Add source filter if provided
    if (sourceId && ObjectId.isValid(sourceId)) {
      filter.sourceId = new ObjectId(sourceId);
    }

    // Add tags filter if provided (match any of the specified tags)
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Build sort options
    let sortOptions: any = {};
    let projection: any = {};

    if (query && query.trim().length > 0 && sortBy === 'relevance') {
      // Sort by text search score (relevance)
      projection = { score: { $meta: 'textScore' } };
      sortOptions = { score: { $meta: 'textScore' } };
    } else if (sortBy === 'date') {
      sortOptions = { publishedAt: sortOrder === 'asc' ? 1 : -1 };
    } else if (sortBy === 'title') {
      sortOptions = { title: sortOrder === 'asc' ? 1 : -1 };
    } else {
      // Default: sort by fetched date
      sortOptions = { fetchedAt: sortOrder === 'asc' ? 1 : -1 };
    }

    // Perform search with scoring
    const [articles, total] = await Promise.all([
      articlesCollection
        .find(filter, projection ? { projection } : {})
        .sort(sortOptions)
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
        query: query || undefined,
        articles: publicArticles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        filters: {
          sourceId: sourceId || undefined,
          tags: tags || undefined,
          sortBy,
          sortOrder,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Search articles error:', error);

    // If text index doesn't exist, return helpful error
    if (error instanceof Error && error.message.includes('text index')) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Text search index not configured. Please create a text index on the articles collection.',
          indexCommand:
            'db.articles.createIndex({ title: "text", content: "text", summary: "text" })',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to search articles',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const GET = withAuth(handler);
