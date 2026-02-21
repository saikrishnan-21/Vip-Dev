# Running SQS Worker on Production Server

This guide explains how to run the SQS worker from the production build directory on your EC2 server.

## Current Server Structure

Your production build directory contains:
```
/var/www/vipcontentai-frontend/
├── .env.production
├── .next/              # Next.js build output
├── node_modules/       # Dependencies
├── package.json
├── pnpm-lock.yaml
└── public/            # Static assets
```

## Problem

The SQS worker needs:
- `lib/services/sqs-worker.ts` (TypeScript source file)
- `ecosystem.config.js` (PM2 configuration)
- `tsx` package (to run TypeScript files)

These files are **not included** in the current build archive.

## Solution: Update Deployment Workflow

The deployment workflow has been updated to include:
1. `lib/` directory (contains `lib/services/sqs-worker.ts`)
2. `ecosystem.config.js` (PM2 config file)

After the next deployment, these files will be available on the server.

## Manual Setup (Before Next Deployment)

If you need to run the worker **now** before the next deployment:

### Option 1: Copy Files Manually

```bash
# SSH into your server
ssh ubuntu@your-ec2-instance

# Navigate to frontend directory
cd /var/www/vipcontentai-frontend

# Create lib directory structure
mkdir -p lib/services

# You'll need to manually copy or create:
# 1. lib/services/sqs-worker.ts (from your local repo)
# 2. ecosystem.config.js (from your local repo)
# 3. Any other lib files the worker depends on

# Or clone the repo temporarily to get the files
cd /tmp
git clone https://github.com/ZenSports/vipplay-ai-content-generator.git temp-repo
cd temp-repo
git checkout stage  # or main for production

# Copy necessary files
cp -r lib /var/www/vipcontentai-frontend/
cp ecosystem.config.js /var/www/vipcontentai-frontend/

# Cleanup
cd /var/www/vipcontentai-frontend
rm -rf /tmp/temp-repo
```

### Option 2: Install Dependencies and Run

```bash
cd /var/www/vipcontentai-frontend

# Ensure tsx is installed (it should be in dependencies)
pnpm install --prod

# Verify tsx is available
npx tsx --version

# Create logs directory
mkdir -p logs

# Run worker directly (for testing)
npm run worker:sqs

# Or use PM2
pm2 start ecosystem.config.js --only sqs-worker
```

## After Next Deployment

Once the workflow is updated and you deploy again, the files will be included automatically:

```bash
cd /var/www/vipcontentai-frontend

# Verify files are present
ls -la lib/services/sqs-worker.ts
ls -la ecosystem.config.js

# Install/update dependencies
pnpm install --prod

# Start workers with PM2
pm2 start ecosystem.config.js --only sqs-worker

# Check status
pm2 list
pm2 logs sqs-worker
```

## Verify Worker is Running

```bash
# Check PM2 processes
pm2 list

# View logs
pm2 logs sqs-worker

# Monitor in real-time
pm2 monit

# Check if worker is processing messages
pm2 logs sqs-worker --lines 50 | grep "SQS Worker"
```

## Troubleshooting

### Error: Cannot find module 'lib/services/sqs-worker.ts'

**Solution:** The `lib/` directory is missing. Either:
1. Wait for next deployment (files will be included)
2. Manually copy the `lib/` directory (see Option 1 above)

### Error: tsx command not found

**Solution:** Install dependencies:
```bash
cd /var/www/vipcontentai-frontend
pnpm install --prod
```

### Error: Cannot find module '@aws-sdk/client-sqs'

**Solution:** Dependencies not installed:
```bash
cd /var/www/vipcontentai-frontend
pnpm install --prod
```

### Worker not processing messages

1. **Check environment variables:**
   ```bash
   cd /var/www/vipcontentai-frontend
   cat .env.production | grep SQS
   ```

2. **Verify AWS credentials:**
   ```bash
   cat .env.production | grep AWS
   ```

3. **Check logs:**
   ```bash
   pm2 logs sqs-worker --lines 100
   ```

4. **Verify queue URLs exist in AWS:**
   - Log into AWS Console
   - Go to SQS
   - Verify queues exist and URLs match `.env.production`

## Quick Start Commands

```bash
# 1. Navigate to frontend directory
cd /var/www/vipcontentai-frontend

# 2. Ensure dependencies are installed
pnpm install --prod

# 3. Create logs directory
mkdir -p logs

# 4. Start workers (2 instances)
pm2 start ecosystem.config.js --only sqs-worker

# 5. Save PM2 configuration
pm2 save

# 6. Setup auto-start on reboot
pm2 startup
# Follow the instructions shown

# 7. Verify workers are running
pm2 list
pm2 logs sqs-worker
```

## Expected Output

When the worker starts successfully, you should see:

```
[SQS Worker] Starting SQS worker...
[SQS Worker] Poll interval: 5000ms (5s)
[SQS Worker] Max messages per poll: 10
[SQS Worker] Visibility timeout: 300s
[SQS Worker] ✅ AWS credentials configured
[SQS Worker] Configured queues:
  ✅ Articles: https://sqs.us-east-1.amazonaws.com/...
  ✅ Images: https://sqs.us-east-1.amazonaws.com/...
[SQS Worker] ✅ MongoDB connection successful
[SQS Worker] ✅ FastAPI connection successful
[SQS Worker] 🚀 Worker ready, starting to poll queues...
```

## Next Steps

1. **Wait for next deployment** - Files will be included automatically
2. **Or manually copy files** - Use Option 1 above if you need it now
3. **Start workers with PM2** - Use the commands above
4. **Monitor and scale** - Adjust number of instances based on queue depth

