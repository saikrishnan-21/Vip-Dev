import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/content/jobs
 * List user's generation jobs with filtering and pagination
 * Query params: status, mode, page, limit
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // queued, processing, completed, failed, cancelled
    const mode = searchParams.get('mode'); // topic, keywords, trends, spin
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const db = await getDatabase();
    const jobsCollection = db.collection(Collections.GENERATION_JOBS);

    // Build filter
    // Exclude media generation jobs (they don't have a 'mode' field)
    // Media jobs have 'prompt' field but no 'mode' field
    const filter: any = {
      userId: new ObjectId(user.userId),
    };

    // Only include content generation jobs (they have 'mode' field)
    // Media generation jobs don't have 'mode' field
    if (mode) {
      // If mode is specified, filter by that mode
      filter.mode = mode;
    } else {
      // If no mode specified, only show jobs that have a mode field (content jobs)
      filter.mode = { $exists: true };
    }

    if (status) {
      // Support comma-separated status values (e.g., "queued,processing")
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim());
        filter.status = { $in: statuses };
      } else {
        filter.status = status;
      }
    }

    // Fetch jobs with pagination
    const [jobs, total] = await Promise.all([
      jobsCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      jobsCollection.countDocuments(filter),
    ]);

    // Convert ObjectId to string for JSON serialization
    const jobsWithStringIds = jobs.map((job: any) => ({
      ...job,
      _id: job._id.toString(),
      userId: job.userId.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        jobs: jobsWithStringIds,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('[Get Generation Jobs Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch generation jobs',
      },
      { status: 500 }
    );
  }
});

