import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Article } from '@/lib/types/article';
import { JWTPayload } from '@/lib/types';
import { ObjectId } from 'mongodb';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/articles/[articleId]/embeddings
 * Generate vector embedding for an article via FastAPI and store in Weaviate
 * Protected route - requires authentication
 */
async function handler(
  request: NextRequest,
  user: JWTPayload,
  context: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await context.params;

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

    // Get article and verify ownership
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

    // Call FastAPI to generate embedding and store in Weaviate
    const fastapiResponse = await fetch(`${FASTAPI_URL}/api/embeddings/article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article_id: articleId,
        title: article.title,
        content: article.content,
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
          message: `Failed to generate embedding: ${result.error}`,
        },
        { status: 500 }
      );
    }

    // Update article in MongoDB with hasEmbedding flag
    await articlesCollection.updateOne(
      { _id: article._id },
      {
        $set: {
          hasEmbedding: true,
          embeddingModel: result.model,
          weaviateUuid: result.weaviate_uuid,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Article embedding generated successfully',
        articleId: articleId,
        model: result.model,
        weaviateUuid: result.weaviate_uuid,
        action: result.action,
        embeddingDimensions: result.embedding.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Generate article embedding error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate article embedding',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAuth(handler);
