# SQS Empty Queue Diagnostic Guide

## 🚨 Problem: Queues Showing 0 Messages

If your SQS queues show **0 messages available** and **0 messages in flight**, here's how to diagnose the issue.

---

## 🔍 Possible Causes

### 1. **Messages Not Being Sent** (Most Common)
- SQS configuration issue
- AWS credentials not set
- Queue URL incorrect
- Error in message sending (caught but not visible)

### 2. **Messages Being Processed Immediately**
- Worker is running and consuming messages instantly
- Messages processed faster than you can see them
- Worker polling too frequently

### 3. **Messages Failing Validation**
- Invalid message format
- Messages deleted due to errors
- Queue permissions issue

### 4. **Wrong Queue URL**
- Querying different queue than where messages are sent
- Environment variable mismatch

---

## 🔧 Diagnostic Steps

### Step 1: Check if Messages Are Being Sent

**Check Next.js server logs when generating content:**

Look for these log messages:

✅ **Success:**
```
[SQS] Article generation job {jobId} queued successfully
  messageId: "..."
  queueUrl: "https://sqs.us-east-1.amazonaws.com/..."
  md5OfBody: "..."
```

❌ **Error:**
```
[SQS] Failed to queue article generation job {jobId}
  error: "..."
  code: "..."
  queueUrl: "..."
```

**If you see errors:** Check AWS credentials and queue URLs.

**If you DON'T see any logs:** Messages aren't being sent (check if SQS is configured).

### Step 2: Check SQS Configuration

**Verify environment variables:**

```bash
# Check .env.local or environment
echo $SQS_ARTICLES_QUEUE_URL
echo $SQS_IMAGE_QUEUE_URL
echo $AWS_REGION
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

**Should match:**
- `SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles`
- `SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image`
- `AWS_REGION=us-east-1`
- `AWS_ACCESS_KEY_ID=...` (must be set)
- `AWS_SECRET_ACCESS_KEY=...` (must be set)

### Step 3: Check if Worker is Running

**Is the SQS worker running?**

```bash
# Check if worker process is running
ps aux | grep "sqs-worker"

# Or check if npm script is running
npm run worker:sqs
```

**If worker is running:** It might be consuming messages immediately.

**Check worker logs:**
```
[SQS Worker] Polling articles queue: https://...
[SQS Worker] Received X messages from articles queue
[SQS Worker] Processing article generation job {jobId}
```

### Step 4: Test Message Sending Manually

**Add a test endpoint to verify SQS:**

```typescript
// In app/api/test/sqs/route.ts (create this file)
import { queueArticleGeneration } from '@/lib/services/sqs';

