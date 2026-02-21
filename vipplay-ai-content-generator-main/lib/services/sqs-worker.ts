/**
 * SQS Worker Service
 * Processes messages from SQS queues and handles content/image generation
 * 
 * Run this as a background process: npm run worker:sqs
 */

// Load environment variables from .env.local
// This must be done BEFORE any other imports that use process.env
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Determine which env file to load (try multiple locations)
const envFiles = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '.env.production'),
  resolve(process.cwd(), '.env.staging'),
];

let envLoaded = false;
let loadedFrom = '';

for (const envPath of envFiles) {
  if (existsSync(envPath)) {
    const result = config({ path: envPath });
    if (result.error) {
      console.warn(`[SQS Worker] Warning: Failed to load ${envPath}:`, result.error.message);
    } else {
      envLoaded = true;
      loadedFrom = envPath;
      console.log(`[SQS Worker] ✅ Loaded environment variables from: ${envPath}`);
      break; // Stop after first successful load
    }
  }
}

if (!envLoaded) {
  console.warn('[SQS Worker] ⚠️ No .env file found. Tried:', envFiles);
  console.warn('[SQS Worker] Using system environment variables only.');
}

// Debug: Log loaded environment variables (without exposing secrets)
const envCheck = {
  hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'NOT SET',
  hasArticlesQueue: !!process.env.SQS_ARTICLES_QUEUE_URL,
  hasImageQueue: !!process.env.SQS_IMAGE_QUEUE_URL,
  hasVideoQueue: !!process.env.SQS_VIDEO_QUEUE_URL,
  fastapiUrl: process.env.FASTAPI_URL || 'NOT SET',
  envFileLoaded: loadedFrom || 'NONE',
};

console.log('[SQS Worker] Environment check:', envCheck);

// Show first few characters of keys for verification (not full keys for security)
if (process.env.AWS_ACCESS_KEY_ID) {
  console.log(`[SQS Worker] AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...`);
}
if (process.env.SQS_ARTICLES_QUEUE_URL) {
  console.log(`[SQS Worker] SQS_ARTICLES_QUEUE_URL: ${process.env.SQS_ARTICLES_QUEUE_URL}`);
}

import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Agent } from 'undici';
import type { ArticleGenerationPayload, ImageGenerationPayload } from './sqs';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Create a custom undici agent with effectively unlimited timeouts for long-running AI generation
// The default headersTimeout of ~60s causes UND_ERR_HEADERS_TIMEOUT for AI tasks
// Set to 24 hours (effectively unlimited) - no timeout limit
const longRunningAgent = new Agent({
  headersTimeout: 86400000,      // 24 hours - effectively unlimited
  bodyTimeout: 86400000,         // 24 hours - effectively unlimited
  keepAliveTimeout: 3600000,     // 1 hour keep-alive
  keepAliveMaxTimeout: 86400000, // 24 hours max keep-alive
});

// Initialize SQS client
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

// Queue URLs
const ARTICLES_QUEUE_URL = process.env.SQS_ARTICLES_QUEUE_URL;
const IMAGE_QUEUE_URL = process.env.SQS_IMAGE_QUEUE_URL;
const VIDEO_QUEUE_URL = process.env.SQS_VIDEO_QUEUE_URL;

// Worker configuration - optimized for multi-user support
const POLL_INTERVAL = parseInt(process.env.SQS_POLL_INTERVAL || '3000', 10); // Reduced from 5000 to 3000 for faster polling
const MAX_MESSAGES = parseInt(process.env.SQS_MAX_MESSAGES || '10', 10); // Increased from 3 to 10 for better throughput
const VISIBILITY_TIMEOUT = parseInt(process.env.SQS_VISIBILITY_TIMEOUT || '600', 10); // Increased from 300 to 600 (10 minutes) for long jobs
const WAIT_TIME_SECONDS = parseInt(process.env.SQS_WAIT_TIME_SECONDS || '20', 10); // Long polling

// Concurrency limits - per user (not per worker) to prevent single user from monopolizing resources
const MAX_CONCURRENT_ARTICLES_PER_USER = parseInt(process.env.MAX_CONCURRENT_ARTICLES_PER_USER || '3', 10); // Max 3 articles per user
const MAX_CONCURRENT_IMAGES_PER_USER = parseInt(process.env.MAX_CONCURRENT_IMAGES_PER_USER || '5', 10); // Max 5 images per user (increased for better UX)
const MAX_CONCURRENT_VIDEOS_PER_USER = parseInt(process.env.MAX_CONCURRENT_VIDEOS_PER_USER || '2', 10); // Max 2 videos per user

// Worker-level limits (for overall worker capacity)
const MAX_CONCURRENT_ARTICLES = parseInt(process.env.MAX_CONCURRENT_ARTICLES || '10', 10); // Total articles across all users
const MAX_CONCURRENT_IMAGES = parseInt(process.env.MAX_CONCURRENT_IMAGES || '10', 10); // Total images across all users
const MAX_CONCURRENT_VIDEOS = parseInt(process.env.MAX_CONCURRENT_VIDEOS || '6', 10); // Total videos across all users

interface QueueMessage {
  jobId: string;
  userId: string;
  type: 'articles' | 'images' | 'videos';
  timestamp: string;
  payload: ArticleGenerationPayload | ImageGenerationPayload;
}

/**
 * Process article generation message
 */
