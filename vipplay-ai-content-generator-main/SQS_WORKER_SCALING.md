# Running Multiple SQS Workers in Server Environment

This guide explains how to run multiple SQS worker instances for better throughput and multi-user support.

## 🎯 Why Run Multiple Workers?

- **Better Throughput:** Process more jobs simultaneously
- **High Availability:** If one worker fails, others continue
- **Multi-User Support:** Handle multiple users generating content/images concurrently
- **Load Distribution:** SQS automatically distributes messages across workers

## 📊 Recommended Worker Count

**Formula:** `Number of Workers = (Expected Concurrent Users × Jobs per User) / Jobs per Worker`

**Example:**
- 10 concurrent users
- 3 jobs per user
- 5 jobs per worker capacity
- **Result:** `(10 × 3) / 5 = 6 workers`

**Starting Point:** Start with 3-5 workers and scale based on queue depth.

---

## 🚀 Method 1: PM2 (Recommended for Node.js)

PM2 is the most popular process manager for Node.js applications.

### Installation

```bash
npm install -g pm2
```

### Start Multiple Workers

#### Option A: Start Individual Workers

```bash
# Start 5 workers
pm2 start npm --name "sqs-worker-1" -- run worker:sqs
pm2 start npm --name "sqs-worker-2" -- run worker:sqs
pm2 start npm --name "sqs-worker-3" -- run worker:sqs
pm2 start npm --name "sqs-worker-4" -- run worker:sqs
pm2 start npm --name "sqs-worker-5" -- run worker:sqs
```

#### Option B: Start with Loop (Bash)

```bash
# Start 5 workers
for i in {1..5}; do
  pm2 start npm --name "sqs-worker-$i" -- run worker:sqs
done
```

#### Option C: PM2 Ecosystem File (Best Practice)

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'sqs-worker',
      script: 'npm',
      args: 'run worker:sqs',
      instances: 5, // Number of worker instances
      exec_mode: 'fork', // Use 'fork' for Node.js apps
      env: {
        NODE_ENV: 'production',
        // Environment variables are loaded from .env.local or .env.production
      },
      error_file: './logs/pm2-worker-error.log',
      out_file: './logs/pm2-worker-out.log',
      log_file: './logs/pm2-worker-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
    },
  ],
};
```

Start with ecosystem file:

```bash
# Start all workers defined in ecosystem.config.js
pm2 start ecosystem.config.js

# Or start with specific number of instances
pm2 start ecosystem.config.js --instances 5
```

### PM2 Management Commands

```bash
# List all processes
pm2 list

# View logs (all workers)
pm2 logs sqs-worker

# View logs for specific worker
pm2 logs sqs-worker-1

# Restart all workers
pm2 restart sqs-worker

# Restart specific worker
pm2 restart sqs-worker-1

# Stop all workers
pm2 stop sqs-worker

# Stop specific worker
pm2 stop sqs-worker-1

# Delete worker from PM2
pm2 delete sqs-worker-1

# Monitor (real-time)
pm2 monit

# Save current PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs (usually sudo env PATH=... pm2 startup systemd -u username --hp /home/username)
```

### Scaling Workers Dynamically

```bash
# Scale up to 10 workers
pm2 scale sqs-worker 10

# Scale down to 3 workers
pm2 scale sqs-worker 3
```

---

## 🐧 Method 2: Systemd (Linux)

Create multiple systemd service files for each worker instance.

### Create Service Template

Create `/etc/systemd/system/sqs-worker@.service`:

```ini
[Unit]
Description=SQS Worker %i for VIPContentAI
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/vipplay-ai-content-generator
Environment=NODE_ENV=production
EnvironmentFile=/var/www/vipplay-ai-content-generator/.env.production
ExecStart=/usr/bin/npm run worker:sqs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Optional: Set worker instance identifier
Environment=WORKER_INSTANCE=%i

[Install]
WantedBy=multi-user.target
```

### Start Multiple Workers

```bash
# Enable and start 5 workers
sudo systemctl enable sqs-worker@1
sudo systemctl enable sqs-worker@2
sudo systemctl enable sqs-worker@3
sudo systemctl enable sqs-worker@4
sudo systemctl enable sqs-worker@5

