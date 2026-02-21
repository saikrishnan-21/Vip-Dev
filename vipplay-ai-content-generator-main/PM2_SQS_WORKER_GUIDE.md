# PM2 SQS Worker Setup Guide

This guide explains how to run multiple SQS worker instances using PM2 for better throughput and reliability.

## Prerequisites

1. **PM2 installed globally:**
   ```bash
   npm install -g pm2
   ```

2. **Create logs directory:**
   ```bash
   mkdir -p logs
   ```

3. **Environment variables configured:**
   - Ensure your `.env` file has all required SQS configuration:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`
     - `AWS_REGION`
     - `SQS_QUEUE_URL` or `SQS_ARTICLES_QUEUE_URL`
     - `SQS_IMAGE_QUEUE_URL` (optional)
     - `SQS_VIDEO_QUEUE_URL` (optional)
     - `FASTAPI_AI_SERVICE_URL`
     - `MONGODB_URI`

## Quick Start

### Start SQS Workers

```bash
# Start 2 worker instances (default)
pm2 start ecosystem.config.js --only sqs-worker

# Start with custom number of instances
pm2 start ecosystem.config.js --only sqs-worker --instances 4

# Start all services (if you add more later)
pm2 start ecosystem.config.js
```

### Monitor Workers

```bash
# View all PM2 processes
pm2 list

# View real-time logs
pm2 logs sqs-worker

# View logs from specific instance
pm2 logs sqs-worker --lines 100

# Monitor CPU/Memory usage
pm2 monit

# View detailed process info
pm2 show sqs-worker
```

### Manage Workers

```bash
# Stop workers
pm2 stop sqs-worker

# Restart workers
pm2 restart sqs-worker

# Delete workers from PM2
pm2 delete sqs-worker

# Reload workers (zero-downtime restart)
pm2 reload sqs-worker

# Stop all PM2 processes
pm2 stop all

# Delete all PM2 processes
pm2 delete all
```

### Scaling Workers

```bash
# Scale up to 4 instances
pm2 scale sqs-worker 4

# Scale down to 2 instances
pm2 scale sqs-worker 2

# Scale based on CPU (auto-scaling)
pm2 scale sqs-worker +1  # Add 1 instance
pm2 scale sqs-worker -1  # Remove 1 instance
```

## Configuration

Edit `ecosystem.config.js` to customize:

- **`instances`**: Number of worker instances (default: 2)
  - Recommended: 2-4 instances for most use cases
  - More instances = higher throughput but more memory usage

- **`max_memory_restart`**: Auto-restart if memory exceeds limit (default: 1G)
  - Adjust based on your EC2 instance size

- **`exec_mode`**: `'fork'` mode (each worker runs independently)
  - This is correct for SQS workers - each polls queues independently

## Recommended Instance Counts

| EC2 Instance Type | RAM    | Recommended Workers |
|-------------------|--------|---------------------|
| t3.small          | 2 GB   | 1-2 workers         |
| t3.medium         | 4 GB   | 2-3 workers         |
| t3.large          | 8 GB   | 3-4 workers         |
| t3.xlarge         | 16 GB  | 4-6 workers         |

**Note:** Each worker uses ~200-500MB RAM. Leave memory for:
- Next.js frontend (~500MB-1GB)
- FastAPI backend (~200-500MB)
- System overhead (~500MB-1GB)

## Auto-Start on Server Reboot

```bash
# Save current PM2 process list
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions shown (usually involves running a sudo command)
# Example output:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

After running `pm2 startup`, PM2 will automatically restart all processes on server reboot.

## Troubleshooting

### Workers not processing messages

1. **Check logs:**
   ```bash
   pm2 logs sqs-worker --lines 50
   ```

2. **Verify AWS credentials:**
   ```bash
   # Check if environment variables are loaded
   pm2 env sqs-worker
   ```

3. **Check SQS queue URLs:**
   - Verify queue URLs in `.env` file
   - Ensure queues exist in AWS SQS

### High memory usage

1. **Reduce number of instances:**
   ```bash
   pm2 scale sqs-worker 1
   ```

2. **Increase memory limit:**
   - Edit `ecosystem.config.js`
   - Change `max_memory_restart: '1G'` to `'2G'`

3. **Check for memory leaks:**
   ```bash
   pm2 monit  # Watch memory usage over time
   ```

### Workers crashing

1. **Check error logs:**
   ```bash
   pm2 logs sqs-worker --err --lines 100
   ```

2. **Check restart count:**
   ```bash
   pm2 show sqs-worker
   # Look for "restarts" count
   ```

3. **Review MongoDB/FastAPI connectivity:**
   - Ensure MongoDB is accessible
   - Ensure FastAPI service is running

## Performance Monitoring

```bash
# Real-time monitoring
pm2 monit

# Generate metrics
pm2 describe sqs-worker

# Export metrics (for monitoring tools)
pm2 jlist  # JSON output
pm2 prettylist  # Formatted output
```

## Best Practices

1. **Start with 2 instances** and scale based on queue depth
2. **Monitor memory usage** - don't exceed 80% of available RAM
3. **Use PM2 logs** to track processing times and errors
4. **Set up auto-restart** with `pm2 startup` for production
5. **Use `pm2 reload`** for zero-downtime updates (if you update the worker code)

## Example: Full Setup on EC2

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Create logs directory
mkdir -p logs

# 3. Start workers (2 instances)
pm2 start ecosystem.config.js --only sqs-worker

# 4. Save configuration
pm2 save

# 5. Setup auto-start on reboot
pm2 startup
# Follow the sudo command shown

# 6. Verify workers are running
pm2 list
pm2 logs sqs-worker
```

## Integration with Deployment

If you're using the GitHub Actions workflow, you can add a step to restart workers after deployment:

```yaml
- name: Restart SQS Workers
  run: |
    ssh -i ec2_key.pem "${{ secrets.EC2_USER }}@${{ secrets.EC2_HOST }}" << 'EOF'
    cd /path/to/your/app
    pm2 restart sqs-worker
    pm2 save
    EOF
```

Or add it to your deployment script in the workflow file.

