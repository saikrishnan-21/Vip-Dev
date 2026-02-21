/**
 * Media Queue Management API Route
 * VIP-10406: Media Queue Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { MediaGenerationJob } from '@/lib/types/media';

/**
 * POST /api/media/queue - Queue multiple image generation jobs
 * Body: { jobs: [{ prompt, width?, height?, style?, negative_prompt? }] }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { jobs } = body;

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'Jobs array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate max queue size (e.g., max 50 jobs at once)
    if (jobs.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 jobs can be queued at once' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<MediaGenerationJob>(Collections.GENERATION_JOBS);

    const now = new Date();
    const userId = new ObjectId(payload.userId);

    // Create job documents
    const jobDocuments: MediaGenerationJob[] = jobs.map(job => ({
      userId,
      prompt: job.prompt,
      model: job.model || process.env.HF_DEFAULT_IMAGE_MODEL || 'black-forest-labs/FLUX.1-dev',
      status: 'queued',
      params: {
        width: job.width || 1024,
        height: job.height || 1024,
        style: job.style || 'realistic',
        negative_prompt: job.negative_prompt
      },
      createdAt: now
    }));

    // Insert all jobs
    const result = await collection.insertMany(jobDocuments);
    const jobIds = Object.values(result.insertedIds);

    return NextResponse.json({
      message: `${jobIds.length} jobs queued successfully`,
      jobIds,
      queued: jobIds.length
    }, { status: 201 });

  } catch (error) {
    console.error('Queue jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to queue jobs' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/queue - Get queue status and jobs
 * Query params: status, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();
    const collection = db.collection<MediaGenerationJob>(Collections.GENERATION_JOBS);

    const filter: any = { userId: new ObjectId(payload.userId) };
    if (status) {
      filter.status = status;
    }

    // Get queue statistics
    const stats = await collection.aggregate([
      { $match: { userId: new ObjectId(payload.userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const queueStats = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    stats.forEach(stat => {
      if (stat._id in queueStats) {
        queueStats[stat._id as keyof typeof queueStats] = stat.count;
      }
    });

    // Get jobs
    const total = await collection.countDocuments(filter);

    const jobs = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    const jobsWithStringIds = jobs.map((job: any) => ({
      ...job,
      _id: job._id.toString(),
      userId: job.userId.toString(),
      mediaId: job.mediaId?.toString()
    }));

    return NextResponse.json({
      stats: queueStats,
      jobs: jobsWithStringIds,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Queue status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/queue - Clear completed/failed jobs from queue
 * Query param: olderThan (date string, optional)
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');

    const db = await getDatabase();
    const collection = db.collection<MediaGenerationJob>(Collections.GENERATION_JOBS);

    const filter: any = {
      userId: new ObjectId(payload.userId),
      status: { $in: ['completed', 'failed'] }
    };

    if (olderThan) {
      const date = new Date(olderThan);
      if (!isNaN(date.getTime())) {
        filter.createdAt = { $lt: date };
      }
    }

    const result = await collection.deleteMany(filter);

    return NextResponse.json({
      message: 'Queue cleaned successfully',
      deleted: result.deletedCount
    });

  } catch (error) {
    console.error('Queue cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to clean queue' },
      { status: 500 }
    );
  }
}