async function processArticleMessage(message: QueueMessage): Promise<void> {
  const { jobId, userId, payload } = message;
  const articlePayload = payload as ArticleGenerationPayload;

  console.log(`[SQS Worker] Processing article generation job ${jobId}`);

  const db = await getDatabase();
  const jobsCollection = db.collection(Collections.GENERATION_JOBS);

  try {
    // First, check if job exists and if it's been cancelled
    const existingJob = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
    
    if (!existingJob) {
      console.warn(`[SQS Worker] Job ${jobId} not found in database. Skipping.`);
      return; // Job doesn't exist, skip processing
    }

    // Check if job has been cancelled by user
    if (existingJob.status === 'cancelled') {
      console.log(`[SQS Worker] ⏹️ Job ${jobId} was cancelled by user. Skipping processing and deleting message.`);
      // Don't update status, just skip processing
      return; // Exit early - message will be deleted by processMessage
    }

    // Update status to processing (FIFO - this job is now being processed)
    const jobUpdate = await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'processing',
          progress: 25,
          message: 'Processing (parallel) - Calling FastAPI to generate article...',
          queuePosition: 0, // No longer in queue, currently processing
          updatedAt: new Date(),
        },
      }
    );

    console.log(`[SQS Worker] ✅ Updated article job ${jobId} status from queued to processing`);

    // Determine FastAPI endpoint based on mode
    let fastapiEndpoint = '';
    let fastapiBody: any = {};

    switch (articlePayload.mode) {
      case 'topic':
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/topic`;
        fastapiBody = {
          topic: articlePayload.topic,
          word_count: articlePayload.wordCount,
          tone: articlePayload.tone,
          keywords: articlePayload.keywords || [],
          seo_optimization: articlePayload.seoOptimization,
          content_structure: articlePayload.contentStructure || 'auto',
          include_images: false,
          image_count: 0,
          image_style: 'auto',
        };
        break;

      case 'keywords':
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/keywords`;
        fastapiBody = {
          keywords: articlePayload.keywords || [],
          word_count: articlePayload.wordCount,
          tone: articlePayload.tone,
          seo_optimization: articlePayload.seoOptimization,
          keyword_density: articlePayload.keywordDensity || 'natural',
          content_structure: articlePayload.contentStructure || 'auto',
          include_images: false,
          image_count: 0,
          image_style: 'auto',
        };
        break;

      case 'trends':
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/trends`;
        fastapiBody = {
          trend_topic: articlePayload.trendTopic,
          trend_url: articlePayload.trendUrl || null,
          trend_description: articlePayload.trendDescription || null,
          trend_source: articlePayload.trendSource || null,
          trend_related_queries: articlePayload.trendRelatedQueries || [],
          region: articlePayload.region || 'US',
          word_count: articlePayload.wordCount,
          tone: articlePayload.tone,
          keywords: articlePayload.keywords || [],
          seo_optimization: articlePayload.seoOptimization,
          content_structure: articlePayload.contentStructure || 'auto',
          include_images: false,
          image_count: 0,
          image_style: 'auto',
        };
        break;

      case 'spin':
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/spin`;
        fastapiBody = {
          original_content: articlePayload.originalContent,
          spin_angle: articlePayload.spinAngle || 'fresh perspective',
          spin_intensity: articlePayload.spinIntensity || 'medium',
          word_count: articlePayload.wordCount,
          tone: articlePayload.tone,
          seo_optimization: articlePayload.seoOptimization,
          content_structure: articlePayload.contentStructure || 'auto',
          include_images: false,
          image_count: 0,
          image_style: 'auto',
        };
        break;

      default:
        throw new Error(`Unsupported generation mode: ${articlePayload.mode}`);
    }

    // Call FastAPI - no timeout, let it run until completion
    // Use custom undici agent to prevent UND_ERR_HEADERS_TIMEOUT
    const controller = new AbortController();
    
    // Update job with progress - starting FastAPI call
    await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'processing',
          progress: 25,
          message: 'Calling FastAPI to generate content...',
          updatedAt: new Date(),
        },
      }
    );
    console.log(`[SQS Worker] Job ${jobId} - Progress: 25% - Calling FastAPI at ${fastapiEndpoint}`);

    // Start heartbeat to update status periodically during long-running requests
    // Also checks for cancellation and aborts fetch if cancelled
    const startTime = Date.now();
    const heartbeatInterval = setInterval(async () => {
      try {
        const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
        
        // Check if job was cancelled - abort fetch immediately
        if (job && job.status === 'cancelled') {
          console.log(`[SQS Worker] ⏹️ Job ${jobId} was cancelled during FastAPI call. Aborting request.`);
          clearInterval(heartbeatInterval);
          controller.abort(); // Abort the fetch request
          return; // Exit early
        }
        
        if (job && job.status === 'processing') {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const progress = Math.min(25 + Math.floor(elapsed / 30), 70); // Gradually increase from 25% to 70% over time
          await jobsCollection.updateOne(
            { _id: new ObjectId(jobId) },
            {
              $set: {
                message: `Generating content... (${elapsed}s elapsed)`,
                progress: progress,
                updatedAt: new Date(),
              },
            }
          );
          console.log(`[SQS Worker] Job ${jobId} - Heartbeat: ${elapsed}s elapsed, progress: ${progress}%`);
        }
      } catch (heartbeatError) {
        // Ignore heartbeat errors, don't interrupt main flow
        console.warn(`[SQS Worker] Job ${jobId} - Heartbeat error (non-critical):`, heartbeatError);
      }
    }, 10000); // Check every 10 seconds for faster cancellation response (reduced from 30s)

    let response: Response;
    try {
      response = await fetch(fastapiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...fastapiBody,
          job_id: jobId,
          user_id: userId,
        }),
        signal: controller.signal,
        // @ts-ignore - dispatcher is a valid undici option but not typed in Node.js fetch
        dispatcher: longRunningAgent,
      } as RequestInit);
      clearInterval(heartbeatInterval);
      
      // Check if job was cancelled after fetch completes
      const postFetchCheck = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
      if (postFetchCheck && postFetchCheck.status === 'cancelled') {
        console.log(`[SQS Worker] ⏹️ Job ${jobId} was cancelled after FastAPI responded. Skipping processing.`);
        return; // Exit early - don't process the response
      }
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`[SQS Worker] Job ${jobId} - FastAPI responded after ${elapsed}s`);
    } catch (fetchError: any) {
      clearInterval(heartbeatInterval);
      if (fetchError.name === 'AbortError') {
        // Check if it was cancelled
        const cancelCheck = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
        if (cancelCheck && cancelCheck.status === 'cancelled') {
          console.log(`[SQS Worker] ⏹️ Job ${jobId} fetch aborted due to cancellation`);
          return; // Exit early - job was cancelled
        }
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        throw new Error(`FastAPI request was aborted after ${elapsed}s`);
      }
      throw new Error(`Failed to connect to FastAPI: ${fetchError.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`FastAPI error: ${response.status} ${errorText}`);
    }

    const fastapiData = await response.json();
    const fastapiElapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[SQS Worker] Job ${jobId} - FastAPI response parsed after ${fastapiElapsed}s total`, {
      success: fastapiData.success,
      hasContent: !!fastapiData.content,
      contentLength: fastapiData.content?.length || 0,
      message: fastapiData.message,
    });

    // Update job status based on response
    const isCompleted = fastapiData.success === true && fastapiData.content;
    const hasPartialContent = fastapiData.content && fastapiData.content.length > 0;

    // Update job status based on response
    await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: isCompleted ? 'processing' : hasPartialContent ? 'processing' : 'processing',
          progress: isCompleted ? 90 : hasPartialContent ? 85 : 75,
          message: fastapiData.message || (isCompleted ? 'Generation completed, saving to database...' : hasPartialContent ? 'Processing generated content...' : 'Processing FastAPI response...'),
          updatedAt: new Date(),
        },
      }
    );

    console.log(`[SQS Worker] Job ${jobId} - Progress: ${isCompleted ? '90%' : hasPartialContent ? '85%' : '75%'} - FastAPI responded`, {
      isCompleted,
      hasContent: hasPartialContent,
      contentLength: fastapiData.content?.length || 0,
    });

    // Check if job was cancelled during processing
    const currentJob = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
    if (currentJob && currentJob.status === 'cancelled') {
      console.log(`[SQS Worker] ⏹️ Job ${jobId} was cancelled during processing. Skipping save.`);
      return; // Exit early - message will be deleted by processMessage
    }

    // Save generated content if completed or has content
    if (isCompleted && fastapiData.content) {
      // Double-check cancellation before saving
      const jobCheck = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
      if (jobCheck && jobCheck.status === 'cancelled') {
        console.log(`[SQS Worker] ⏹️ Job ${jobId} was cancelled before save. Skipping.`);
        return;
      }

      // Update progress - starting to save content
      await jobsCollection.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            status: 'processing',
            progress: 95,
            message: 'Saving generated content to database...',
            updatedAt: new Date(),
          },
        }
      );
      console.log(`[SQS Worker] Job ${jobId} - Progress: 95% - Saving content`);
      
      let contentTitle: string;
      if (articlePayload.mode === 'spin') {
        if (articlePayload.sourceUrl) {
          try {
            const url = new URL(articlePayload.sourceUrl);
            const domain = url.hostname.replace('www.', '');
            contentTitle = `Article Spin: ${domain}`;
          } catch {
            contentTitle = articlePayload.spinAngle
              ? `Article Spin: ${articlePayload.spinAngle}`
              : 'Spun Article';
          }
        } else {
          contentTitle = articlePayload.spinAngle
            ? `Article Spin: ${articlePayload.spinAngle}`
            : 'Spun Article';
        }
      } else {
        contentTitle =
          articlePayload.topic ||
          articlePayload.trendTopic ||
          `Generated from ${articlePayload.mode}`;
      }

      const generatedContent = {
        userId: new ObjectId(userId),
        jobId: jobId,
        mode: articlePayload.mode,
        status: 'completed',
        title: contentTitle,
        content: fastapiData.content,
        wordCount: articlePayload.wordCount,
        tone: articlePayload.tone,
        keywords: articlePayload.keywords || [],
        imagesGenerated: 0,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const saveResult = await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
        console.log(`[SQS Worker] ✅ Article generation job ${jobId} completed successfully`, {
          contentId: saveResult.insertedId.toString(),
          contentLength: fastapiData.content?.length || 0,
          title: contentTitle,
        });

        // Final status update to ensure it's marked as completed
        const completedAt = new Date();
        const finalUpdate = await jobsCollection.updateOne(
          { _id: new ObjectId(jobId) },
          {
            $set: {
              status: 'completed',
              progress: 100,
              message: 'Generation completed successfully',
              completedAt: completedAt,
              updatedAt: completedAt,
            },
          }
        );
        
        if (finalUpdate.matchedCount === 0) {
          console.warn(`[SQS Worker] ⚠️ Job ${jobId} not found when updating final status`);
        } else if (finalUpdate.modifiedCount === 0) {
          console.warn(`[SQS Worker] ⚠️ Job ${jobId} status was already 'completed'`);
        } else {
          console.log(`[SQS Worker] ✅ Final status update: job ${jobId} marked as completed at ${completedAt.toISOString()}`);
        }
      } catch (saveError: any) {
        console.error(`[SQS Worker] Article generation job ${jobId} - Failed to save content:`, saveError);
        // Update job with save error
        const failedAt = new Date();
        const failUpdate = await jobsCollection.updateOne(
          { _id: new ObjectId(jobId) },
          {
            $set: {
              status: 'failed',
              progress: 0,
              error: `Failed to save content to database: ${saveError.message}`,
              message: `Generation completed but save failed: ${saveError.message}`,
              failedAt: failedAt,
              updatedAt: failedAt,
            },
          }
        );
        console.error(`[SQS Worker] ❌ Job ${jobId} marked as failed (matched: ${failUpdate.matchedCount}, modified: ${failUpdate.modifiedCount})`);
        throw saveError; // Re-throw to prevent message deletion
      }
    } else if (fastapiData.success === false) {
      throw new Error(fastapiData.message || 'Generation failed on FastAPI side');
    }
  } catch (error: any) {
    console.error(`[SQS Worker] Article generation job ${jobId} failed:`, error);

    // Re-throw to let processMessage handle error (mark as failed immediately)
    throw error;
  }
}

