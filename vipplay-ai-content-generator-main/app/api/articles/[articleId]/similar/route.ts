import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Article, ArticlePublic, JWTPayload } from '@/lib/types';
import { ObjectId } from 'mongodb';

/**
 * GET /api/articles/[articleId]/similar
 * Find similar articles using vector similarity search
 * Protected route - requires authentication
 */
async function handler(
  request: NextRequest,
  user: JWTPayload,
  context: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!ObjectId.isValid(articleId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid article ID',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const articlesCollection = db.collection<Article>(Collections.ARTICLES);

    // Get the source article and verify ownership
    const sourceArticle = await articlesCollection.findOne({
      _id: new ObjectId(articleId),
      userId: new ObjectId(user.userId),
    });

    if (!sourceArticle) {
      return NextResponse.json(
        {
          success: false,
          message: 'Article not found',
        },
        { status: 404 }
      );
    }

    if (!sourceArticle.embedding || sourceArticle.embedding.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Article does not have an embedding. Generate embedding first.',
        },
        { status: 400 }
      );
    }

    // Perform vector similarity search using MongoDB Atlas Vector Search
    // Note: This requires a vector search index to be created in Atlas
    try {
      const similarArticles = await articlesCollection
        .aggregate([
          {
            $vectorSearch: {
              index: 'article_vector_search', // Index name in Atlas
              path: 'embedding',
              queryVector: sourceArticle.embedding,
              numCandidates: limit * 10,
              limit: limit + 1, // +1 to exclude source article
            },
          },
          {
            $match: {
              userId: new ObjectId(user.userId),
              _id: { $ne: sourceArticle._id }, // Exclude source article
            },
          },
          {
            $limit: limit,
          },
          {
            $project: {
              _id: 1,
              sourceId: 1,
              userId: 1,
              title: 1,
              content: 1,
              summary: 1,
              url: 1,
              author: 1,
              publishedAt: 1,
              fetchedAt: 1,
              imageUrl: 1,
              tags: 1,
              createdAt: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ])
        .toArray();

      // Convert to public article objects
      const publicArticles: (ArticlePublic & { score?: number })[] = similarArticles.map((article: any) => ({
        _id: article._id.toString(),
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
        score: article.score,
      }));

      return NextResponse.json(
        {
          success: true,
          sourceArticle: {
            _id: sourceArticle._id.toString(),
            title: sourceArticle.title,
          },
          similar: publicArticles,
          count: publicArticles.length,
        },
        { status: 200 }
      );
    } catch (vectorSearchError: any) {
      // If vector search is not available, fall back to manual cosine similarity
      if (vectorSearchError.code === 40324 || vectorSearchError.message?.includes('$vectorSearch')) {
        console.warn('Vector search index not available, using fallback method');
        return await fallbackSimilaritySearch(
          articlesCollection,
          sourceArticle,
          user.userId,
          limit
        );
      }
      throw vectorSearchError;
    }
  } catch (error) {
    console.error('Find similar articles error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to find similar articles',
        error: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Fallback similarity search using manual cosine similarity calculation
 * Used when MongoDB Atlas Vector Search is not available
 */
async function fallbackSimilaritySearch(
  articlesCollection: any,
  sourceArticle: Article,
  userId: string,
  limit: number
): Promise<NextResponse> {
  // Get all articles with embeddings for this user
  const articles = await articlesCollection
    .find({
      userId: new ObjectId(userId),
      _id: { $ne: sourceArticle._id },
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } },
    })
    .limit(1000) // Limit to prevent memory issues
    .toArray();

  if (articles.length === 0) {
    return NextResponse.json(
      {
        success: true,
        sourceArticle: {
          _id: sourceArticle._id!.toString(),
          title: sourceArticle.title,
        },
        similar: [],
        count: 0,
        fallback: true,
      },
      { status: 200 }
    );
  }

  // Calculate cosine similarity for each article
  const similarities = articles.map((article: Article) => {
    const similarity = cosineSimilarity(sourceArticle.embedding!, article.embedding!);
    return {
      article,
      similarity,
    };
  });

  // Sort by similarity (descending) and take top N
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topSimilar = similarities.slice(0, limit);

  // Convert to public article objects
  const publicArticles = topSimilar.map(({ article, similarity }) => ({
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
    score: similarity,
  }));

  return NextResponse.json(
    {
      success: true,
      sourceArticle: {
        _id: sourceArticle._id!.toString(),
        title: sourceArticle.title,
      },
      similar: publicArticles,
      count: publicArticles.length,
      fallback: true,
      message: 'Using fallback similarity calculation. For better performance, set up Atlas Vector Search.',
    },
    { status: 200 }
  );
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Export protected handler
export const GET = withAuth(handler);
