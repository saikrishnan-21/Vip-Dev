/**
 * Check SQS Worker Status
 * GET /api/test/worker-status
 * 
 * This endpoint helps diagnose if the SQS worker is running and processing messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const jobsCollection = db.collection(Collections.GENERATION_JOBS);
    
    // Get recent queued jobs
    const queuedJobs = await jobsCollection.find({
      status: 'queued'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Get jobs stuck in queued for more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const stuckJobs = await jobsCollection.find({
      status: 'queued',
      createdAt: { $lt: fiveMinutesAgo }
    })
      .sort({ createdAt: -1 })
      .toArray();

    // Get processing jobs
    const processingJobs = await jobsCollection.find({
      status: 'processing'
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();

    // Get recent completed jobs
    const recentCompleted = await jobsCollection.find({
      status: 'completed'
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      success: true,
      summary: {
        totalQueued: queuedJobs.length,
        stuckQueued: stuckJobs.length,
        processing: processingJobs.length,
        recentCompleted: recentCompleted.length,
      },
      queuedJobs: queuedJobs.map(job => ({
        jobId: job._id.toString(),
        topic: job.topic || job.mode,
        createdAt: job.createdAt,
        queuedFor: Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 1000 / 60) + ' minutes',
      })),
      stuckJobs: stuckJobs.map(job => ({
        jobId: job._id.toString(),
        topic: job.topic || job.mode,
        createdAt: job.createdAt,
        stuckFor: Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 1000 / 60) + ' minutes',
      })),
      processingJobs: processingJobs.map(job => ({
        jobId: job._id.toString(),
        topic: job.topic || job.mode,
        updatedAt: job.updatedAt,
        processingFor: Math.floor((Date.now() - new Date(job.updatedAt).getTime()) / 1000 / 60) + ' minutes',
      })),
      recommendations: [
        stuckJobs.length > 0 ? '⚠️ Jobs stuck in queued status - SQS worker may not be running' : null,
        processingJobs.length > 0 ? '⚠️ Jobs stuck in processing - FastAPI may be slow or failing' : null,
        queuedJobs.length === 0 && processingJobs.length === 0 ? '✅ No stuck jobs - system appears healthy' : null,
      ].filter(Boolean),
      instructions: [
        '1. Check if SQS worker is running: npm run worker:sqs',
        '2. Check worker logs for errors',
        '3. Check FastAPI is running and accessible',
        '4. Check AWS SQS console for messages in queue',
      ],
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