/**
 * Process image generation message
 */
async function processImageMessage(message: QueueMessage): Promise<void> {
  const { jobId, userId, payload } = message;
  const imagePayload = payload as ImageGenerationPayload;

  console.log(`[SQS Worker] Processing image generation job ${jobId}`);

  const db = await getDatabase();
  const jobsCollection = db.collection(Collections.GENERATION_JOBS);
  const mediaCollection = db.collection(Collections.MEDIA);

  try {
    // First, check if job exists and if it's been cancelled
    const existingJob = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
    
    if (!existingJob) {
      console.warn(`[SQS Worker] Image job ${jobId} not found in database. Skipping.`);
      return; // Job doesn't exist, skip processing
    }

    // Check if job has been cancelled by user
    if (existingJob.status === 'cancelled') {
      console.log(`[SQS Worker] ⏹️ Image job ${jobId} was cancelled by user. Skipping processing and deleting message.`);
      // Don't update status, just skip processing
      return; // Exit early - message will be deleted by processMessage
    }

    // Update job status to processing (FIFO - this job is now being processed)
    const jobUpdate = await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'processing',
          progress: 25,
          message: 'Processing (parallel) - Calling FastAPI to generate image...',
          queuePosition: 0, // No longer in queue, currently processing
          updatedAt: new Date(),
        },
      }
    );
    
    console.log(`[SQS Worker] ✅ Updated image job ${jobId} status from queued to processing`);

    // Call FastAPI image generation service
    // Use custom undici agent to prevent UND_ERR_HEADERS_TIMEOUT
    // No timeout - let it run until completion
    const startTime = Date.now();
    const controller = new AbortController();

    // Heartbeat interval to check for cancellation during image generation
    const heartbeatInterval = setInterval(async () => {
      try {
        const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
        
        // Check if job was cancelled - abort fetch immediately
        if (job && job.status === 'cancelled') {
          console.log(`[SQS Worker] ⏹️ Image job ${jobId} was cancelled during FastAPI call. Aborting request.`);
          clearInterval(heartbeatInterval);
          controller.abort(); // Abort the fetch request
          return; // Exit early
        }
        
        if (job && job.status === 'processing') {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const progress = Math.min(25 + Math.floor(elapsed / 30), 70);
          await jobsCollection.updateOne(
            { _id: new ObjectId(jobId) },
            {
              $set: {
                message: `Generating image... (${elapsed}s elapsed)`,
                progress: progress,
                updatedAt: new Date(),
              },
            }
          );
        }
      } catch (heartbeatError) {
        console.warn(`[SQS Worker] Image job ${jobId} - Heartbeat error (non-critical):`, heartbeatError);
      }
    }, 10000); // Check every 10 seconds for faster cancellation response

    let response: Response;
    try {
      response = await fetch(`${FASTAPI_URL}/api/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePayload.prompt,
          width: imagePayload.width || 1024,
          height: imagePayload.height || 1024,
          style: imagePayload.style || 'realistic',
          negative_prompt: imagePayload.negative_prompt,
        }),
        signal: controller.signal,
        // @ts-ignore - dispatcher is a valid undici option but not typed in Node.js fetch
        dispatcher: longRunningAgent,
      } as RequestInit);
      clearInterval(heartbeatInterval);
      
      // Check if job was cancelled after fetch completes
      const postFetchCheck = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
      if (postFetchCheck && postFetchCheck.status === 'cancelled') {
        console.log(`[SQS Worker] ⏹️ Image job ${jobId} was cancelled after FastAPI responded. Skipping processing.`);
        return; // Exit early - don't process the response
      }
      
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`[SQS Worker] Image job ${jobId} - FastAPI responded after ${elapsed}s`);
    } catch (fetchError: any) {
      clearInterval(heartbeatInterval);
      if (fetchError.name === 'AbortError') {
        // Check if it was cancelled
        const cancelCheck = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
        if (cancelCheck && cancelCheck.status === 'cancelled') {
          console.log(`[SQS Worker] ⏹️ Image job ${jobId} fetch aborted due to cancellation`);
          return; // Exit early - job was cancelled
        }
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        throw new Error(`FastAPI image generation request was aborted after ${elapsed}s`);
      }
      throw new Error(`Failed to connect to FastAPI: ${fetchError.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`FastAPI error: ${response.status} ${errorText}`);
    }

    const fastapiData = await response.json();
    const fastapiElapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[SQS Worker] Image job ${jobId} - FastAPI response parsed after ${fastapiElapsed}s total`, {
      success: fastapiData.success,
      hasImageUrl: !!fastapiData.image_url,
      error: fastapiData.error,
    });

    if (!fastapiData.success || !fastapiData.image_url) {
      const errorMessage = fastapiData.error || 'Image generation failed';
      throw new Error(errorMessage);
    }

    const s3ImageUrl = fastapiData.image_url;

    // Extract filename from S3 URL
    let filename = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.png`;
    try {
      const urlObj = new URL(s3ImageUrl);
      const pathParts = urlObj.pathname.split('/');
      if (pathParts.length > 0 && pathParts[pathParts.length - 1]) {
        filename = pathParts[pathParts.length - 1];
      }
    } catch (e) {
      console.warn('Could not parse S3 URL for filename extraction:', e);
    }

    // Create media asset
    const newMedia = {
      userId: new ObjectId(userId),
      filename,
      originalName: `${imagePayload.prompt.substring(0, 50)}.png`,
      mimeType: 'image/png',
      size: 0,
      type: 'image',
      source: 'ai_generated',
      url: s3ImageUrl,
      width: imagePayload.width || 1024,
      height: imagePayload.height || 1024,
      tags: [],
      generationPrompt: imagePayload.prompt,
      generationModel:
        process.env.HF_DEFAULT_IMAGE_MODEL || 'black-forest-labs/FLUX.1-dev',
      generationParams: {
        width: imagePayload.width || 1024,
        height: imagePayload.height || 1024,
        style: imagePayload.style || 'realistic',
        negative_prompt: imagePayload.negative_prompt,
      },
      usedInContent: [],
      usageCount: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if job was cancelled during processing
    const currentImageJob = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
    if (currentImageJob && currentImageJob.status === 'cancelled') {
      console.log(`[SQS Worker] ⏹️ Image job ${jobId} was cancelled during processing. Skipping save.`);
      return; // Exit early - message will be deleted by processMessage
    }

    // Update progress - saving image
    await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'processing',
          progress: 95,
          message: 'Saving generated image to database...',
          updatedAt: new Date(),
        },
      }
    );
    console.log(`[SQS Worker] Image job ${jobId} - Progress: 95% - Saving image`);

    // Double-check cancellation before saving
    const imageJobCheck = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
    if (imageJobCheck && imageJobCheck.status === 'cancelled') {
      console.log(`[SQS Worker] ⏹️ Image job ${jobId} was cancelled before save. Skipping.`);
      return;
    }

    // Save image to media collection
    let mediaResult;
    try {
      mediaResult = await mediaCollection.insertOne(newMedia);
      console.log(`[SQS Worker] ✅ Image generation job ${jobId} - Image saved to media collection`, {
        mediaId: mediaResult.insertedId.toString(),
        imageUrl: s3ImageUrl,
      });
    } catch (saveError: any) {
      console.error(`[SQS Worker] ❌ Failed to save image to media collection for job ${jobId}:`, saveError);
      throw new Error(`Failed to save image to database: ${saveError.message}`);
    }

    // Update job as completed - CRITICAL: This must succeed for job to show as completed
    const completedAt = new Date();
    try {
      const finalUpdate = await jobsCollection.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            status: 'completed',
            progress: 100,
            message: 'Image generation completed successfully',
            resultUrl: s3ImageUrl,
            mediaId: mediaResult.insertedId,
            completedAt: completedAt,
            updatedAt: completedAt,
          },
        }
      );

      if (finalUpdate.matchedCount === 0) {
        console.error(`[SQS Worker] ❌ CRITICAL: Image job ${jobId} not found when updating final status - job may be lost!`);
        throw new Error(`Job ${jobId} not found in database when trying to mark as completed`);
      } else if (finalUpdate.modifiedCount === 0) {
        console.warn(`[SQS Worker] ⚠️ Image job ${jobId} status was already 'completed'`);
      } else {
        console.log(`[SQS Worker] ✅ Image generation job ${jobId} completed successfully at ${completedAt.toISOString()}`, {
          mediaId: mediaResult.insertedId.toString(),
          imageUrl: s3ImageUrl,
          status: 'completed',
          progress: 100,
        });
      }
    } catch (updateError: any) {
      console.error(`[SQS Worker] ❌ CRITICAL: Failed to update job ${jobId} status to completed:`, updateError);
      // Re-throw to prevent message deletion - we need to retry
      throw new Error(`Failed to mark job as completed: ${updateError.message}`);
    }
  } catch (error: any) {
    console.error(`[SQS Worker] Image generation job ${jobId} failed:`, error);

    // Update job status to failed
    const failedAt = new Date();
    try {
      const failUpdate = await jobsCollection.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            status: 'failed',
            progress: 0,
            message: error.message || 'Image generation failed',
            error: error.message || 'Image generation failed',
            failedAt: failedAt,
            updatedAt: failedAt,
          },
        }
      );
      
      if (failUpdate.matchedCount === 0) {
        console.warn(`[SQS Worker] ⚠️ Image job ${jobId} not found when updating failed status`);
      } else {
        console.error(`[SQS Worker] ❌ Image job ${jobId} marked as failed at ${failedAt.toISOString()}`);
      }
    } catch (updateError: any) {
      console.error(`[SQS Worker] Failed to update image job ${jobId} status to failed:`, updateError);
    }

    // Re-throw to let processMessage handle error (mark as failed immediately)
    throw error;
  }
}

