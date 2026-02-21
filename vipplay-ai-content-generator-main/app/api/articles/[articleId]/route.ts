import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Article, ArticlePublic, JWTPayload } from '@/lib/types';
import { ObjectId } from 'mongodb';

/**
 * GET /api/articles/[articleId]
 * Get a single article by ID
 * Protected route - requires authentication
 */
async function getHandler(
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

    // Convert to public article object
    const publicArticle: ArticlePublic = {
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
    };

    return NextResponse.json(
      {
        success: true,
        article: publicArticle,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get article error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve article',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[articleId]
 * Delete an article
 * Protected route - requires authentication
 */
async function deleteHandler(
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
    const sourcesCollection = db.collection(Collections.SOURCES);

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

    // Delete article
    await articlesCollection.deleteOne({ _id: article._id });

    // Decrement source's articlesCount
    await sourcesCollection.updateOne(
      { _id: article.sourceId },
      { $inc: { articlesCount: -1 } }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Article deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete article error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete article',
      },
      { status: 500 }
    );
  }
}

// Export protected handlers
export const GET = withAuth(getHandler);
export const DELETE = withAuth(deleteHandler);