sudo systemctl start sqs-worker@1
sudo systemctl start sqs-worker@2
sudo systemctl start sqs-worker@3
sudo systemctl start sqs-worker@4
sudo systemctl start sqs-worker@5

# Check status
sudo systemctl status sqs-worker@1
sudo systemctl status sqs-worker@2

# View logs
sudo journalctl -u sqs-worker@1 -f
sudo journalctl -u sqs-worker@2 -f
```

### Management Commands

```bash
# Restart worker
sudo systemctl restart sqs-worker@1

# Stop worker
sudo systemctl stop sqs-worker@1

# Disable worker (won't start on boot)
sudo systemctl disable sqs-worker@1
```

---

## 🐳 Method 3: Docker Compose

### Single Worker Instance

```yaml
version: '3.8'

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
    depends_on:
      - fastapi
```

### Multiple Worker Instances

```yaml
version: '3.8'

services:
  sqs-worker-1:
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
    depends_on:
      - fastapi

  sqs-worker-2:
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
    depends_on:
      - fastapi

  # Add more workers as needed...
```

### Using Docker Compose Scale

```yaml
version: '3.8'

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
    depends_on:
      - fastapi
```

Start with scale:

```bash
# Start 5 worker instances
docker-compose up -d --scale sqs-worker=5

# Scale up to 10
docker-compose up -d --scale sqs-worker=10

# Scale down to 3
docker-compose up -d --scale sqs-worker=3
```

---

## 💻 Method 4: Manual Terminal (Development/Testing)

For development or quick testing, you can run multiple workers in separate terminals.

### Terminal 1
```bash
npm run worker:sqs
```

### Terminal 2
```bash
npm run worker:sqs
```

### Terminal 3
```bash
npm run worker:sqs
```

**Note:** Each terminal runs an independent worker instance. SQS automatically distributes messages across all running workers.

---

## ⚙️ Configuration for Multiple Workers

### Environment Variables

Each worker uses the same environment variables. Make sure `.env.production` or `.env.local` has:

```bash
# AWS SQS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image
SQS_VIDEO_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-video

# MongoDB
MONGODB_URI=your-mongodb-connection-string

# FastAPI
FASTAPI_URL=http://localhost:8000

# Worker Configuration (optional - defaults shown)
SQS_POLL_INTERVAL=3000
SQS_MAX_MESSAGES=10
SQS_VISIBILITY_TIMEOUT=600
MAX_CONCURRENT_ARTICLES=10
MAX_CONCURRENT_IMAGES=15
MAX_CONCURRENT_VIDEOS=6
MAX_CONCURRENT_ARTICLES_PER_USER=3
MAX_CONCURRENT_IMAGES_PER_USER=5
MAX_CONCURRENT_VIDEOS_PER_USER=2
```

### Worker-Level Concurrency

Each worker can process multiple jobs in parallel:

- **Articles:** Up to `MAX_CONCURRENT_ARTICLES` (default: 10) per worker
- **Images:** Up to `MAX_CONCURRENT_IMAGES` (default: 15) per worker
- **Videos:** Up to `MAX_CONCURRENT_VIDEOS` (default: 6) per worker

**Total Capacity:** `Number of Workers × Concurrency per Worker`

**Example with 5 workers:**
- Articles: `5 × 10 = 50` concurrent articles
- Images: `5 × 15 = 75` concurrent images
- Videos: `5 × 6 = 30` concurrent videos

---

## 📈 Monitoring Multiple Workers

### Check Worker Status

#### PM2
```bash
pm2 list
pm2 logs sqs-worker --lines 50
pm2 monit
```

#### Systemd
```bash
# Check all workers
sudo systemctl status sqs-worker@1
sudo systemctl status sqs-worker@2

# View logs
sudo journalctl -u sqs-worker@* -f
```

#### Docker
```bash
docker-compose ps
docker-compose logs -f sqs-worker
```

### Verify Workers are Processing

Check worker logs for activity:

```bash
# PM2
pm2 logs sqs-worker --lines 100 | grep "Processing\|Completed\|Failed"

# Systemd
sudo journalctl -u sqs-worker@* | grep "Processing\|Completed\|Failed"

