# SQS Empty Queue - Step-by-Step Troubleshooting

## 🚨 Problem: Queues Still Empty After Configuration

If your queues are still showing 0 messages after setting up `.env.local`, follow these steps:

---

## ✅ Step 1: Test SQS Configuration

**Use the test endpoint I just created:**

```bash
# Check configuration
curl http://localhost:3000/api/test/sqs

# Or in browser:
http://localhost:3000/api/test/sqs
```

**Expected response:**
```json
{
  "success": true,
  "configuration": {
    "isConfigured": true,
    "environment": {
      "articlesQueueUrl": "https://sqs.us-east-1.amazonaws.com/...",
      "hasAccessKey": true,
      "hasSecretKey": true
    }
  }
}
```

**If `isConfigured: false`:** Check which variables are missing.

---

## ✅ Step 2: Send Test Message

**Send a test message to SQS:**

```bash
curl -X POST http://localhost:3000/api/test/sqs
```

**Check Next.js server logs** - should see:
```
[SQS Test] Starting SQS test...
[SQS Service] queueArticleGeneration called
[SQS Service] Preparing to send message
[SQS Service] Sending message to SQS...
[SQS] Article generation job test-123... queued successfully
```

**Then check AWS SQS console** - message should appear in `prod-vipplay-articles` queue.

---

## ✅ Step 3: Check Server Logs When Generating Content

**Generate content via UI and watch Next.js server logs:**

**Look for these log messages:**

✅ **Success (Message Sent):**
```
[Content Generation] Attempting to queue job {jobId} via SQS...
[SQS Service] queueArticleGeneration called
[SQS Service] Preparing to send message
[SQS Service] Sending message to SQS...
[SQS] Article generation job {jobId} queued successfully
  messageId: "abc-123..."
  queueUrl: "https://sqs.us-east-1.amazonaws.com/..."
```

❌ **Error (Message Not Sent):**
```
[Content Generation] Attempting to queue job {jobId} via SQS...
[SQS Service] queueArticleGeneration called
[SQS] Failed to queue article generation job {jobId}
  error: "..."
  code: "..."
```

**If you see errors:** Note the error message and code.

---

## 🔍 Step 4: Common Error Codes & Fixes

### Error: "SQS_ARTICLES_QUEUE_URL is not configured"

**Problem:** Environment variable not loaded

**Fix:**
1. Verify `.env.local` exists in **root directory** (not in subdirectory)
2. Check variable name is exactly `SQS_ARTICLES_QUEUE_URL` (no typos, no spaces)
3. **Restart Next.js server** after changing `.env.local`
4. Verify with: `curl http://localhost:3000/api/test/sqs`

### Error: "AWS credentials are not configured"

**Problem:** `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` missing

**Fix:**
1. Add both to `.env.local`
2. Restart Next.js server
3. Verify with: `curl http://localhost:3000/api/test/sqs`

### Error: "AccessDenied" or "InvalidClientTokenId"

**Problem:** Wrong AWS credentials or insufficient permissions

**Fix:**
1. Verify credentials in AWS Console → IAM → Users → Security Credentials
2. Check IAM user has these permissions:
   - `sqs:SendMessage`
   - `sqs:ReceiveMessage`
   - `sqs:DeleteMessage`
   - `sqs:GetQueueAttributes`
3. Test credentials:
   ```bash
   aws sts get-caller-identity --region us-east-1
   ```

### Error: "QueueDoesNotExist" or "AWS.SimpleQueueService.NonExistentQueue"

**Problem:** Queue URL doesn't match actual queue

**Fix:**
1. Go to AWS SQS Console
2. Click on `prod-vipplay-articles` queue
3. Copy the **exact Queue URL** from details
4. Update `.env.local` with exact URL
5. Restart Next.js server

### Error: "SignatureDoesNotMatch"

**Problem:** Wrong AWS secret key

**Fix:**
1. Verify `AWS_SECRET_ACCESS_KEY` is correct
2. Make sure there are no extra spaces or quotes
3. Regenerate access key if needed

---

## 🔍 Step 5: Verify Environment Variables Are Loaded

**Add this to check if variables are loaded:**

```typescript
// In your Next.js API route or test endpoint
console.log('Environment check:', {
  SQS_ARTICLES_QUEUE_URL: process.env.SQS_ARTICLES_QUEUE_URL,
  AWS_REGION: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
});
```

**Or use the test endpoint:**
```bash
curl http://localhost:3000/api/test/sqs
```

---

## 🔍 Step 6: Check if Worker is Consuming Messages

**If SQS worker is running, it might consume messages immediately:**

1. **Stop the worker:**
   ```bash
   # Find worker process
   ps aux | grep "sqs-worker"
   # Kill it
   kill <process-id>
   ```

2. **Send test message:**
   ```bash
   curl -X POST http://localhost:3000/api/test/sqs
   ```

3. **Check AWS console** - message should appear

4. **Start worker** - message should be processed

---

## 🔍 Step 7: Manual AWS CLI Test

**Test SQS directly with AWS CLI:**

```bash
# Send test message
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles \
  --message-body '{"test": "message"}' \
  --region us-east-1

# Receive message
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles \
  --region us-east-1
```

**If this works:** SQS is configured correctly, issue is in Next.js code.

**If this fails:** AWS credentials or permissions issue.

---

## 📋 Diagnostic Checklist

Run through this checklist:

- [ ] `.env.local` file exists in **root directory**
- [ ] `SQS_ARTICLES_QUEUE_URL` is set (no quotes, no spaces)
- [ ] `AWS_ACCESS_KEY_ID` is set
- [ ] `AWS_SECRET_ACCESS_KEY` is set
- [ ] `AWS_REGION` is set to `us-east-1`
- [ ] Next.js server **restarted** after updating `.env.local`
- [ ] Test endpoint shows `isConfigured: true`
- [ ] Test message endpoint sends successfully
- [ ] Check Next.js logs for SQS messages
- [ ] Check AWS console - messages appear
- [ ] Worker is stopped when testing (to see messages accumulate)

---

## 🎯 Quick Test Sequence

**Run these in order:**

1. **Check config:**
   ```bash
   curl http://localhost:3000/api/test/sqs
   ```
   Should show `isConfigured: true`

2. **Send test message:**
   ```bash
   curl -X POST http://localhost:3000/api/test/sqs
   ```
   Should return `success: true`

3. **Check Next.js logs:**
   Should see `[SQS] Article generation job ... queued successfully`

4. **Check AWS console:**
   Go to SQS → `prod-vipplay-articles` → Send and receive messages → Poll
   Should see test message

5. **Generate content via UI:**
   Check logs again - should see same success messages

---

## 🐛 If Still Empty After All Steps

**Check these:**

1. **Are you looking at the right queue?**
   - Verify queue name: `prod-vipplay-articles`
   - Verify region: `us-east-1`
   - Verify account ID: `637423335500`

2. **Are messages being sent but immediately deleted?**
   - Stop worker
   - Send test message
   - Check immediately (within 1 second)

3. **Is there a different environment?**
   - Check if you have multiple `.env` files
   - Check if production/staging uses different config

4. **Check AWS CloudWatch Logs:**
   - Go to CloudWatch → Logs
   - Look for SQS access logs
   - Check for errors

---

## 📞 Next Steps

1. **Run the test endpoint:** `curl http://localhost:3000/api/test/sqs`
2. **Check the response** - it will tell you exactly what's missing
3. **Send test message:** `curl -X POST http://localhost:3000/api/test/sqs`
4. **Check Next.js logs** for detailed error messages
5. **Share the error message** if you see one

**The test endpoint will show you exactly what's wrong!** 🔍

