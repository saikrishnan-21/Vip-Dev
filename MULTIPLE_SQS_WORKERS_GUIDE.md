# Running Multiple SQS Workers Guide

This guide explains how to run and scale multiple SQS workers for better throughput and performance.

## Current Configuration

The `ecosystem.config.js` is configured with **4 worker instances** by default. Each worker:
- Polls all SQS queues (articles, images, videos) in parallel
- Processes messages independently
- Shares the workload automatically

## Quick Start

```bash
# Navigate to frontend directory
cd /var/www/vipcontentai-frontend

# Start 4 workers (default)
pm2 start ecosystem.config.js --only sqs-worker

# Or start with custom number of instances
pm2 start ecosystem.config.js --only sqs-worker --instances 6

# Check status
pm2 list
```

## Scaling Workers

### Scale Up (Add More Workers)

```bash
# Scale to 6 workers
pm2 scale sqs-worker 6

# Scale to 8 workers
pm2 scale sqs-worker 8

# Add 2 more workers
pm2 scale sqs-worker +2
```

### Scale Down (Reduce Workers)

```bash
# Scale to 2 workers
pm2 scale sqs-worker 2

# Remove 1 worker
pm2 scale sqs-worker -1
```

### Dynamic Scaling Based on Queue Depth

```bash
# Check queue depth in AWS SQS Console
# Then scale accordingly:

# High queue depth (> 100 messages) - Scale up
pm2 scale sqs-worker 8

# Normal queue depth (10-100 messages) - Keep at 4-6
pm2 scale sqs-worker 4

# Low queue depth (< 10 messages) - Scale down
pm2 scale sqs-worker 2
```

## Recommended Worker Counts by EC2 Instance

| EC2 Instance Type | RAM    | Recommended Workers | Max Workers |
|-------------------|--------|---------------------|-------------|
| t3.small          | 2 GB   | 2 workers           | 3 workers   |
| t3.medium         | 4 GB   | 3-4 workers         | 5 workers   |
| t3.large          | 8 GB   | 4-6 workers         | 8 workers   |
| t3.xlarge         | 16 GB  | 6-8 workers         | 12 workers  |

**Memory Calculation:**
- Each worker uses: ~200-500MB RAM
- Next.js frontend: ~500MB-1GB
- FastAPI backend: ~200-500MB
- System overhead: ~500MB-1GB
- **Leave 20% free memory** for safety

## Monitoring Workers

### Check Status

```bash
# List all workers
pm2 list

# Detailed info for each worker
pm2 show sqs-worker

# Real-time monitoring (CPU, Memory, etc.)
pm2 monit
```

### View Logs

```bash
# All workers' logs (merged)
pm2 logs sqs-worker

# Last 100 lines
pm2 logs sqs-worker --lines 100

# Only errors
pm2 logs sqs-worker --err

# Follow logs in real-time
pm2 logs sqs-worker --lines 0
```

### Check Processing Activity

```bash
# Watch for message processing
pm2 logs sqs-worker | grep "Processing\|Completed\|Failed"

# Count active jobs
pm2 logs sqs-worker | grep "Starting.*job" | wc -l
```

## Performance Optimization

### 1. Monitor Queue Depth

Check AWS SQS Console regularly:
- **Articles queue depth** - Scale workers if > 50 messages
- **Images queue depth** - Scale workers if > 30 messages
- **Videos queue depth** - Scale workers if > 20 messages

### 2. Monitor Memory Usage

```bash
# Check memory per worker
pm2 monit

# If workers are using > 800MB each, consider:
# - Reducing number of workers
# - Increasing max_memory_restart in ecosystem.config.js
```

### 3. Monitor Processing Time

```bash
# Check processing times in logs
pm2 logs sqs-worker | grep "Successfully processed.*in"

# If processing time > 60s consistently:
# - Check FastAPI response times
# - Check MongoDB query performance
# - Consider adding more workers
```

## Advanced: Specialized Workers

If you want dedicated workers for each queue type (uncomment in `ecosystem.config.js`):

```bash
# Start specialized workers
pm2 start ecosystem.config.js

# This will start:
# - sqs-worker-articles (3 instances)
# - sqs-worker-images (2 instances)
# - sqs-worker-videos (1 instance)

# Scale each independently
pm2 scale sqs-worker-articles 5
pm2 scale sqs-worker-images 3
pm2 scale sqs-worker-videos 2
```