# Docker
docker-compose logs sqs-worker | grep "Processing\|Completed\|Failed"
```

### Expected Log Output

Each worker should show:
```
[SQS Worker] Starting SQS worker...
[SQS Worker] ✅ AWS credentials configured
[SQS Worker] ✅ MongoDB connection successful
[SQS Worker] ✅ FastAPI connection successful
[SQS Worker] 🚀 Worker ready, starting to poll queues...
[SQS Worker] Received X message(s) from articles queue
[SQS Worker] Received X message(s) from images queue
```

---

## 🔧 Troubleshooting

### Workers Not Processing Messages

1. **Check AWS Credentials:**
   ```bash
   # Verify credentials are set
   echo $AWS_ACCESS_KEY_ID
   echo $AWS_SECRET_ACCESS_KEY
   ```

2. **Check Queue URLs:**
   ```bash
   # Verify queue URLs are set
   echo $SQS_ARTICLES_QUEUE_URL
   echo $SQS_IMAGE_QUEUE_URL
   ```

3. **Check Worker Logs:**
   ```bash
   pm2 logs sqs-worker-1 --lines 50
   ```

### Workers Processing Same Messages

This shouldn't happen - SQS automatically prevents duplicate processing. If it does:

1. Check `VISIBILITY_TIMEOUT` is set correctly (default: 600 seconds)
2. Ensure workers are not sharing the same process/container
3. Check for duplicate worker instances

### High Memory Usage

If workers use too much memory:

1. Reduce `MAX_CONCURRENT_ARTICLES`, `MAX_CONCURRENT_IMAGES`, `MAX_CONCURRENT_VIDEOS`
2. Reduce number of workers
3. Increase server memory

### Workers Crashing

1. **Check Logs:**
   ```bash
   pm2 logs sqs-worker --err
   ```

2. **Check MongoDB Connection:**
   - Verify `MONGODB_URI` is correct
   - Check MongoDB is accessible

3. **Check FastAPI Connection:**
   - Verify `FASTAPI_URL` is correct
   - Check FastAPI is running

4. **Enable Auto-Restart:**
   - PM2: Already enabled by default
   - Systemd: `Restart=always` in service file
   - Docker: `restart: unless-stopped` in compose file

---

## 📊 Best Practices

### 1. Start Small, Scale Up

- Start with 3-5 workers
- Monitor queue depth and processing time
- Scale up if queue depth increases
- Scale down if workers are idle

### 2. Monitor Queue Depth

Use AWS CloudWatch to monitor:
- `ApproximateNumberOfMessages` - Messages waiting
- `ApproximateNumberOfMessagesNotVisible` - Messages being processed

**Scale up if:** Queue depth > 100 messages consistently

### 3. Balance Workers Across Servers

For high availability:
- Run workers on multiple servers
- Use load balancer if needed
- Ensure MongoDB and FastAPI are accessible from all workers

### 4. Set Appropriate Concurrency

- **Too High:** Workers may exhaust resources (memory, CPU)
- **Too Low:** Underutilized workers, slower processing

**Recommended:** Start with defaults, adjust based on server capacity.

### 5. Use Process Manager

- **Development:** Manual terminals (for testing)
- **Production:** PM2, Systemd, or Docker (for reliability)

---

## 🎯 Quick Start Commands

### PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start 5 workers
for i in {1..5}; do
  pm2 start npm --name "sqs-worker-$i" -- run worker:sqs
done

# Save configuration
pm2 save

# Setup auto-start on boot
pm2 startup

# Monitor
pm2 monit
```

### Systemd

```bash
# Enable and start 5 workers
for i in {1..5}; do
  sudo systemctl enable sqs-worker@$i
  sudo systemctl start sqs-worker@$i
done

# Check status
sudo systemctl status sqs-worker@*
```

### Docker Compose

```bash
# Start 5 workers
docker-compose up -d --scale sqs-worker=5

# View logs
docker-compose logs -f sqs-worker
```

---

## 📝 Summary

- **PM2:** Best for Node.js, easy scaling, built-in monitoring
- **Systemd:** Native Linux, good for production servers
- **Docker:** Good for containerized deployments
- **Manual:** Only for development/testing

**Recommended:** Use PM2 for most production deployments. It's easy to manage, scale, and monitor multiple worker instances.

