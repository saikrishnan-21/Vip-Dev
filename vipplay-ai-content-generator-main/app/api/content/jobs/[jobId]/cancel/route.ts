import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * POST /api/content/jobs/[jobId]/cancel
 * Cancel a running or queued generation job
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

    // Only cancel queued or processing jobs
    if (job.status !== 'queued' && job.status !== 'processing' && job.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only queued or processing jobs can be cancelled',
        },
        { status: 400 }
      );
    }

    // Update job status to cancelled with cancellation timestamp
    const cancelledAt = new Date();
    await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'cancelled',
          message: 'Job cancelled by user',
          cancelledAt: cancelledAt,
          updatedAt: cancelledAt,
        },
      }
    );

    console.log(`[Cancel Job] Job ${jobId} marked as cancelled by user ${user.userId}`);

    // Note: SQS message will be automatically skipped by worker when it checks job status
    // If job is already processing, worker will check cancelled status and skip saving results
    // If job is queued, worker will delete the message when it receives it

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
      data: {
        jobId,
        status: 'cancelled',
        cancelledAt: cancelledAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Cancel Job Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cancel job',
      },
      { status: 500 }
    );
  }
});