export async function POST() {
  try {
    const testJobId = `test-${Date.now()}`;
    await queueArticleGeneration(testJobId, 'test-user-id', {
      mode: 'topic',
      topic: 'Test Article',
      wordCount: 500,
      tone: 'Professional',
      seoOptimization: true,
    });
    return NextResponse.json({ 
      success: true, 
      message: 'Test message sent to SQS',
      jobId: testJobId 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

**Then call:**
```bash
curl -X POST http://localhost:3000/api/test/sqs
```

**Check AWS console** - message should appear in queue.

### Step 5: Check Queue Permissions

**Verify IAM permissions:**

Your AWS user/role needs:
- `sqs:SendMessage`
- `sqs:ReceiveMessage`
- `sqs:DeleteMessage`
- `sqs:GetQueueAttributes`

**Test permissions:**
```bash
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles \
  --message-body '{"test": "message"}' \
  --region us-east-1
```

### Step 6: Check Worker Polling

**If worker is running, check polling frequency:**

Worker polls every **5 seconds** by default. If messages are processed quickly, you might not see them.

**Add logging to see polling:**

The worker should log:
```
[SQS Worker] Polling articles queue: https://...
[SQS Worker] Received 0 messages from articles queue
```

**If you see "Received 0 messages":** Messages aren't being sent or already processed.

---

## 🐛 Common Issues & Solutions

### Issue 1: Messages Not Being Sent

**Symptoms:**
- No logs showing "queued successfully"
- Errors in logs about SQS
- Queue stays empty

**Check:**
1. AWS credentials in `.env.local`
2. Queue URLs match AWS console
3. AWS region is correct
4. IAM permissions

**Solution:**
```bash
# Verify credentials
aws sts get-caller-identity

# Test sending message
aws sqs send-message \
  --queue-url $SQS_ARTICLES_QUEUE_URL \
  --message-body '{"test": true}'
```

### Issue 2: Worker Consuming Messages Too Fast

**Symptoms:**
- Messages appear briefly then disappear
- Worker logs show processing
- Queue shows 0 messages

**Solution:**
This is **normal** if worker is running. Messages are processed and deleted.

**To verify:**
1. **Stop the worker** temporarily
2. **Send a test message**
3. **Check AWS console** - message should appear
4. **Start worker** - message should be processed

### Issue 3: Wrong Queue URL

**Symptoms:**
- Messages sent but not visible
- Different queue URL in code vs console

**Check:**
```typescript
// In lib/services/sqs.ts
console.log('Articles Queue URL:', ARTICLES_QUEUE_URL);
```

**Should match AWS console exactly.**

### Issue 4: SQS Not Configured

**Symptoms:**
- Code falls back to direct FastAPI call
- No SQS logs at all

**Check:**
```typescript
// In app/api/content/generate/route.ts
if (isSQSConfigured()) {
  // Should use SQS
} else {
  // Falls back to direct call
}
```

**Solution:** Set environment variables.

---

## ✅ Verification Steps

### Test 1: Send Test Message

1. **Stop SQS worker** (if running)
2. **Generate content** via UI
3. **Check AWS console** - message should appear
4. **Check Next.js logs** - should see "queued successfully"

### Test 2: Check Worker Processing

1. **Start SQS worker:** `npm run worker:sqs`
2. **Send test message** (or generate content)
3. **Check worker logs** - should see processing
4. **Check AWS console** - message should disappear after processing

### Test 3: Verify Message Format

**Check message in AWS console:**

1. **Send message**
2. **Go to AWS SQS console**
3. **Click on queue** → **Send and receive messages**
4. **Receive messages** - should see your message
5. **Check message body** - should be valid JSON

**Expected format:**
```json
{
  "jobId": "...",
  "userId": "...",
  "type": "articles",
  "timestamp": "2025-01-15T...",
  "payload": {
    "mode": "topic",
    "topic": "...",
    "wordCount": 1500,
    ...
  }
}
```

---

## 🔧 Quick Fixes

### Fix 1: Add Better Logging

**I've already added detailed logging to:**
- `lib/services/sqs.ts` - Shows message ID and queue URL
- `lib/services/sqs-worker.ts` - Shows polling and processing

**Check logs after generating content.**

### Fix 2: Verify Environment Variables

**Create/update `.env.local`:**

```bash
# SQS Configuration
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image
SQS_VIDEO_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-video

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Fix 3: Test SQS Connection

**Add this test script:**

```typescript
// scripts/test-sqs.ts
import { queueArticleGeneration } from '../lib/services/sqs';

async function test() {
  try {
    console.log('Testing SQS connection...');
    await queueArticleGeneration('test-123', 'test-user', {
      mode: 'topic',
      topic: 'Test Article',
      wordCount: 500,
      tone: 'Professional',
      seoOptimization: true,
    });
    console.log('✅ SQS test successful!');
  } catch (error: any) {
    console.error('❌ SQS test failed:', error.message);
  }
}

test();
```

**Run:**
```bash
npx tsx scripts/test-sqs.ts
```

---

## 📊 Diagnostic Checklist

- [ ] Check Next.js logs for "queued successfully" message
- [ ] Verify AWS credentials are set
- [ ] Verify queue URLs match AWS console
- [ ] Check if worker is running
- [ ] Test sending message manually
- [ ] Check IAM permissions
- [ ] Verify message format in AWS console
- [ ] Check for errors in logs

---

## 🎯 Most Likely Causes

1. **Messages not being sent** - Check logs and AWS credentials
2. **Worker consuming messages** - Normal if worker is running
3. **Wrong queue URL** - Verify environment variables
4. **SQS not configured** - Check `isSQSConfigured()` result

---

## 📝 Next Steps

1. **Check Next.js server logs** when generating content
2. **Look for SQS log messages** (I've added detailed logging)
3. **Verify environment variables** match AWS console
4. **Test sending message** manually
5. **Check if worker is running** and consuming messages

**The detailed logging I added will show you exactly what's happening!** 🔍

