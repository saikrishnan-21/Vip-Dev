import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Article, JWTPayload } from '@/lib/types';
import { generateEmbedding, prepareTextForEmbedding } from '@/lib/services/embeddings';
import { ObjectId } from 'mongodb';

/**
 * POST /api/articles/embeddings/batch
 * Generate embeddings for all articles without embeddings
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const sourceId = searchParams.get('sourceId');

    const db = await getDatabase();
    const articlesCollection = db.collection<Article>(Collections.ARTICLES);

    // Build filter for articles without embeddings
    const filter: any = {
      userId: new ObjectId(user.userId),
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: [] },
      ],
    };

    if (sourceId && ObjectId.isValid(sourceId)) {
      filter.sourceId = new ObjectId(sourceId);
    }

    // Get articles without embeddings
    const articles = await articlesCollection
      .find(filter)
      .limit(limit)
      .toArray();

    if (articles.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No articles without embeddings found',
          processed: 0,
          errors: 0,
        },
        { status: 200 }
      );
    }

    // Generate embeddings for each article
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const article of articles) {
      try {
        const text = prepareTextForEmbedding(article.title, article.content);
        const embeddingResult = await generateEmbedding(text);

        if (embeddingResult.success && embeddingResult.embedding) {
          await articlesCollection.updateOne(
            { _id: article._id },
            {
              $set: {
                embedding: embeddingResult.embedding,
              },
            }
          );
          successCount++;
        } else {
          errorCount++;
          errors.push(`Article ${article._id}: ${embeddingResult.error}`);
        }
      } catch (error) {
        errorCount++;
        errors.push(
          `Article ${article._id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json(
      {
        success: errorCount === 0,
        message: `Generated embeddings for ${successCount} articles`,
        total: articles.length,
        processed: successCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Batch generate embeddings error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate embeddings',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAuth(handler);
