# SQS Worker Troubleshooting - Jobs Stuck in "Queued" Status

## 🚨 Problem: Jobs Stuck in "Queued" Status

If jobs remain in "queued" status for more than 10 minutes, the SQS worker is likely not running or not processing messages.

---

## ✅ Step 1: Check if Worker is Running

**The SQS worker must be running to process messages!**

### Check if worker process is running:

```bash
# Windows PowerShell
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*tsx*"}

# Or check for worker script
ps aux | grep "sqs-worker"
```

### Start the worker:

```bash
# In a separate terminal window
npm run worker:sqs
```

**You should see:**
```
============================================================
[SQS Worker] Starting SQS worker...
[SQS Worker] Poll interval: 5000ms (5s)
[SQS Worker] Max messages per poll: 10
[SQS Worker] Visibility timeout: 300s
[SQS Worker] Long polling wait time: 20s
[SQS Worker] FastAPI URL: http://localhost:8000
============================================================
[SQS Worker] ✅ AWS credentials configured
[SQS Worker] Configured queues:
  ✅ Articles: https://sqs.us-east-1.amazonaws.com/...
[SQS Worker] ✅ MongoDB connection successful
[SQS Worker] ✅ FastAPI connection successful
[SQS Worker] 🚀 Worker ready, starting to poll queues...
============================================================
```

---

## ✅ Step 2: Check Worker Status Endpoint

**I've created a status endpoint to check job status:**

```bash
# Check worker status and stuck jobs
curl http://localhost:3000/api/test/worker-status

# Or in browser:
http://localhost:3000/api/test/worker-status
```

**This shows:**
- Number of queued jobs
- Jobs stuck in queued (more than 5 minutes)
- Jobs in processing
- Recent completed jobs
- Recommendations

---

## ✅ Step 3: Check Worker Logs

**When worker is running, you should see:**

### Normal operation:
```
[SQS Worker] Received 1 message(s) from articles queue
[SQS Worker] Parsed message for job abc123, type: articles
[SQS Worker] Starting to process job abc123 (type: articles)
[SQS Worker] Processing article generation job abc123
[SQS Worker] Successfully processed job abc123 in 45.23s
[SQS Worker] Message deleted from queue for job abc123
```

### If no messages:
```
[SQS Worker] No messages available in articles queue
```

### If errors:
```
[SQS Worker] Failed to process message for job abc123: ...
```

---

## 🔍 Step 4: Common Issues

### Issue 1: Worker Not Running

**Symptoms:**
- Jobs stuck in "queued" status
- No worker logs
- No messages being processed

**Solution:**
```bash
# Start the worker
npm run worker:sqs

# Keep it running in a separate terminal
```

### Issue 2: Worker Can't Connect to MongoDB

**Symptoms:**
- Worker starts but fails when processing
- Error: "MongoDB connection failed"

**Check logs:**
```
[SQS Worker] ❌ MongoDB connection failed: ...
```

**Solution:**
1. Check `MONGODB_URI` in `.env.local`
2. Verify MongoDB is running
3. Check network connectivity

### Issue 3: Worker Can't Connect to FastAPI

**Symptoms:**
- Worker receives messages but fails to process
- Error: "FastAPI connection failed"

**Check logs:**
```
[SQS Worker] ❌ FastAPI connection failed: ...
```

**Solution:**
1. Check `FASTAPI_URL` in `.env.local`
2. Verify FastAPI is running: `curl http://localhost:8000/health`
3. Check FastAPI logs

### Issue 4: Messages Not Being Received

**Symptoms:**
- Worker running but no messages received
- Logs show "No messages available"

**Check:**
1. **AWS SQS Console** - Are messages in queue?
2. **AWS Credentials** - Are they correct?
3. **Queue URL** - Does it match AWS console exactly?

**Test:**
```bash
# Send test message
curl -X POST http://localhost:3000/api/test/sqs

# Check worker logs - should see message received
```

### Issue 5: Processing Fails Silently

**Symptoms:**
- Messages received but jobs not updated
- No error logs

**Check:**
- Worker logs for processing errors
- FastAPI logs for generation errors
- MongoDB connection issues

---

## 🔧 Step 5: Manual Processing Test

**If worker is not processing, manually trigger processing:**

1. **Get a stuck job ID:**
   ```bash
   curl http://localhost:3000/api/test/worker-status
   # Note the jobId from stuckJobs
   ```

2. **Check MongoDB:**
   ```javascript
   // In MongoDB
   db.generation_jobs.findOne({
     _id: ObjectId("your-job-id")
   })
   ```

3. **Check SQS:**
   - Go to AWS SQS console
   - Check if message is in queue
   - If message is gone, it was processed but status not updated

---

## 📊 Step 6: Monitor Worker Health

**Check these regularly:**

1. **Worker process is running:**
   ```bash
   ps aux | grep "sqs-worker"
   ```

2. **Worker logs show activity:**
   - Should see polling messages
   - Should see message processing

3. **Jobs are being processed:**
   - Check `/api/test/worker-status`
   - Queued jobs should decrease
   - Completed jobs should increase

4. **No errors in logs:**
   - Check for error messages
   - Check for connection failures

---

## 🎯 Quick Fix Checklist

- [ ] **Worker is running:** `npm run worker:sqs` in separate terminal
- [ ] **Worker logs show startup:** Should see "Worker ready"
- [ ] **MongoDB connection:** Should see "✅ MongoDB connection successful"
- [ ] **FastAPI connection:** Should see "✅ FastAPI connection successful"
- [ ] **Messages being received:** Should see "Received X message(s)"
- [ ] **Messages being processed:** Should see "Processing article generation job"
- [ ] **No errors in logs:** Check for error messages

---

## 🚀 Recommended Setup

**Run worker as a background service:**

### Option 1: PM2 (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start npm --name "sqs-worker" -- run worker:sqs

# Check status
pm2 status

# View logs
pm2 logs sqs-worker

# Auto-start on reboot
pm2 startup
pm2 save
```

### Option 2: Screen/Tmux (Development)

```bash
# Using screen
screen -S sqs-worker
npm run worker:sqs
# Press Ctrl+A then D to detach

# Reattach
screen -r sqs-worker
```

### Option 3: Separate Terminal (Development)

```bash
# Just keep a terminal window open with:
npm run worker:sqs
```

---

## 📝 Summary

**Most Common Issue:** Worker is not running!

**Solution:**
1. Start worker: `npm run worker:sqs`
2. Keep it running in a separate terminal
3. Check logs for errors
4. Monitor with `/api/test/worker-status`

**The worker MUST be running to process messages from SQS!** 🚀

