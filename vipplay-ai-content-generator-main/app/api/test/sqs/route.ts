/**
 * Test endpoint for SQS message sending
 * POST /api/test/sqs
 * 
 * This endpoint helps diagnose SQS configuration issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { queueArticleGeneration, isSQSConfigured } from '@/lib/services/sqs';

export async function POST(request: NextRequest) {
  try {
    console.log('[SQS Test] Starting SQS test...');
    
    // Check if SQS is configured
    const configured = isSQSConfigured();
    console.log('[SQS Test] isSQSConfigured():', configured);
    
    if (!configured) {
      return NextResponse.json({
        success: false,
        error: 'SQS is not configured',
        details: {
          hasQueueUrls: !!(process.env.SQS_ARTICLES_QUEUE_URL || process.env.SQS_IMAGE_QUEUE_URL || process.env.SQS_VIDEO_QUEUE_URL),
          hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
          articlesQueueUrl: process.env.SQS_ARTICLES_QUEUE_URL || 'NOT SET',
          awsRegion: process.env.AWS_REGION || 'NOT SET',
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        }
      }, { status: 400 });
    }

    // Create a test message
    const testJobId = `test-${Date.now()}`;
    const testUserId = 'test-user-id';
    
    console.log('[SQS Test] Sending test message...', {
      jobId: testJobId,
      userId: testUserId,
      queueUrl: process.env.SQS_ARTICLES_QUEUE_URL,
    });

    try {
      await queueArticleGeneration(testJobId, testUserId, {
        mode: 'topic',
        topic: 'Test Article - SQS Configuration Test',
        wordCount: 500,
        tone: 'Professional',
        seoOptimization: true,
      });

      console.log('[SQS Test] Message sent successfully');

      return NextResponse.json({
        success: true,
        message: 'Test message sent to SQS successfully',
        jobId: testJobId,
        instructions: [
          '1. Check AWS SQS console - message should appear in prod-vipplay-articles queue',
          '2. Check Next.js server logs for "[SQS] Article generation job ... queued successfully"',
          '3. If message appears in queue, SQS sending is working correctly',
          '4. If message does not appear, check AWS credentials and queue URL',
        ]
      });
    } catch (sqsError: any) {
      console.error('[SQS Test] Failed to send message:', sqsError);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to send message to SQS',
        details: {
          message: sqsError.message,
          code: sqsError.Code,
          name: sqsError.name,
          stack: sqsError.stack,
        },
        troubleshooting: [
          '1. Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct',
          '2. Verify SQS_ARTICLES_QUEUE_URL matches AWS console exactly',
          '3. Check IAM user has sqs:SendMessage permission',
          '4. Verify AWS_REGION is set to us-east-1',
        ]
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[SQS Test] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/test/sqs - Check SQS configuration
 */
export async function GET() {
  const config = {
    isConfigured: isSQSConfigured(),
    environment: {
      articlesQueueUrl: process.env.SQS_ARTICLES_QUEUE_URL || 'NOT SET',
      imageQueueUrl: process.env.SQS_IMAGE_QUEUE_URL || 'NOT SET',
      videoQueueUrl: process.env.SQS_VIDEO_QUEUE_URL || 'NOT SET',
      awsRegion: process.env.AWS_REGION || 'NOT SET',
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      accessKeyPrefix: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 4) + '...' : 'NOT SET',
    }
  };

  return NextResponse.json({
    success: true,
    configuration: config,
    status: config.isConfigured ? '✅ SQS is configured' : '❌ SQS is not configured',
  });
}

