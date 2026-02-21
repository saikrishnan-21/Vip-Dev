import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { Source, JWTPayload } from '@/lib/types';
import { Article } from '@/lib/types/article';
import { ObjectId } from 'mongodb';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/sources/[sourceId]/crawl
 * Initiate website crawling via FastAPI + Firecrawl
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

    // Only website sources can be crawled
    if (source.type !== 'website') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only website sources can be crawled via this endpoint',
        },
        { status: 400 }
      );
    }

    if (!source.websiteUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'Website URL not found for this source',
        },
        { status: 400 }
      );
    }

    // Call FastAPI to initiate crawl
    const fastapiResponse = await fetch(`${FASTAPI_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: source.websiteUrl,
        max_pages: 50,
        formats: ['markdown'],
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

    const crawlResult = await fastapiResponse.json();

    if (!crawlResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to initiate crawl: ${crawlResult.error}`,
        },
        { status: 500 }
      );
    }

    // Update source with crawl job ID
    await sourcesCollection.updateOne(
      { _id: source._id },
      {
        $set: {
          crawlJobId: crawlResult.job_id,
          lastFetchedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Website crawl initiated successfully',
        jobId: crawlResult.job_id,
      },
      { status: 202 } // Accepted - processing async
    );
  } catch (error) {
    console.error('Crawl website error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initiate website crawl',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sources/[sourceId]/crawl
 * Check crawl job status via FastAPI and process completed results
 * Protected route - requires authentication
 */
async function getHandler(
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

    if (!source.crawlJobId) {
      return NextResponse.json(
        {
          success: false,
          message: 'No crawl job found for this source',
        },
        { status: 404 }
      );
    }

    // Call FastAPI to check crawl job status
    const fastapiResponse = await fetch(
      `${FASTAPI_URL}/crawl/${source.crawlJobId}`,
      {
        method: 'GET',
      }
    );

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

    const jobStatus = await fastapiResponse.json();

    if (jobStatus.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          message: `Crawl job failed: ${jobStatus.error}`,
          status: jobStatus.status,
        },
        { status: 500 }
      );
    }

    if (jobStatus.status === 'completed' && jobStatus.data) {
      // Process crawled pages and store as articles
      const articles: Omit<Article, '_id'>[] = [];
      const now = new Date();

      for (const page of jobStatus.data) {
        // Check if article already exists by URL
        const existingArticle = await articlesCollection.findOne({
          sourceId: source._id,
          url: page.url,
        });

        if (existingArticle) {
          continue; // Skip duplicate
        }

        const article: Omit<Article, '_id'> = {
          sourceId: source._id!,
          userId: source.userId,
          title: page.metadata?.title || 'Untitled',
          content: page.markdown || page.text || '',
          summary: page.metadata?.description,
          url: page.url,
          fetchedAt: now,
          tags: page.metadata?.keywords,
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

        // Update source's articlesCount
        await sourcesCollection.updateOne(
          { _id: source._id },
          {
            $inc: { articlesCount: insertedCount },
          }
        );
      }

      return NextResponse.json(
        {
          success: true,
          status: jobStatus.status,
          message: `Crawl completed. Added ${insertedCount} new articles`,
          total: jobStatus.total,
          completed: jobStatus.completed,
          added: insertedCount,
        },
        { status: 200 }
      );
    }

    // Job still in progress
    return NextResponse.json(
      {
        success: true,
        status: jobStatus.status,
        message: 'Crawl job in progress',
        total: jobStatus.total,
        completed: jobStatus.completed,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get crawl status error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get crawl status',
      },
      { status: 500 }
    );
  }
}

// Export protected handlers
export const POST = withAuth(handler);
export const GET = withAuth(getHandler);
