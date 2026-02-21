import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Article, JWTPayload } from '@/lib/types';
import { generateEmbedding, prepareTextForEmbedding } from '@/lib/services/embeddings';
import { ObjectId } from 'mongodb';

/**
 * POST /api/articles/[articleId]/embedding
 * Generate vector embedding for an article
 * Protected route - requires authentication
 */
async function handler(
  request: NextRequest,
  user: JWTPayload,
  context: { params: { articleId: string } }
) {
  try {
    const { articleId } = context.params;

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

    // Prepare text for embedding
    const text = prepareTextForEmbedding(article.title, article.content);

    // Generate embedding
    const embeddingResult = await generateEmbedding(text);

    if (!embeddingResult.success || !embeddingResult.embedding) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to generate embedding: ${embeddingResult.error}`,
        },
        { status: 500 }
      );
    }

    // Update article with embedding
    await articlesCollection.updateOne(
      { _id: article._id },
      {
        $set: {
          embedding: embeddingResult.embedding,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Embedding generated successfully',
        model: embeddingResult.model,
        dimensions: embeddingResult.embedding.length,
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