**Benefits of Specialized Workers:**
- ✅ Scale each queue type independently
- ✅ Better resource allocation
- ✅ Easier monitoring per queue type
- ✅ Can optimize memory per worker type

**Drawbacks:**
- ❌ More complex setup
- ❌ More PM2 processes to manage
- ❌ Workers can't help with other queue types

## Auto-Scaling Script (Optional)

Create a script to auto-scale based on queue depth:

```bash
#!/bin/bash
# auto-scale-sqs-workers.sh

# Get queue depth from AWS CLI (requires AWS CLI configured)
ARTICLES_DEPTH=$(aws sqs get-queue-attributes \
  --queue-url "$SQS_ARTICLES_QUEUE_URL" \
  --attribute-names ApproximateNumberOfMessages \
  --query 'Attributes.ApproximateNumberOfMessages' \
  --output text)

# Scale based on depth
if [ "$ARTICLES_DEPTH" -gt 100 ]; then
  pm2 scale sqs-worker 8
elif [ "$ARTICLES_DEPTH" -gt 50 ]; then
  pm2 scale sqs-worker 6
elif [ "$ARTICLES_DEPTH" -gt 20 ]; then
  pm2 scale sqs-worker 4
else
  pm2 scale sqs-worker 2
fi

echo "Queue depth: $ARTICLES_DEPTH, Workers scaled accordingly"
```

Run with cron:
```bash
# Add to crontab (check every 5 minutes)
*/5 * * * * /path/to/auto-scale-sqs-workers.sh
```

## Troubleshooting Multiple Workers

### Workers Not Processing Messages

```bash
# Check if all workers are running
pm2 list

# Check logs for errors
pm2 logs sqs-worker --err --lines 50

# Restart all workers
pm2 restart sqs-worker
```

### High Memory Usage

```bash
# Check memory per worker
pm2 monit

# If total memory > 80% of available:
pm2 scale sqs-worker -2  # Reduce workers
```

### Workers Competing for Messages

This is normal! SQS ensures each message is only processed once. Multiple workers:
- ✅ Increase throughput
- ✅ Process messages in parallel
- ✅ Don't duplicate work (SQS handles this)

### Uneven Work Distribution

If some workers are idle:
- This is normal - SQS distributes messages automatically
- Workers will pick up messages as they become available
- Consider reducing worker count if consistently idle

## Best Practices

1. **Start Small**: Begin with 2-4 workers, monitor, then scale
2. **Monitor Queue Depth**: Scale up when depth > 50 messages
3. **Monitor Memory**: Keep total worker memory < 80% of available RAM
4. **Monitor Processing Time**: If > 60s, investigate bottlenecks
5. **Use PM2 Save**: Always save configuration after changes
6. **Auto-Start**: Setup `pm2 startup` for server reboots
7. **Log Rotation**: Monitor log file sizes, rotate if needed

## Quick Commands Reference

```bash
# Start workers
pm2 start ecosystem.config.js --only sqs-worker

# Scale workers
pm2 scale sqs-worker 6

# Check status
pm2 list
pm2 monit

# View logs
pm2 logs sqs-worker

# Restart workers
pm2 restart sqs-worker

# Stop workers
pm2 stop sqs-worker

# Delete workers
pm2 delete sqs-worker

# Save configuration
pm2 save
```

## Example: Full Setup

```bash
# 1. Navigate to directory
cd /var/www/vipcontentai-frontend

# 2. Start 4 workers
pm2 start ecosystem.config.js --only sqs-worker

# 3. Verify all 4 are running
pm2 list
# Should show 4 instances of sqs-worker

# 4. Monitor in real-time
pm2 monit

# 5. Check logs
pm2 logs sqs-worker

# 6. Scale to 6 workers (if needed)
pm2 scale sqs-worker 6

# 7. Save and setup auto-start
pm2 save
pm2 startup
```

## Performance Metrics to Track

1. **Messages Processed Per Minute**: `pm2 logs sqs-worker | grep "Successfully processed" | wc -l`
2. **Average Processing Time**: Check logs for "Successfully processed job X in Ys"
3. **Queue Depth**: Monitor in AWS SQS Console
4. **Memory Usage**: `pm2 monit` or `pm2 show sqs-worker`
5. **Error Rate**: `pm2 logs sqs-worker --err | wc -l`

Adjust worker count based on these metrics!

