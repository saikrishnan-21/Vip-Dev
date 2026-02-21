import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/content/jobs/[jobId]
 * Get a specific generation job by ID
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

    // Find job by ID and ensure it belongs to the user
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

    // Convert ObjectId to string for JSON serialization
    const jobWithStringIds = {
      ...job,
      _id: job._id.toString(),
      userId: job.userId.toString(),
    };

    return NextResponse.json({
      success: true,
      data: jobWithStringIds,
    });
  } catch (error: any) {
    console.error('[Get Generation Job Error]', error);
    
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
        error: error.message || 'Failed to fetch generation job',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/content/jobs/[jobId]
 * Delete a completed or cancelled generation job
 */
export const DELETE = withAuth(async (request, user, context: { params: Promise<{ jobId: string }> }) => {
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

    // Find the job
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

    // Cannot delete running jobs
    if (job.status === 'processing' || job.status === 'queued' || job.status === 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete running or queued jobs',
        },
        { status: 400 }
      );
    }

    // Delete the job
    await jobsCollection.deleteOne({ _id: new ObjectId(jobId) });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error: any) {
    console.error('[Delete Job Error]', error);
    
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
        error: error.message || 'Failed to delete job',
      },
      { status: 500 }
    );
  }
});

