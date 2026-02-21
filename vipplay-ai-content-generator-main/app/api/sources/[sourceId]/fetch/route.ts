import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Source, JWTPayload } from '@/lib/types';
import { Article } from '@/lib/types/article';
import { ObjectId } from 'mongodb';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/sources/[sourceId]/fetch
 * Manually trigger fetching articles from an RSS source via FastAPI
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

    // Get source and verify ownership
    const source = await sourcesCollection.findOne({
      _id: new ObjectId(sourceId),
      userId: new ObjectId(user.userId),
    });

    if (!source) {
      return NextResponse.json(
        {
          success: false,
          message: 'Source not found',
        },
        { status: 404 }
      );
    }

    // Only RSS sources can be fetched
    if (source.type !== 'rss') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only RSS sources can be fetched via this endpoint',
        },
        { status: 400 }
      );
    }

    if (!source.feedUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'RSS feed URL not found for this source',
        },
        { status: 400 }
      );
    }

    // Call FastAPI to fetch and parse RSS feed
    const fastapiResponse = await fetch(`${FASTAPI_URL}/rss/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feed_url: source.feedUrl,
        max_items: 50,
        include_content: true,
      }),
    });

    if (!fastapiResponse.ok) {
      const errorData = await fastapiResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: `FastAPI error: ${errorData.detail || fastapiResponse.statusText}`,
        },
        { status: 503 }
      );
    }

    const result = await fastapiResponse.json();

    if (!result.success || !result.feed) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch RSS feed: ${result.error}`,
        },
        { status: 500 }
      );
    }

    // Store articles in database
    const articles: Omit<Article, '_id'>[] = [];
    const now = new Date();

    for (const item of result.feed.items) {
      // Skip items without title or link
      if (!item.title || !item.link) {
        continue;
      }

      // Check if article already exists by URL or GUID
      const orConditions: any[] = [];
      if (item.link) orConditions.push({ url: item.link });
      if (item.guid) orConditions.push({ guid: item.guid });

      const existingArticle = await articlesCollection.findOne({
        sourceId: source._id,
        $or: orConditions,
      });

      if (existingArticle) {
        continue; // Skip duplicate
      }

      // Parse published date
      let publishedAt: Date | undefined;
      if (item.pubDate) {
        try {
          publishedAt = new Date(item.pubDate);
        } catch {
          publishedAt = undefined;
        }
      }

      // Extract image URL from enclosure or content
      let imageUrl = item.enclosure?.url;

      const article: Omit<Article, '_id'> = {
        sourceId: source._id!,
        userId: source.userId,
        title: item.title,
        content: item.content || item.description || '',
        summary: item.description,
        url: item.link,
        guid: item.guid,
        author: item.author,
        publishedAt,
        fetchedAt: now,
        imageUrl,
        tags: item.categories || [],
        createdAt: now,
        updatedAt: now,
      };

      articles.push(article);
    }

    // Bulk insert articles
    let insertedCount = 0;
    if (articles.length > 0) {
      const insertResult = await articlesCollection.insertMany(articles);
      insertedCount = insertResult.insertedCount;

      // Update source's articlesCount and lastFetchedAt
      await sourcesCollection.updateOne(
        { _id: source._id },
        {
          $inc: { articlesCount: insertedCount },
          $set: { lastFetchedAt: now },
        }
      );
    } else {
      // Still update lastFetchedAt even if no new articles
      await sourcesCollection.updateOne(
        { _id: source._id },
        {
          $set: { lastFetchedAt: now },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Fetched ${result.feed.items.length} items, added ${insertedCount} new articles`,
        fetched: result.feed.items.length,
        added: insertedCount,
        lastFetchedAt: now,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch source articles error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch articles from source',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAuth(handler);
