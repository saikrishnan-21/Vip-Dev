# How to Run SQS Worker on Server

Quick guide to run the SQS worker on your EC2 server.

## Prerequisites Check

First, SSH into your server and verify the setup:

```bash
# SSH into your EC2 instance
ssh ubuntu@your-ec2-ip

# Navigate to frontend directory
cd /var/www/vipcontentai-frontend

# Check if required files exist
ls -la lib/services/sqs-worker.ts
ls -la ecosystem.config.js
ls -la package.json
```

## Step 1: Install Dependencies

```bash
cd /var/www/vipcontentai-frontend

# Install production dependencies (includes tsx)
pnpm install --prod

# Verify tsx is available
npx tsx --version
```

## Step 2: Create Logs Directory

```bash
mkdir -p logs
```

## Step 3: Verify Environment Variables

```bash
# Check SQS configuration
cat .env.production | grep SQS
cat .env.production | grep AWS

# Should show:
# SQS_QUEUE_URL=...
# SQS_ARTICLES_QUEUE_URL=...
# SQS_IMAGE_QUEUE_URL=...
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=...
```

## Step 4: Run Worker with PM2

### Option A: Using ecosystem.config.js (Recommended)

```bash
# Start 2 worker instances
pm2 start ecosystem.config.js --only sqs-worker

# Or start with custom number of instances
pm2 start ecosystem.config.js --only sqs-worker --instances 4
```

### Option B: Direct PM2 Command

```bash
# Start single worker
pm2 start npm --name "sqs-worker" -- run worker:sqs

# Start multiple workers
pm2 start npm --name "sqs-worker" -- run worker:sqs -i 2
```

## Step 5: Verify Worker is Running

```bash
# Check PM2 processes
pm2 list

# Should show:
# ┌─────┬──────────────┬─────────┬─────────┬──────────┬─────────┐
# │ id  │ name         │ status  │ restart │ uptime   │ memory  │
# ├─────┼──────────────┼─────────┼─────────┼──────────┼─────────┤
# │ 0   │ sqs-worker   │ online  │ 0       │ 1m       │ 150 MB  │
# │ 1   │ sqs-worker   │ online  │ 0       │ 1m       │ 148 MB  │
# └─────┴──────────────┴─────────┴─────────┴──────────┴─────────┘
```

## Step 6: View Logs

```bash
# View all logs
pm2 logs sqs-worker

# View last 50 lines
pm2 logs sqs-worker --lines 50

# View only errors
pm2 logs sqs-worker --err

# Follow logs in real-time
pm2 logs sqs-worker --lines 0
```

## Step 7: Monitor Worker

```bash
# Real-time monitoring (CPU, Memory, etc.)
pm2 monit

# Detailed process info
pm2 show sqs-worker
```

## Expected Log Output

When the worker starts successfully, you should see:

```
[SQS Worker] Starting SQS worker...
[SQS Worker] Poll interval: 5000ms (5s)
[SQS Worker] Max messages per poll: 10
[SQS Worker] ✅ AWS credentials configured
[SQS Worker] Configured queues:
  ✅ Articles: https://sqs.us-east-1.amazonaws.com/...
  ✅ Images: https://sqs.us-east-1.amazonaws.com/...
[SQS Worker] ✅ MongoDB connection successful
[SQS Worker] ✅ FastAPI connection successful
[SQS Worker] 🚀 Worker ready, starting to poll queues...
[SQS Worker] No messages available in articles queue
```

## Common Commands

```bash
# Stop workers
pm2 stop sqs-worker

# Restart workers
pm2 restart sqs-worker

# Delete workers from PM2
pm2 delete sqs-worker

# Scale workers (change number of instances)
pm2 scale sqs-worker 4  # Scale to 4 instances
pm2 scale sqs-worker 2  # Scale to 2 instances

# Reload workers (zero-downtime restart)
pm2 reload sqs-worker
```

## Auto-Start on Server Reboot

```bash
# Save current PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions shown (usually a sudo command)
# Example output:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# After running the command, PM2 will auto-start on reboot
```

## Troubleshooting

### Error: Cannot find module 'lib/services/sqs-worker.ts'

**Solution:** The `lib/` directory is missing. You need to:
1. Wait for next deployment (files will be included automatically)
2. Or manually copy the `lib/` directory from your local repo

```bash
# Option: Clone repo temporarily to get files
cd /tmp
git clone https://github.com/ZenSports/vipplay-ai-content-generator.git temp-repo
cd temp-repo
git checkout stage  # or main for production

# Copy lib directory
cp -r lib /var/www/vipcontentai-frontend/

# Cleanup
rm -rf /tmp/temp-repo
cd /var/www/vipcontentai-frontend
```

### Error: tsx command not found

**Solution:** Install dependencies:
```bash
cd /var/www/vipcontentai-frontend
pnpm install --prod
```

### Error: AWS credentials not configured

**Solution:** Check `.env.production`:
```bash
cat .env.production | grep AWS
# Should show AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
```

### Worker not processing messages

1. **Check queue URLs:**
   ```bash
   cat .env.production | grep SQS
   ```

2. **Verify queues exist in AWS:**
   - Log into AWS Console → SQS
   - Verify queues exist and URLs match

3. **Check worker logs:**
   ```bash
   pm2 logs sqs-worker --lines 100
   ```

4. **Test MongoDB connection:**
   ```bash
   # Worker should show: "✅ MongoDB connection successful"
   pm2 logs sqs-worker | grep MongoDB
   ```

5. **Test FastAPI connection:**
   ```bash
   # Worker should show: "✅ FastAPI connection successful"
   pm2 logs sqs-worker | grep FastAPI
   ```

### High memory usage

```bash
# Check memory usage
pm2 monit

# Reduce number of instances
pm2 scale sqs-worker 1

# Or increase memory limit in ecosystem.config.js
# Change max_memory_restart: '1G' to '2G'
```

## Quick Reference

```bash
# Full setup (one-time)
cd /var/www/vipcontentai-frontend
pnpm install --prod
mkdir -p logs
pm2 start ecosystem.config.js --only sqs-worker
pm2 save
pm2 startup  # Follow instructions

# Daily operations
pm2 list                    # Check status
pm2 logs sqs-worker         # View logs
pm2 restart sqs-worker     # Restart
pm2 monit                   # Monitor
```

## Verify Worker is Processing Messages

```bash
# Watch logs for message processing
pm2 logs sqs-worker | grep "Processing\|Completed\|Failed"

# You should see messages like:
# [SQS Worker] Processing article generation job 507f1f77bcf86cd799439011
# [SQS Worker] ✅ Completed articles job 507f1f77bcf86cd799439011
```

## Performance Tips

1. **Start with 2 instances** - Monitor and scale based on queue depth
2. **Monitor memory** - Don't exceed 80% of available RAM
3. **Check queue depth** - In AWS SQS console, monitor "Messages Available"
4. **Scale horizontally** - Add more instances if queue depth is high
5. **Use PM2 logs** - Track processing times and identify bottlenecks

## Integration with Deployment

After each deployment, restart workers to pick up code changes:

```bash
cd /var/www/vipcontentai-frontend
pm2 restart sqs-worker
pm2 save
```

Or add this to your deployment workflow to auto-restart workers.

