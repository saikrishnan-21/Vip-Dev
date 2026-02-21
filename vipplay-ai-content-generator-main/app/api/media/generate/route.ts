/**
 * AI Image Generation API Route
 * VIP-10402: Generate AI Images
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { MediaAsset, MediaGenerationJob } from '@/lib/types/media';
import {
  queueImageGeneration,
  isSQSConfigured,
  type ImageGenerationPayload,
} from '@/lib/services/sqs';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/media/generate - Generate image using AI
 * Body: { prompt, width?, height?, style?, negative_prompt? }
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

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const {
      prompt,
      width = 1024,
      height = 1024,
      style = 'realistic',
      negative_prompt
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const jobsCollection = db.collection<MediaGenerationJob>(Collections.GENERATION_JOBS);
    const mediaCollection = db.collection<MediaAsset>(Collections.MEDIA);

    // Check queue limit: Maximum 2 concurrent media jobs (queued or processing) per user
    // Only count media jobs (images/videos), not content generation jobs
    const userId = new ObjectId(payload.userId);
    
    // Count only media jobs (queued or processing) - images and videos
    // Media jobs have: prompt exists, mode does NOT exist
    const mediaJobsCount = await jobsCollection.countDocuments({
      userId: userId,
      status: { $in: ['queued', 'processing'] },
      prompt: { $exists: true },
      mode: { $exists: false }, // Exclude content generation jobs
    });

    // Debug logging
    console.log(`[Queue Limit Check - Media] User ${userId} has ${mediaJobsCount} active media jobs (images/videos)`);

    // Media library queue limit: Maximum 2 concurrent jobs
    const MAX_CONCURRENT_MEDIA_JOBS = parseInt(process.env.MAX_CONCURRENT_MEDIA_JOBS || '2', 10);
    if (mediaJobsCount >= MAX_CONCURRENT_MEDIA_JOBS) {
      // Get active media jobs for better error message
      const activeMediaJobs = await jobsCollection.find({
        userId: userId,
        status: { $in: ['queued', 'processing'] },
        prompt: { $exists: true },
        mode: { $exists: false },
      }).limit(5).toArray();
      
      console.log(`[Queue Limit Check - Media] Active media jobs:`, activeMediaJobs.map(j => ({ 
        id: j._id, 
        status: j.status, 
        prompt: j.prompt?.substring(0, 50),
        createdAt: j.createdAt 
      })));
      
      return NextResponse.json(
        {
          error: `You have ${mediaJobsCount} media job(s) in queue. Maximum ${MAX_CONCURRENT_MEDIA_JOBS} concurrent media jobs allowed. Please wait for current jobs to complete or cancel them before creating new ones.`,
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    // Create generation job
    const now = new Date();

    const job: MediaGenerationJob = {
      userId,
      prompt,
      model: process.env.HF_DEFAULT_IMAGE_MODEL || 'black-forest-labs/FLUX.1-dev',
      status: 'queued',
      params: {
        width,
        height,
        style,
        negative_prompt
      },
      createdAt: now
    };

    const jobResult = await jobsCollection.insertOne(job);
    const jobId = jobResult.insertedId;

    // Use SQS queue if configured, otherwise fall back to direct FastAPI call
    if (isSQSConfigured()) {
      try {
        // Prepare payload for SQS
        const sqsPayload: ImageGenerationPayload = {
          prompt,
          width,
          height,
          style,
          negative_prompt,
        };

        // Queue the job in SQS
        await queueImageGeneration(jobId.toString(), payload.userId, sqsPayload);

        // Return immediately with jobId (HTTP 202 Accepted for background processing)
        return NextResponse.json(
          {
            message: 'Image generation job queued successfully',
            jobId: jobId.toString(),
            queued: true,
          },
          { status: 202 }
        );
      } catch (sqsError: any) {
        console.error(`[Image Generation] SQS queueing failed for job ${jobId}:`, sqsError);
        // Fall through to direct FastAPI call if SQS fails
        console.log(`[Image Generation] Falling back to direct FastAPI call for job ${jobId}`);
      }
    }

    try {
      // Update job status to processing
      await jobsCollection.updateOne(
        { _id: jobId },
        { $set: { status: 'processing' } }
      );

      // Fallback: Call FastAPI image generation service directly with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      let fastapiResponse;
      try {
        fastapiResponse = await fetch(`${FASTAPI_URL}/api/images/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            width,
            height,
            style,
            negative_prompt,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Image generation request timed out');
        }
        throw fetchError;
      }

      if (!fastapiResponse.ok) {
        let errorData: any;
        try {
          errorData = await fastapiResponse.json();
        } catch {
          const errorText = await fastapiResponse.text();
          errorData = { detail: errorText };
        }
        
        // Preserve the original error message from FastAPI
        const errorMessage = errorData.detail || errorData.error || `FastAPI returned ${fastapiResponse.status}`;
        
        // Create error with message that includes safety information
        const error = new Error(errorMessage);
        // Add status code to error for better handling
        (error as any).status = fastapiResponse.status;
        throw error;
      }

      const fastapiData = await fastapiResponse.json();

      if (!fastapiData.success || !fastapiData.image_url) {
        throw new Error(fastapiData.error || 'Image generation failed');
      }

      const s3ImageUrl = fastapiData.image_url; // This is now an S3 public URL

      // Extract filename from S3 URL (format: https://bucket.s3.region.amazonaws.com/path/to/file.png)
      // Or use the last part of the path
      let filename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
      try {
        const urlObj = new URL(s3ImageUrl);
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 0 && pathParts[pathParts.length - 1]) {
          filename = pathParts[pathParts.length - 1];
        }
      } catch (e) {
        // If URL parsing fails, use generated filename
        console.warn('Could not parse S3 URL for filename extraction:', e);
      }

      // Create media asset
      const newMedia: MediaAsset = {
        userId,
        filename,
        originalName: `${prompt.substring(0, 50)}.png`,
        mimeType: 'image/png',
        size: 0, // Size not available from FastAPI response, can be updated later if needed
        type: 'image',
        source: 'ai_generated',
        url: s3ImageUrl, // S3 public URL
        width,
        height,
        tags: [],
        generationPrompt: prompt,
        generationModel: process.env.HF_DEFAULT_IMAGE_MODEL || 'black-forest-labs/FLUX.1-dev',
        generationParams: { width, height, style, negative_prompt },
        usedInContent: [],
        usageCount: 0,
        createdAt: now,
        updatedAt: now
      } as any; // Type assertion to allow status field
      
      // Add status field (required by database schema)
      (newMedia as any).status = 'active';

      const mediaResult = await mediaCollection.insertOne(newMedia);

      // Update job as completed
      await jobsCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'completed',
            resultUrl: s3ImageUrl,
            mediaId: mediaResult.insertedId,
            completedAt: new Date()
          }
        }
      );

      // Convert ObjectIds to strings for JSON serialization
      const mediaWithStringIds = {
        ...newMedia,
        _id: mediaResult.insertedId.toString(),
        userId: newMedia.userId.toString(),
        usedInContent: []
      };

      return NextResponse.json({
        message: 'Image generated successfully',
        jobId: jobId.toString(),
        mediaId: mediaResult.insertedId.toString(),
        media: mediaWithStringIds
      }, { status: 201 });

    } catch (genError: any) {
      // Update job as failed (wrap in try-catch to prevent unhandled errors)
      try {
        await jobsCollection.updateOne(
          { _id: jobId },
          {
            $set: {
              status: 'failed',
              error: genError.message,
              completedAt: new Date()
            }
          }
        );
      } catch (dbError) {
        console.error('Failed to update job status:', dbError);
        // Continue with error response even if DB update fails
      }

      // Handle service unavailable errors
      if (genError.message?.includes('ECONNREFUSED') || genError.message?.includes('fetch failed')) {
        return NextResponse.json(
          { error: 'Image generation service unavailable', details: 'FastAPI service is not running or not accessible' },
          { status: 503 }
        );
      }

      // Handle service not configured errors
      if (genError.message?.includes('not configured') || genError.message?.includes('501')) {
        return NextResponse.json(
          { error: 'Image generation service not configured', details: genError.message },
          { status: 503 }
        );
      }

      // Handle safety-related errors (400 status from FastAPI)
      // Check both the error message and status code
      const isSafetyError = genError.status === 400 || 
                           genError.message?.includes('inappropriate content') || 
                           genError.message?.includes('safety') ||
                           genError.message?.includes('cannot be processed') ||
                           genError.message?.includes('cannot be displayed') ||
                           genError.message?.includes('blocked');
      
      if (isSafetyError) {
        return NextResponse.json(
          { 
            error: 'Content blocked by safety measures', 
            details: genError.message || 'The prompt or generated image contains inappropriate content and cannot be processed.',
            blocked: true
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Image generation failed', details: genError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/generate - List generation jobs
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
      // Support comma-separated status values (e.g., "queued,processing")
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim());
        filter.status = { $in: statuses };
      } else {
        filter.status = status;
      }
    }

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
      jobs: jobsWithStringIds,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Jobs list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

