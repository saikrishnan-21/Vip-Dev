# SQS Queue Setup Guide

This guide explains how to set up and use the AWS SQS queue mechanism for asynchronous content and image generation.

## Overview

The SQS queue architecture decouples the API layer from the processing layer, providing:
- ✅ Immediate API responses (< 1 second)
- ✅ No timeout issues
- ✅ Automatic retry mechanism
- ✅ Independent scaling of workers
- ✅ Better fault tolerance

## Prerequisites

1. **AWS Account** with SQS access
2. **SQS Queues** already created:
   - `prod-vipplay-articles` - For article generation
   - `prod-vipplay-image` - For image generation
   - `prod-vipplay-video` - For video generation (future use)

## Installation

1. **Install AWS SDK for SQS:**
```bash
npm install @aws-sdk/client-sqs
```

2. **Configure Environment Variables:**

Add these to your `.env.local` or `.env.production`:

```bash
# AWS SQS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# SQS Queue URLs
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image
SQS_VIDEO_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-video

# SQS Worker Configuration (Optional - defaults shown)
SQS_POLL_INTERVAL=5000          # Poll every 5 seconds
SQS_MAX_MESSAGES=10            # Process up to 10 messages per poll
SQS_VISIBILITY_TIMEOUT=300     # 5 minutes visibility timeout
SQS_WAIT_TIME_SECONDS=20       # Long polling wait time
```

**Note:** If AWS credentials are not provided, the SDK will use the default AWS credentials chain (IAM roles, environment variables, etc.).

## Running the Worker

The SQS worker processes messages from the queues and handles content/image generation.

### Development

```bash
npm run worker:sqs
```

### Production

Run as a background service or use a process manager like PM2:

```bash
# Using PM2
pm2 start npm --name "sqs-worker" -- run worker:sqs

# Or as a systemd service
# See systemd service file example below
```

### Worker Behavior

- **Polls queues** every 5 seconds (configurable)
- **Processes up to 10 messages** per poll (configurable)
- **Uses long polling** (waits up to 20s for messages) to reduce API calls
- **Visibility timeout** of 5 minutes - if processing fails, message becomes visible again for retry
- **Automatic retry** - failed messages are retried automatically after visibility timeout

## Architecture Flow

### Article Generation

1. **User Request** → `POST /api/content/generate`
2. **API Route** creates job in MongoDB with status `queued`
3. **API Route** sends message to SQS articles queue
4. **API Returns** immediately with `jobId` (HTTP 202)
5. **SQS Worker** polls queue and receives message
6. **Worker** updates job status to `processing`
7. **Worker** calls FastAPI to generate content
8. **Worker** saves result to MongoDB
9. **Worker** updates job status to `completed`
10. **Worker** deletes message from queue

### Image Generation

1. **User Request** → `POST /api/media/generate`
2. **API Route** creates job in MongoDB with status `queued`
3. **API Route** sends message to SQS image queue
4. **API Returns** immediately with `jobId` (HTTP 202)
5. **SQS Worker** polls queue and receives message
6. **Worker** updates job status to `processing`
7. **Worker** calls FastAPI to generate image
8. **Worker** saves image to media collection
9. **Worker** updates job status to `completed`
10. **Worker** deletes message from queue

## Fallback Mechanism

If SQS is **not configured**, the system automatically falls back to **direct FastAPI calls** (original behavior). This ensures:

- ✅ Development without AWS setup
- ✅ Graceful degradation if SQS fails
- ✅ Gradual migration path

## Monitoring

### Check Queue Status

Use AWS SQS Console to monitor:
- **Queue Depth** - Number of messages waiting
- **Messages in Flight** - Messages being processed
- **Dead Letter Queue** - Failed messages after max retries

### Check Worker Logs

The worker logs all operations:
```
[SQS Worker] Starting SQS worker...
[SQS Worker] Received 5 message(s) from articles queue
[SQS Worker] Processing article generation job 507f1f77bcf86cd799439011
[SQS Worker] Article generation job 507f1f77bcf86cd799439011 completed successfully
[SQS Worker] Message processed and deleted for job 507f1f77bcf86cd799439011
```

