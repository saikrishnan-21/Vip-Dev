/**
 * AWS SQS Service
 * Handles sending messages to SQS queues for asynchronous processing
 */

import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

// Initialize SQS client
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // Will use default AWS credentials chain if not provided
});

// Queue URLs from environment
const ARTICLES_QUEUE_URL = process.env.SQS_ARTICLES_QUEUE_URL;
const IMAGE_QUEUE_URL = process.env.SQS_IMAGE_QUEUE_URL;
const VIDEO_QUEUE_URL = process.env.SQS_VIDEO_QUEUE_URL;

/**
 * Check if SQS is configured
 * Requires both queue URLs and AWS credentials
 */
export function isSQSConfigured(): boolean {
  const hasQueueUrl = !!(ARTICLES_QUEUE_URL || IMAGE_QUEUE_URL || VIDEO_QUEUE_URL);
  const hasCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  return hasQueueUrl && hasCredentials;
}

/**
 * Article generation payload interface
 */
export interface ArticleGenerationPayload {
  mode: 'topic' | 'keywords' | 'trends' | 'spin';
  topic?: string;
  keywords?: string[];
  keywordDensity?: string;
  trendTopic?: string;
  trendUrl?: string;
  trendDescription?: string;
  trendSource?: string;
  trendRelatedQueries?: string[];
  sourceUrl?: string;
  originalContent?: string;
  wordCount: number;
  tone: string;
  region?: string;
  spinAngle?: string;
  spinIntensity?: string;
  seoOptimization: boolean;
  contentStructure?: string;
  includeImages?: boolean;
  imageCount?: number;
  imageStyle?: string;
}

/**
 * Image generation payload interface
 */
export interface ImageGenerationPayload {
  prompt: string;
  width?: number;
  height?: number;
  style?: string;
  negative_prompt?: string;
}

/**
 * Queue message structure
 */
interface QueueMessage {
  jobId: string;
  userId: string;
  type: 'articles' | 'images' | 'videos';
  timestamp: string;
  payload: ArticleGenerationPayload | ImageGenerationPayload;
}

/**
 * Send article generation job to SQS queue
 */
export async function queueArticleGeneration(
  jobId: string,
  userId: string,
  payload: ArticleGenerationPayload
): Promise<void> {
  if (!ARTICLES_QUEUE_URL) {
    throw new Error('SQS_ARTICLES_QUEUE_URL is not configured');
  }

  const message: QueueMessage = {
    jobId,
    userId,
    type: 'articles',
    timestamp: new Date().toISOString(),
    payload,
  };

  try {
    const command = new SendMessageCommand({
      QueueUrl: ARTICLES_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        jobId: {
          DataType: 'String',
          StringValue: jobId,
        },
        userId: {
          DataType: 'String',
          StringValue: userId,
        },
        type: {
          DataType: 'String',
          StringValue: 'articles',
        },
      },
    });

    const response = await sqsClient.send(command);
    console.log(`[SQS] Article generation job ${jobId} queued successfully`, {
      messageId: response.MessageId,
      queueUrl: ARTICLES_QUEUE_URL,
      md5OfBody: (response as any).MD5OfBody || 'N/A',
    });
  } catch (error: any) {
    console.error(`[SQS] Failed to queue article generation job ${jobId}:`, {
      error: error.message,
      code: error.Code,
      queueUrl: ARTICLES_QUEUE_URL,
      stack: error.stack,
    });
    throw new Error(`Failed to queue article generation: ${error.message}`);
  }
}

/**
 * Send image generation job to SQS queue
 */
export async function queueImageGeneration(
  jobId: string,
  userId: string,
  payload: ImageGenerationPayload
): Promise<void> {
  if (!IMAGE_QUEUE_URL) {
    throw new Error('SQS_IMAGE_QUEUE_URL is not configured');
  }

  const message: QueueMessage = {
    jobId,
    userId,
    type: 'images',
    timestamp: new Date().toISOString(),
    payload,
  };

  try {
    const command = new SendMessageCommand({
      QueueUrl: IMAGE_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        jobId: {
          DataType: 'String',
          StringValue: jobId,
        },
        userId: {
          DataType: 'String',
          StringValue: userId,
        },
        type: {
          DataType: 'String',
          StringValue: 'images',
        },
      },
    });

    const response = await sqsClient.send(command);
    console.log(`[SQS] Image generation job ${jobId} queued successfully`, {
      messageId: response.MessageId,
      queueUrl: IMAGE_QUEUE_URL,
      md5OfBody: (response as any).MD5OfBody || 'N/A',
    });
  } catch (error: any) {
    console.error(`[SQS] Failed to queue image generation job ${jobId}:`, {
      error: error.message,
      code: error.Code,
      queueUrl: IMAGE_QUEUE_URL,
      stack: error.stack,
    });
    throw new Error(`Failed to queue image generation: ${error.message}`);
  }
}

/**
 * Send video generation job to SQS queue (for future use)
 */
export async function queueVideoGeneration(
  jobId: string,
  userId: string,
  payload: any
): Promise<void> {
  if (!VIDEO_QUEUE_URL) {
    throw new Error('SQS_VIDEO_QUEUE_URL is not configured');
  }

  const message: QueueMessage = {
    jobId,
    userId,
    type: 'videos',
    timestamp: new Date().toISOString(),
    payload,
  };

  try {
    const command = new SendMessageCommand({
      QueueUrl: VIDEO_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        jobId: {
          DataType: 'String',
          StringValue: jobId,
        },
        userId: {
          DataType: 'String',
          StringValue: userId,
        },
        type: {
          DataType: 'String',
          StringValue: 'videos',
        },
      },
    });

    await sqsClient.send(command);
    console.log(`[SQS] Video generation job ${jobId} queued successfully`);
  } catch (error: any) {
    console.error(`[SQS] Failed to queue video generation job ${jobId}:`, error);
    throw new Error(`Failed to queue video generation: ${error.message}`);
  }
}

