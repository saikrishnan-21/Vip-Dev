# How to Run VIPContentAI Project

This guide provides step-by-step instructions to run the VIPContentAI project locally and in production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Running the Application](#running-the-application)
5. [Running with SQS Queue](#running-with-sqs-queue)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before running the project, ensure you have:

- **Node.js** 20.18.0 or higher
- **npm** or **pnpm** package manager
- **Python** 3.10 or higher (for FastAPI service)
- **MongoDB** connection (local or remote)
- **Git** (for cloning the repository)

### Optional (for full functionality):
- **Ollama** server (for AI content generation)
- **AWS Account** (for SQS queues and S3 storage)
- **HuggingFace Model API** (for image/video generation)

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd vipplay-ai-content-generator

# Install Node.js dependencies
npm install
# or
pnpm install
```

### 2. Configure Environment

Create `.env.local` in the project root:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/vipcontentai
MONGODB_DB_NAME=vipcontentai

# FastAPI Service
FASTAPI_URL=http://localhost:8000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=7d
```

### 3. Setup Database

```bash
# Create indexes and seed initial data
npm run db:setup
```

### 4. Start Services

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - FastAPI (optional):**
```bash
cd api-service
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **FastAPI Docs**: http://localhost:8000/docs
- **Default Login**: `admin@vipcontentai.com` / `SecurePass123!`

---

## 📝 Detailed Setup

### Step 1: Install Dependencies

#### Node.js Dependencies

```bash
# Install all npm packages
npm install

# Or using pnpm (faster)
pnpm install
```

#### Python Dependencies (FastAPI Service)

```bash
# Navigate to api-service directory
cd api-service

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux/Mac:
source .venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

### Step 2: Environment Configuration

#### Next.js Environment (`.env.local`)

Create `.env.local` in the project root:

```bash
# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/vipcontentai
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai
MONGODB_DB_NAME=vipcontentai

# FastAPI AI Service (REQUIRED)
FASTAPI_URL=http://localhost:8000

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=7d

# AWS SQS Configuration (Optional - for async processing)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image

# HuggingFace Model API (Optional - for image generation)
HF_API_BASE_URL=http://localhost:7860
HF_DEFAULT_IMAGE_MODEL=black-forest-labs/FLUX.1-dev

# Next.js Server Configuration
NODE_ENV=development
PORT=3000
```

#### FastAPI Environment (`api-service/.env`)

Create `api-service/.env`:

```bash
# Ollama Configuration (REQUIRED)
OLLAMA_BASE_URL=http://localhost:11434

# Model Configuration
DEFAULT_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=true

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000
```

### Step 3: Database Setup

```bash
# Run database migrations (create indexes)
npm run db:migrate

# Seed database with initial data (optional)
npm run db:seed

# Or run both at once
npm run db:setup

# Test database connection
npm run db:test
```

---

## 🏃 Running the Application

### Development Mode

#### Option A: Using PowerShell Scripts (Windows)

**Terminal 1 - Next.js:**
```powershell
.\start-nextjs.ps1
```

**Terminal 2 - FastAPI:**
```powershell
.\start-fastapi.ps1
```

#### Option B: Manual Commands

**Terminal 1 - Next.js Development Server:**
```bash
npm run dev
```

The server will start on http://localhost:3000

**Terminal 2 - FastAPI Service:**
```bash
cd api-service
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000

**Terminal 3 - SQS Worker (Optional):**
```bash
npm run worker:sqs
```

**For Multiple Users - Scale Workers:**
```bash
# Run multiple worker instances for better throughput
# Terminal 3 - Worker 1
npm run worker:sqs

# Terminal 4 - Worker 2
npm run worker:sqs

# Terminal 5 - Worker 3
npm run worker:sqs

# Each worker processes independently from the same SQS queue
# SQS automatically distributes messages across all workers
```

**Queue Limits:**
- Maximum 5 concurrent jobs (queued or processing) per user
- If limit reached, user will see error message
- Scale workers by running multiple instances to handle more users

### Production Mode

#### Build Next.js Application

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

#### Run FastAPI in Production

```bash
cd api-service
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Production mode with configurable workers (default: 4)
# Set FASTAPI_WORKERS env var to change worker count
uvicorn main:app --host 0.0.0.0 --port 8000 --workers ${FASTAPI_WORKERS:-4}
```

**For Multiple Users:**
- Run multiple SQS worker instances: `npm run worker:sqs` (in separate terminals/containers)
- Each worker processes independently from the same SQS queue
- SQS automatically distributes messages across all workers
- Increase `MAX_CONCURRENT_ARTICLES` and `MAX_CONCURRENT_IMAGES` per worker for more throughput

---

## 🔄 Running with SQS Queue

To use the SQS queue mechanism for asynchronous processing:

### 1. Configure AWS SQS

Add to `.env.local`:

```bash
# AWS SQS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/637423335500/prod-vipplay-image
```

### 2. Install AWS SDK

```bash
npm install @aws-sdk/client-sqs
```

### 3. Start SQS Worker

**Terminal 3 - SQS Worker:**
```bash
npm run worker:sqs
```

The worker will:
- Poll SQS queues every 5 seconds
- Process article and image generation jobs
- Update MongoDB job status
- Handle retries automatically

### 4. Verify Queue Processing

Check worker logs:
```
[SQS Worker] Starting SQS worker...
[SQS Worker] Received 5 message(s) from articles queue
[SQS Worker] Processing article generation job 507f1f77bcf86cd799439011
[SQS Worker] Article generation job 507f1f77bcf86cd799439011 completed successfully
```

**Note:** If SQS is not configured, the system automatically falls back to direct FastAPI calls.

---

## 🚢 Production Deployment

### Using PM2 (Process Manager)

#### Install PM2

```bash
npm install -g pm2
```

#### Start Services

```bash
# Start Next.js
pm2 start npm --name "nextjs-app" -- start

# Start FastAPI
cd api-service
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name "fastapi-service"

# Start SQS Worker
cd ..
pm2 start npm --name "sqs-worker" -- run worker:sqs
```

#### PM2 Commands

```bash
# List all processes
pm2 list

# View logs
pm2 logs

# Restart a process
pm2 restart nextjs-app

# Stop a process
pm2 stop nextjs-app

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  nextjs:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - FASTAPI_URL=http://fastapi:8000
    depends_on:
      - fastapi

  fastapi:
    build: ./api-service
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
    volumes:
      - ./api-service:/app

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
      - FASTAPI_URL=http://fastapi:8000
    depends_on:
      - fastapi
      - nextjs
```

Start services:

```bash
docker-compose up -d
```

### Using Systemd (Linux)

#### Next.js Service

Create `/etc/systemd/system/nextjs-app.service`:

```ini
[Unit]
Description=Next.js VIPContentAI Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/vipplay-ai-content-generator
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

#### FastAPI Service

Create `/etc/systemd/system/fastapi-service.service`:

```ini
[Unit]
Description=FastAPI VIPContentAI Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/vipplay-ai-content-generator/api-service
EnvironmentFile=/var/www/vipplay-ai-content-generator/api-service/.env
ExecStart=/var/www/vipplay-ai-content-generator/api-service/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

#### SQS Worker Service

Create `/etc/systemd/system/sqs-worker.service`:

```ini
[Unit]
Description=SQS Worker for VIPContentAI
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/vipplay-ai-content-generator
EnvironmentFile=/var/www/vipplay-ai-content-generator/.env.production
ExecStart=/usr/bin/npm run worker:sqs
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start services:

```bash
sudo systemctl enable nextjs-app
sudo systemctl enable fastapi-service
sudo systemctl enable sqs-worker

sudo systemctl start nextjs-app
sudo systemctl start fastapi-service
sudo systemctl start sqs-worker

# Check status
sudo systemctl status nextjs-app
sudo systemctl status fastapi-service
sudo systemctl status sqs-worker
```

---

## 🔍 Available Scripts

### Next.js Scripts

```bash
npm run dev          # Start development server
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Scripts

```bash
npm run db:setup     # Run migrations and seed data
npm run db:migrate   # Create/update MongoDB indexes
npm run db:seed      # Seed database with initial data
npm run db:test      # Test MongoDB connection
```

### SQS Worker Scripts

```bash
npm run worker:sqs   # Start SQS worker
```

### Testing Scripts

```bash
npm run test:e2e              # Run end-to-end tests
npm run test:e2e:ui            # Run tests with UI
npm run test:e2e:headed        # Run tests in headed mode
npm run test:e2e:debug         # Debug tests
npm run test:e2e:report        # Show test report
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

**Error:** `MongoServerError: connection timed out`

**Solution:**
- Check MongoDB URI in `.env.local`
- Verify MongoDB server is running
- Check network connectivity
- Verify credentials

```bash
# Test connection
npm run db:test
```

#### 2. FastAPI Not Starting

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
cd api-service
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

#### 3. Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port
# Windows:
netstat -ano | findstr :3000
# Linux/Mac:
lsof -i :3000

# Kill process
# Windows:
taskkill /PID <pid> /F
# Linux/Mac:
kill -9 <pid>
```

#### 4. SQS Worker Not Processing

**Error:** `Failed to queue article generation`

**Solution:**
- Check AWS credentials in `.env.local`
- Verify SQS queue URLs are correct
- Check IAM permissions (sqs:SendMessage, sqs:ReceiveMessage)
- Verify AWS region matches queue region

#### 5. Build Errors

**Error:** `Type error: Property 'X' does not exist`

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
# Reinstall dependencies
rm -rf node_modules
npm install
# Rebuild
npm run build
```

### Getting Help

1. **Check Logs:**
   - Next.js: Check terminal output
   - FastAPI: Check terminal output
   - SQS Worker: Check terminal output

2. **Verify Environment:**
   ```bash
   # Check Node.js version
   node --version
   
   # Check npm version
   npm --version
   
   # Check Python version
   python --version
   ```

3. **Database Connection:**
   ```bash
   npm run db:test
   ```

4. **Review Documentation:**
   - `README.md` - Main project documentation
   - `SQS_SETUP.md` - SQS queue setup
   - `SQS_ARCHITECTURE.md` - Architecture details
   - `ENV_MAINTENANCE.md` - Environment variables guide

---

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Next.js (Frontend) | 3000 | http://localhost:3000 |
| FastAPI (API) | 8000 | http://localhost:8000 |
| FastAPI Docs | 8000 | http://localhost:8000/docs |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Ollama | 11434 | http://localhost:11434 |

---

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] Next.js server starts on port 3000
- [ ] FastAPI server starts on port 8000
- [ ] MongoDB connection successful
- [ ] Database indexes created
- [ ] Can access frontend at http://localhost:3000
- [ ] Can access API docs at http://localhost:8000/docs
- [ ] Can login with default credentials
- [ ] SQS worker running (if configured)
- [ ] Can create content generation job
- [ ] Can view job status

---

## 🎯 Next Steps

1. **Configure Remote Services:**
   - Set up MongoDB Atlas or remote MongoDB
   - Configure Ollama server URL
   - Set up AWS SQS queues

2. **Customize Configuration:**
   - Update JWT secret
   - Configure CORS origins
   - Set up email service (if needed)

3. **Deploy to Production:**
   - Follow production deployment guide
   - Set up monitoring and logging
   - Configure backups

4. **Scale Services:**
   - Add more SQS workers
   - Scale FastAPI instances
   - Use load balancer for Next.js

---

## 📚 Additional Resources

- **Main README**: `README.md`
- **SQS Setup**: `SQS_SETUP.md`
- **SQS Architecture**: `SQS_ARCHITECTURE.md`
- **Environment Variables**: `ENV_MAINTENANCE.md`
- **FastAPI Service**: `api-service/README.md`

---

## 💡 Quick Reference

### Start All Services (Development)

```bash
# Terminal 1
npm run dev

# Terminal 2
cd api-service && .venv\Scripts\activate && uvicorn main:app --reload

# Terminal 3 (Optional - if using SQS)
npm run worker:sqs
```

### Start All Services (Production)

```bash
# Using PM2
pm2 start npm --name "nextjs" -- start
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name "fastapi" --cwd api-service
pm2 start npm --name "sqs-worker" -- run worker:sqs
```

### Stop All Services

```bash
# Development: Press Ctrl+C in each terminal

# Production (PM2)
pm2 stop all
pm2 delete all
```

---

**Happy Coding! 🚀**

