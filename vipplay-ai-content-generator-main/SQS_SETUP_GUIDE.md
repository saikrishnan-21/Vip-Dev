# SQS Setup Guide - Fix Empty Queue Issue

## 🔧 Quick Fix: Configure Environment Variables

The SQS feature requires specific environment variables to be set. Follow these steps:

---

## ✅ Step 1: Create/Update `.env.local` File

**Location:** Root directory of the project

**Create the file if it doesn't exist:**
```bash
cp .env.example .env.local
```

**Or create it manually with these required variables:**

```bash
# AWS SQS Configuration (REQUIRED)
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image
SQS_VIDEO_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-video

# AWS Credentials (REQUIRED)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here

# FastAPI URL (REQUIRED)
FASTAPI_URL=http://localhost:8000
FASTAPI_AI_SERVICE_URL=http://localhost:8000
```

---

## 🔑 Step 2: Get AWS Credentials

### Option A: IAM User Credentials

1. **Go to AWS Console** → **IAM** → **Users**
2. **Select your user** (or create a new one)
3. **Go to Security Credentials tab**
4. **Create Access Key** → **Application running outside AWS**
5. **Copy Access Key ID and Secret Access Key**

### Option B: Use Existing Credentials

If you already have AWS credentials, use them directly.

**Required IAM Permissions:**
- `sqs:SendMessage`
- `sqs:ReceiveMessage`
- `sqs:DeleteMessage`
- `sqs:GetQueueAttributes`

---

## 📋 Step 3: Verify Queue URLs

**Your queue URLs should match exactly:**

```
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image
SQS_VIDEO_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-video
```

**To verify:**
1. Go to **AWS Console** → **SQS**
2. Click on each queue
3. Copy the **Queue URL** from the details page
4. Make sure it matches your `.env.local` file

---

## 🚀 Step 4: Restart Services

**After updating `.env.local`:**

1. **Restart Next.js server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Restart SQS Worker** (if running):
   ```bash
   # Stop current worker (Ctrl+C)
   # Then restart
   npm run worker:sqs
   ```

**Important:** Environment variables are loaded when the process starts. You MUST restart after changing `.env.local`.

---

## ✅ Step 5: Verify SQS is Working

### Test 1: Check Configuration

**Generate content via UI and check Next.js logs:**

✅ **Success:**
```
[SQS] Article generation job {jobId} queued successfully
  messageId: "abc-123..."
  queueUrl: "https://sqs.us-east-1.amazonaws.com/..."
```

❌ **Error:**
```
[SQS] Failed to queue article generation job {jobId}
  error: "..."
```

### Test 2: Check AWS Console

1. **Go to AWS SQS Console**
2. **Click on `prod-vipplay-articles` queue**
3. **Click "Send and receive messages"**
4. **Click "Poll for messages"**
5. **You should see messages** if they're being sent

### Test 3: Check Worker

**If worker is running, check logs:**

```
[SQS Worker] Starting SQS worker...
[SQS Worker] Articles queue: https://sqs.us-east-1.amazonaws.com/...
[SQS Worker] Received 1 message(s) from articles queue
[SQS Worker] Processing article generation job {jobId}
```

---

## 🐛 Troubleshooting

### Issue 1: "SQS_ARTICLES_QUEUE_URL is not configured"

**Problem:** Environment variable not loaded

**Solution:**
1. Check `.env.local` file exists in root directory
2. Verify variable name is exactly `SQS_ARTICLES_QUEUE_URL` (no typos)
3. Restart Next.js server after changing `.env.local`

### Issue 2: "AWS credentials not configured"

**Problem:** `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` missing

**Solution:**
1. Add both variables to `.env.local`
2. Restart Next.js server
3. Verify credentials are correct (test with AWS CLI)

### Issue 3: "Access Denied" or "Invalid Credentials"

**Problem:** Wrong AWS credentials or insufficient permissions

**Solution:**
1. Verify credentials in AWS Console
2. Check IAM user has SQS permissions
3. Test credentials:
   ```bash
   aws sts get-caller-identity --region us-east-1
   ```

### Issue 4: Queue Still Empty

**Possible causes:**
1. **Messages being processed immediately** - Check if worker is running
2. **Messages not being sent** - Check Next.js logs for errors
3. **Wrong queue URL** - Verify URL matches AWS console exactly

**Solution:**
1. **Stop worker** temporarily
2. **Generate content** via UI
3. **Check AWS console** - message should appear
4. **Start worker** - message should be processed

---

## 📝 Complete `.env.local` Example

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai

# FastAPI AI Service
FASTAPI_AI_SERVICE_URL=http://localhost:8000
FASTAPI_URL=http://localhost:8000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256

# AWS SQS Configuration (REQUIRED FOR SQS)
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image
SQS_VIDEO_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-video

# AWS Credentials (REQUIRED FOR SQS)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# SQS Worker Configuration (Optional)
SQS_POLL_INTERVAL=5000
SQS_MAX_MESSAGES=10
SQS_VISIBILITY_TIMEOUT=300
SQS_WAIT_TIME_SECONDS=20

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
```

---

## ✅ Verification Checklist

- [ ] `.env.local` file exists in root directory
- [ ] `SQS_ARTICLES_QUEUE_URL` is set and matches AWS console
- [ ] `AWS_ACCESS_KEY_ID` is set
- [ ] `AWS_SECRET_ACCESS_KEY` is set
- [ ] `AWS_REGION` is set to `us-east-1`
- [ ] Next.js server restarted after updating `.env.local`
- [ ] SQS worker restarted (if running)
- [ ] Check Next.js logs for "queued successfully" message
- [ ] Check AWS console - messages appear in queue

---

## 🎯 Quick Test

**After setup, test SQS:**

1. **Stop SQS worker** (if running)
2. **Generate content** via UI
3. **Check Next.js logs** - should see:
   ```
   [SQS] Article generation job {jobId} queued successfully
   ```
4. **Check AWS SQS console** - message should appear
5. **Start worker** - message should be processed

---

## 📚 Related Documentation

- `SQS_ARCHITECTURE_EXPLAINED.md` - Architecture overview
- `SQS_EMPTY_QUEUE_DIAGNOSTIC.md` - Diagnostic guide
- `RUNNING_THE_PROJECT.md` - How to run the project

---

**After following these steps, your SQS feature should work!** 🎉

If you still see empty queues, check the diagnostic guide: `SQS_EMPTY_QUEUE_DIAGNOSTIC.md`