### Check Job Status

Users can check job status via:
```
GET /api/content/jobs/{jobId}
GET /api/media/generate?status=processing
```

## Troubleshooting

### Worker Not Processing Messages

1. **Check AWS credentials** - Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
2. **Check queue URLs** - Verify SQS queue URLs are correct
3. **Check IAM permissions** - Worker needs:
   - `sqs:ReceiveMessage`
   - `sqs:DeleteMessage`
   - `sqs:GetQueueAttributes`

### Messages Stuck in Queue

1. **Check worker logs** - Look for error messages
2. **Check FastAPI service** - Ensure FastAPI is running and accessible
3. **Check MongoDB connection** - Ensure worker can connect to MongoDB
4. **Check visibility timeout** - Messages become visible again after timeout

### High Queue Depth

If queue depth is consistently high:
1. **Scale workers** - Run multiple worker instances
2. **Increase MAX_MESSAGES** - Process more messages per poll
3. **Decrease POLL_INTERVAL** - Poll more frequently
4. **Optimize FastAPI** - Reduce generation time

## Production Deployment

### Systemd Service Example

Create `/etc/systemd/system/sqs-worker.service`:

```ini
[Unit]
Description=SQS Worker for VIPContentAI
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/vipplay-ai-content-generator
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run worker:sqs
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable sqs-worker
sudo systemctl start sqs-worker
sudo systemctl status sqs-worker
```

### Docker Compose Example

```yaml
services:
  sqs-worker:
    build: .
    command: npm run worker:sqs
    environment:
      - NODE_ENV=production
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - SQS_ARTICLES_QUEUE_URL=${SQS_ARTICLES_QUEUE_URL}
      - SQS_IMAGE_QUEUE_URL=${SQS_IMAGE_QUEUE_URL}
      - MONGODB_URI=${MONGODB_URI}
      - FASTAPI_URL=${FASTAPI_URL}
    restart: unless-stopped
```

## Security Best Practices

1. **Use IAM Roles** - Prefer IAM roles over access keys when possible (e.g., on EC2)
2. **Rotate Credentials** - Regularly rotate AWS access keys
3. **Least Privilege** - Grant only necessary SQS permissions
4. **Encrypt Messages** - Enable SQS encryption at rest
5. **VPC Endpoints** - Use VPC endpoints for SQS access (if in VPC)

## Performance Tuning

### Worker Configuration

Adjust based on your workload:

```bash
# High throughput, low latency
SQS_POLL_INTERVAL=2000          # Poll every 2 seconds
SQS_MAX_MESSAGES=20            # Process 20 messages per poll

# Low throughput, cost optimization
SQS_POLL_INTERVAL=10000         # Poll every 10 seconds
SQS_MAX_MESSAGES=5              # Process 5 messages per poll
```

### Visibility Timeout

Set based on average processing time:
- **Article generation**: 300s (5 minutes) - typical 2-5 minutes
- **Image generation**: 180s (3 minutes) - typical 30-60 seconds

If processing takes longer than visibility timeout, message becomes visible again and may be processed twice.

## Cost Optimization

SQS pricing:
- **First 1 million requests/month**: Free
- **After that**: $0.40 per million requests

To optimize costs:
1. Use long polling (WAIT_TIME_SECONDS=20) to reduce API calls
2. Process multiple messages per poll (MAX_MESSAGES=10)
3. Monitor queue depth and scale workers accordingly

## Next Steps

1. ✅ Install `@aws-sdk/client-sqs`
2. ✅ Configure environment variables
3. ✅ Start the worker: `npm run worker:sqs`
4. ✅ Test article generation
5. ✅ Test image generation
6. ✅ Monitor queue depth and worker logs
7. ✅ Scale workers as needed

For more details, see `SQS_ARCHITECTURE_EXPLAINED.md`.

