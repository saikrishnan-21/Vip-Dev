import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Article, ArticlePublic, JWTPayload } from '@/lib/types';
import { ObjectId } from 'mongodb';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * GET /api/articles/semantic-search
 * Semantic search using vector similarity via Weaviate
 * Supports searching by query text or by article ID (find similar to article)
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const articleId = searchParams.get('articleId');
    const sourceId = searchParams.get('sourceId');
    const certainty = parseFloat(searchParams.get('certainty') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate that either query or articleId is provided
    if ((!query || query.trim().length === 0) && !articleId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Either search query (q) or article ID (articleId) is required',
        },
        { status: 400 }
      );
    }

    // Validate parameters
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid limit parameter (min: 1, max: 100)',
        },
        { status: 400 }
      );
    }

    if (certainty < 0 || certainty > 1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid certainty parameter (min: 0, max: 1)',
        },
        { status: 400 }
      );
    }

    let searchQuery = query;

    // If articleId is provided, get the article to find similar ones
    if (articleId && ObjectId.isValid(articleId)) {
      const db = await getDatabase();
      const articlesCollection = db.collection<Article>(Collections.ARTICLES);

      const article = await articlesCollection.findOne({
        _id: new ObjectId(articleId),
        userId: new ObjectId(user.userId),
      });

      if (!article) {
        return NextResponse.json(
          {
            success: false,
            message: 'Article not found',
          },
          { status: 404 }
        );
      }

      // Use article's title and summary as search query
      searchQuery = `${article.title} ${article.summary || ''}`.trim();
    }

    // Call FastAPI to perform vector similarity search via Weaviate
    const fastapiResponse = await fetch(`${FASTAPI_URL}/api/embeddings/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_text: searchQuery,
        limit: limit,
        certainty: certainty,
        model: 'nomic-embed-text',
      }),
    });

    if (!fastapiResponse.ok) {
      const errorData = await fastapiResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: `FastAPI error: ${errorData.error || fastapiResponse.statusText}`,
        },
        { status: 503 }
      );
    }

    const result = await fastapiResponse.json();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to search similar articles: ${result.error}`,
        },
        { status: 500 }
      );
    }

    // Get full article details from MongoDB for the similar articles
    const db = await getDatabase();
    const articlesCollection = db.collection<Article>(Collections.ARTICLES);

    const articleIds = result.results
      .map((r: any) => {
        try {
          return ObjectId.isValid(r.articleId) ? new ObjectId(r.articleId) : null;
        } catch {
          return null;
        }
      })
      .filter((id: any) => id !== null);

    if (articleIds.length === 0) {
      return NextResponse.json(
        {
          success: true,
          query: query || `Similar to article ${articleId}`,
          articles: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    // Build filter
    const filter: any = {
      _id: { $in: articleIds },
      userId: new ObjectId(user.userId),
    };

    // Add source filter if provided
    if (sourceId && ObjectId.isValid(sourceId)) {
      filter.sourceId = new ObjectId(sourceId);
    }

    const articles = await articlesCollection.find(filter).toArray();

    // Create a map of articleId to certainty score
    const scoreMap = new Map(
      result.results.map((r: any) => [r.articleId, r.certainty])
    );

    // Convert to public articles with scores
    const publicArticles: (ArticlePublic & { score?: number })[] = articles.map((article) => ({
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
      score: scoreMap.get(article._id!.toString()),
    }));

    // Sort by score (highest first)
    publicArticles.sort((a, b) => (b.score || 0) - (a.score || 0));

    return NextResponse.json(
      {
        success: true,
        query: query || `Similar to article ${articleId}`,
        articles: publicArticles,
        count: publicArticles.length,
        certainty,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Semantic search error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to perform semantic search',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const GET = withAuth(handler);
