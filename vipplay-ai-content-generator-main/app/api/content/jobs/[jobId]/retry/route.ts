import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/content/jobs/[jobId]/retry
 * Retry a failed generation job with same parameters
 */
export const POST = withAuth(async (request, user, context: { params: Promise<{ jobId: string }> }) => {
  try {
    // Next.js 15+ requires awaiting params
    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
        },
        { status: 400 }
      );
    }

    // Validate ObjectId format before using it
    if (!ObjectId.isValid(jobId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid job ID format',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const jobsCollection = db.collection(Collections.GENERATION_JOBS);

    // Find the original job
    const originalJob = await jobsCollection.findOne({
      _id: new ObjectId(jobId),
      userId: new ObjectId(user.userId),
    });

    if (!originalJob) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    // Only retry failed jobs
    if (originalJob.status !== 'failed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only failed jobs can be retried',
        },
        { status: 400 }
      );
    }

    // Create a new job with the same parameters
    const newJob = {
      userId: new ObjectId(user.userId),
      status: 'queued',
      mode: originalJob.mode,
      topic: originalJob.topic,
      keywords: originalJob.keywords,
      trendTopic: originalJob.trendTopic,
      wordCount: originalJob.wordCount,
      tone: originalJob.tone,
      region: originalJob.region,
      spinAngle: originalJob.spinAngle,
      seoOptimization: originalJob.seoOptimization,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await jobsCollection.insertOne(newJob);
    const newJobId = result.insertedId.toString();

    // Call FastAPI to start generation (same as original generate endpoint)
    const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
    let fastapiEndpoint = '';
    let fastapiBody: any = {};

    switch (originalJob.mode) {
      case 'topic':
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/topic`;
        fastapiBody = {
          topic: originalJob.topic,
          word_count: originalJob.wordCount,
          tone: originalJob.tone,
          keywords: originalJob.keywords || [],
          seo_optimization: originalJob.seoOptimization,
        };
        break;
      case 'keywords':
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/keywords`;
        fastapiBody = {
          keywords: originalJob.keywords,
          word_count: originalJob.wordCount,
          tone: originalJob.tone,
          seo_optimization: originalJob.seoOptimization,
          keyword_density: originalJob.keywordDensity || 'natural',
        };
        break;
      case 'trends':
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/trends`;
        fastapiBody = {
          trend_topic: originalJob.trendTopic,
          region: originalJob.region || 'US',
          word_count: originalJob.wordCount,
          tone: originalJob.tone,
          keywords: originalJob.keywords || [],
          seo_optimization: originalJob.seoOptimization,
        };
        break;
      case 'spin':
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/spin`;
        fastapiBody = {
          original_content: originalJob.originalContent || '',
          spin_angle: originalJob.spinAngle || 'fresh perspective',
          spin_intensity: originalJob.spinIntensity || 'medium',
          word_count: originalJob.wordCount,
          tone: originalJob.tone,
          seo_optimization: originalJob.seoOptimization !== false,
          content_structure: originalJob.contentStructure || 'auto',
          include_images: originalJob.includeImages || false,
          image_count: originalJob.imageCount || 0,
          image_style: originalJob.imageStyle || 'auto',
        };
        break;
    }

    // Call FastAPI in background (don't await)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
    
    fetch(fastapiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fastapiBody),
      signal: controller.signal,
    })
      .then(() => clearTimeout(timeoutId))
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`FastAPI retry call failed for job ${newJobId}:`, error);
      });

    return NextResponse.json({
      success: true,
      message: 'Job retried successfully',
      jobId: newJobId,
    });
  } catch (error: any) {
    console.error('[Retry Job Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retry job',
      },
      { status: 500 }
    );
  }
});