/**
 * Process a single SQS message
 */
async function processMessage(
  message: Message,
  queueUrl: string
): Promise<void> {
  if (!message.Body || !message.ReceiptHandle) {
    console.warn('[SQS Worker] Invalid message received - missing Body or ReceiptHandle');
    return;
  }

  let queueMessage: QueueMessage;
  try {
    queueMessage = JSON.parse(message.Body);
    console.log(`[SQS Worker] Parsed message for job ${queueMessage.jobId}, type: ${queueMessage.type}`);
  } catch (error) {
    console.error('[SQS Worker] Failed to parse message body:', error, 'Body:', message.Body);
    // Delete malformed message
    try {
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
      );
      console.log('[SQS Worker] Deleted malformed message');
    } catch (deleteError) {
      console.error('[SQS Worker] Failed to delete malformed message:', deleteError);
    }
    return;
  }

  const { jobId, type } = queueMessage;
  const startTime = Date.now();

  // Check if job has been cancelled before processing
  const db = await getDatabase();
  const jobsCollection = db.collection(Collections.GENERATION_JOBS);
  const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
  
  if (job && job.status === 'cancelled') {
    console.log(`[SQS Worker] ⏹️ Job ${jobId} was cancelled by user. Deleting message and skipping processing.`);
    // Delete message from queue since job is cancelled
    try {
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
      );
      console.log(`[SQS Worker] ✅ Deleted cancelled job ${jobId} message from queue`);
    } catch (deleteError: any) {
      console.error(`[SQS Worker] Failed to delete cancelled job ${jobId} message:`, deleteError);
    }
    return; // Skip processing
  }

  try {
    console.log(`[SQS Worker] Starting to process job ${jobId} (type: ${type})`);
    
    // Process based on message type
    switch (type) {
      case 'articles':
        await processArticleMessage(queueMessage);
        break;
      case 'images':
        await processImageMessage(queueMessage);
        break;
      case 'videos':
        console.log(`[SQS Worker] Video generation not yet implemented for job ${jobId}`);
        // TODO: Implement video generation
        break;
      default:
        console.warn(`[SQS Worker] Unknown message type: ${type} for job ${jobId}`);
        throw new Error(`Unknown message type: ${type}`);
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[SQS Worker] Successfully processed job ${jobId} in ${processingTime}s`);

    // Delete message from queue after successful processing
    try {
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
      );
      console.log(`[SQS Worker] Message deleted from queue for job ${jobId}`);
    } catch (deleteError: any) {
      console.error(`[SQS Worker] Failed to delete message for job ${jobId}:`, deleteError);
    }
  } catch (error: any) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(
      `[SQS Worker] Failed to process message for job ${jobId} after ${processingTime}s:`,
      {
        error: error.message,
        stack: error.stack,
        type: error.name,
      }
    );

    // Mark as failed immediately - no retries
    console.error(`[SQS Worker] ❌ Job ${jobId} failed. Marking as failed immediately.`);
    
    const db = await getDatabase();
    const jobsCollection = db.collection(Collections.GENERATION_JOBS);
    
    try {
      await jobsCollection.updateOne(
        { _id: new ObjectId(jobId) },
        {
          $set: {
            status: 'failed',
            progress: 0,
            error: error.message,
            message: `Generation failed: ${error.message}`,
            failedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
      console.error(`[SQS Worker] ❌ Job ${jobId} marked as failed`);
      
      // Delete message to prevent reprocessing
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
      );
      console.log(`[SQS Worker] Deleted message for failed job ${jobId}`);
    } catch (updateError: any) {
      console.error(`[SQS Worker] Failed to update job ${jobId} status:`, updateError);
    }
  }
}

/**
 * Poll and process messages from a queue
 */
/**
 * Poll and process messages from a queue
 */
/**
 * Poll and process messages from a queue with parallel processing support
 * Allows multiple jobs to process simultaneously up to the concurrency limit
 */
async function pollQueueParallel(
  queueUrl: string, 
  queueName: string,
  activeJobs: Set<string>,
  maxConcurrent: number
): Promise<void> {
  // Check if we've reached the concurrency limit
  if (activeJobs.size >= maxConcurrent) {
    if (Math.random() < 0.1) { // Log occasionally to avoid spam
      console.log(`[SQS Worker] ${queueName} queue at capacity (${activeJobs.size}/${maxConcurrent} active jobs)`);
    }
    return;
  }

  try {
    // Calculate how many messages we can process (up to concurrency limit)
    const availableSlots = maxConcurrent - activeJobs.size;
    const messagesToFetch = Math.min(MAX_MESSAGES, availableSlots);

    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: messagesToFetch,
      WaitTimeSeconds: WAIT_TIME_SECONDS,
      VisibilityTimeout: VISIBILITY_TIMEOUT,
      MessageAttributeNames: ['All'],
    });

    const response = await sqsClient.send(command);

    if (response.Messages && response.Messages.length > 0) {
      console.log(
        `[SQS Worker] Received ${response.Messages.length} message(s) from ${queueName} queue (${activeJobs.size}/${maxConcurrent} active, processing sequentially/FIFO)`
      );

      // Process messages sequentially (FIFO) to prevent loops and ensure proper completion
      // Check per-user limits before processing each message
      for (const message of response.Messages) {
        // Check worker-level concurrency limit first
        if (activeJobs.size >= maxConcurrent) {
          console.log(`[SQS Worker] ${queueName} queue at worker capacity (${activeJobs.size}/${maxConcurrent}), stopping processing`);
          break; // Stop processing more messages
        }

        let queueMessage: QueueMessage;
        try {
          queueMessage = JSON.parse(message.Body || '{}');
        } catch (error) {
          console.error(`[SQS Worker] Failed to parse message from ${queueName} queue:`, error);
          continue; // Skip invalid message
        }

        const jobId = queueMessage.jobId;
        const userId = queueMessage.userId;
        
        // Check per-user concurrency limit
        const db = await getDatabase();
        const jobsCollection = db.collection(Collections.GENERATION_JOBS);
        let maxPerUser: number;
        let userJobFilter: any = { userId: new ObjectId(userId), status: { $in: ['queued', 'processing'] } };
        
        if (queueName === 'articles') {
          maxPerUser = MAX_CONCURRENT_ARTICLES_PER_USER;
          userJobFilter.mode = { $exists: true }; // Only content generation jobs
        } else if (queueName === 'images') {
          maxPerUser = MAX_CONCURRENT_IMAGES_PER_USER;
          userJobFilter.prompt = { $exists: true }; // Only media generation jobs
          userJobFilter.mode = { $exists: false }; // Exclude content jobs
        } else {
          maxPerUser = MAX_CONCURRENT_VIDEOS_PER_USER;
          // Video jobs filter (if needed)
        }

        // Count active jobs for this user
        const userActiveJobs = await jobsCollection.countDocuments(userJobFilter);

        if (userActiveJobs >= maxPerUser) {
          console.log(`[SQS Worker] User ${userId} has ${userActiveJobs}/${maxPerUser} active ${queueName} jobs. Skipping job ${jobId} (will process when user has available slot)`);
          continue; // Skip this message, user has reached their limit
        }

        // Add to active jobs set
        activeJobs.add(jobId);
        console.log(`[SQS Worker] 🚀 Starting ${queueName} job ${jobId} for user ${userId} (${activeJobs.size}/${maxConcurrent} worker active, ${userActiveJobs}/${maxPerUser} user active)`);

        try {
          // Process the message completely (FIFO - one at a time to prevent loops)
          await processMessage(message, queueUrl);
          console.log(`[SQS Worker] ✅ Completed ${queueName} job ${jobId}`);
        } catch (error: any) {
          console.error(`[SQS Worker] ❌ ${queueName} job ${jobId} failed:`, error.message || error);
          // Don't delete message - it will be processed when user has available slot
          // Re-throw to prevent message deletion
          throw error;
        } finally {
          // Remove from active jobs set
          activeJobs.delete(jobId);
          console.log(`[SQS Worker] 🔓 ${queueName} job ${jobId} finished (${activeJobs.size}/${maxConcurrent} active)`);
        }
      }
    } else {
      // Log periodically (every 10th poll) to avoid spam
      if (Math.random() < 0.1) {
        console.log(`[SQS Worker] No messages available in ${queueName} queue`);
      }
    }
  } catch (error: any) {
    console.error(`[SQS Worker] Error polling ${queueName} queue:`, {
      error: error.message,
      code: error.Code,
      queueUrl: queueUrl,
    });
  }
}

/**
 * Main worker loop
 */
async function runWorker(): Promise<void> {
  console.log('='.repeat(60));
  console.log('[SQS Worker] Starting SQS worker...');
  console.log(`[SQS Worker] Poll interval: ${POLL_INTERVAL}ms (${POLL_INTERVAL / 1000}s)`);
  console.log(`[SQS Worker] Max messages per poll: ${MAX_MESSAGES}`);
  console.log(`[SQS Worker] Visibility timeout: ${VISIBILITY_TIMEOUT}s`);
  console.log(`[SQS Worker] Long polling wait time: ${WAIT_TIME_SECONDS}s`);
  console.log(`[SQS Worker] FastAPI URL: ${FASTAPI_URL}`);
  console.log('='.repeat(60));

  // Check AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('[SQS Worker] ❌ AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    process.exit(1);
  }
  console.log('[SQS Worker] ✅ AWS credentials configured');

  // Check queue URLs
  if (!ARTICLES_QUEUE_URL && !IMAGE_QUEUE_URL && !VIDEO_QUEUE_URL) {
    console.error('[SQS Worker] ❌ No SQS queues configured. Please set SQS_ARTICLES_QUEUE_URL, SQS_IMAGE_QUEUE_URL, or SQS_VIDEO_QUEUE_URL.');
    process.exit(1);
  }

  // Log configured queues
  console.log('[SQS Worker] Configured queues:');
  if (ARTICLES_QUEUE_URL) {
    console.log(`  ✅ Articles: ${ARTICLES_QUEUE_URL}`);
  }
  if (IMAGE_QUEUE_URL) {
    console.log(`  ✅ Images: ${IMAGE_QUEUE_URL}`);
  }
  if (VIDEO_QUEUE_URL) {
    console.log(`  ✅ Videos: ${VIDEO_QUEUE_URL}`);
  }

  // Test MongoDB connection
  try {
    const db = await getDatabase();
    await db.admin().ping();
    console.log('[SQS Worker] ✅ MongoDB connection successful');
  } catch (error: any) {
    console.error('[SQS Worker] ❌ MongoDB connection failed:', error.message);
    console.error('[SQS Worker] Worker will continue but may fail when processing messages');
  }

  // Test FastAPI connection (non-blocking, quick check)
  try {
    const healthController = new AbortController();
    const healthTimeout = setTimeout(() => healthController.abort(), 5000); // 5 second timeout for health check
    
    const response = await fetch(`${FASTAPI_URL}/health`, {
      method: 'GET',
      signal: healthController.signal,
      // @ts-ignore - dispatcher is a valid undici option
      dispatcher: longRunningAgent,
    } as RequestInit);
    
    clearTimeout(healthTimeout);
    
    if (response.ok) {
      console.log('[SQS Worker] ✅ FastAPI connection successful');
    } else {
      console.warn(`[SQS Worker] ⚠️ FastAPI returned status ${response.status} (may still be starting up)`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      console.warn('[SQS Worker] ⚠️ FastAPI health check timed out (FastAPI may be starting up or slow to respond)');
      console.warn('[SQS Worker] Worker will continue - FastAPI will be checked when processing messages');
    } else {
      console.warn(`[SQS Worker] ⚠️ FastAPI health check failed: ${error.message}`);
      console.warn('[SQS Worker] Worker will continue - FastAPI will be checked when processing messages');
    }
  }

  console.log('[SQS Worker] 🚀 Worker ready, starting to poll queues...');
  console.log(`[SQS Worker] Concurrency limits (per user): Articles=${MAX_CONCURRENT_ARTICLES_PER_USER}, Images=${MAX_CONCURRENT_IMAGES_PER_USER}, Videos=${MAX_CONCURRENT_VIDEOS_PER_USER}`);
  console.log(`[SQS Worker] Worker-level limits: Articles=${MAX_CONCURRENT_ARTICLES}, Images=${MAX_CONCURRENT_IMAGES}, Videos=${MAX_CONCURRENT_VIDEOS}`);
  console.log('='.repeat(60));

  // OPTIMIZED PARALLEL PROCESSING: Allow multiple jobs per queue type for faster processing
  // This provides much better UX - multiple users can get results quickly
  // Articles: Process up to MAX_CONCURRENT_ARTICLES in parallel
  // Images: Process up to MAX_CONCURRENT_IMAGES in parallel
  // Videos: Process up to MAX_CONCURRENT_VIDEOS in parallel
  // All queue types can process simultaneously
  const activeArticles = new Set<string>(); // Track active article job IDs
  const activeImages = new Set<string>();   // Track active image job IDs
  const activeVideos = new Set<string>();   // Track active video job IDs
  
  const pollQueuesInParallel = async () => {
    // Poll all queues in parallel - each queue can process multiple jobs simultaneously
    const pollPromises: Promise<void>[] = [];
    
    // Articles queue - process up to MAX_CONCURRENT_ARTICLES in parallel
    if (ARTICLES_QUEUE_URL) {
      pollPromises.push(
        pollQueueParallel(
          ARTICLES_QUEUE_URL, 
          'articles',
          activeArticles,
          MAX_CONCURRENT_ARTICLES
        )
      );
    }
    
    // Images queue - process up to MAX_CONCURRENT_IMAGES in parallel (can run parallel with articles)
    if (IMAGE_QUEUE_URL) {
      pollPromises.push(
        pollQueueParallel(
          IMAGE_QUEUE_URL, 
          'images',
          activeImages,
          MAX_CONCURRENT_IMAGES
        )
      );
    }
    
    // Videos queue - process up to MAX_CONCURRENT_VIDEOS in parallel (can run parallel with articles/images)
    if (VIDEO_QUEUE_URL) {
      pollPromises.push(
        pollQueueParallel(
          VIDEO_QUEUE_URL, 
          'videos',
          activeVideos,
          MAX_CONCURRENT_VIDEOS
        )
      );
    }
    
    // Wait for all queue polls to complete (they run in parallel)
    await Promise.allSettled(pollPromises);
  };

  // Start polling immediately, then continue with interval
  // Poll queues in parallel - each maintains FIFO within its own type
  pollQueuesInParallel();
  setInterval(pollQueuesInParallel, POLL_INTERVAL);
}

// Run worker if this file is executed directly
if (require.main === module) {
  runWorker().catch((error) => {
    console.error('[SQS Worker] Fatal error:', error);
    process.exit(1);
  });
}

export { runWorker };

