import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * GET /api/content/jobs/[jobId]/progress
 * Get generation job progress
 * First checks MongoDB, then FastAPI if needed
 */
export const GET = withAuth(async (request, user, context: { params: Promise<{ jobId: string }> }) => {
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

    // First check MongoDB for job status
    const job = await jobsCollection.findOne({
      _id: new ObjectId(jobId),
      userId: new ObjectId(user.userId),
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      );
    }

    // NOTE: FastAPI no longer tracks job progress (stateless per architecture)
    // All job tracking is handled in MongoDB by Next.js
    // FastAPI only processes requests and returns results immediately

    // Return MongoDB job data
    return NextResponse.json({
      success: true,
      progress: job.progress || 0,
      status: job.status,
      currentArticle: job.currentArticle || 0,
      message: job.message || 'Job in progress',
    });
  } catch (error: any) {
    console.error('[Get Job Progress Error]', error);

    // Handle invalid ObjectId format
    if (error.message?.includes('ObjectId') || error.message?.includes('BSON')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid job ID format',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get job progress',
      },
      { status: 500 }
    );
  }
});

