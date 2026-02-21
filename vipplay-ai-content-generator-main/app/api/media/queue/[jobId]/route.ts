/**
 * Individual Queue Job Management API Route
 * VIP-10406: Media Queue Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { MediaGenerationJob } from '@/lib/types/media';

/**
 * GET /api/media/queue/[jobId] - Get job status and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { jobId } = await params;

    if (!ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<MediaGenerationJob>(Collections.GENERATION_JOBS);

    const job = await collection.findOne({
      _id: new ObjectId(jobId),
      userId: new ObjectId(payload.userId)
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Convert ObjectIds to strings for JSON serialization
    const jobWithStringIds = {
      ...job,
      _id: job._id.toString(),
      userId: job.userId.toString(),
      mediaId: job.mediaId?.toString()
    };

    return NextResponse.json({ job: jobWithStringIds });

  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/queue/[jobId] - Cancel/delete a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { jobId } = await params;

    if (!ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<MediaGenerationJob>(Collections.GENERATION_JOBS);

    // Get job to check status
    const job = await collection.findOne({
      _id: new ObjectId(jobId),
      userId: new ObjectId(payload.userId)
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Only allow canceling queued or failed jobs
    if (job.status === 'processing') {
      return NextResponse.json(
        { error: 'Cannot cancel job that is currently processing' },
        { status: 400 }
      );
    }

    // Delete job
    const result = await collection.deleteOne({
      _id: new ObjectId(jobId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job cancelled successfully'
    });

  } catch (error) {
    console.error('Job cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/media/queue/[jobId] - Retry a failed job
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { jobId } = params;

    if (!ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<MediaGenerationJob>(Collections.GENERATION_JOBS);

    // Get job to check status
    const job = await collection.findOne({
      _id: new ObjectId(jobId),
      userId: new ObjectId(payload.userId)
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Only allow retrying failed jobs
    if (job.status !== 'failed') {
      return NextResponse.json(
        { error: 'Only failed jobs can be retried' },
        { status: 400 }
      );
    }

    // Reset job to queued
    const result = await collection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'queued',
          error: undefined
        },
        $unset: {
          completedAt: ''
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to retry job' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Job queued for retry',
      jobId
    });

  } catch (error) {
    console.error('Job retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry job' },
      { status: 500 }
    );
  }
}
