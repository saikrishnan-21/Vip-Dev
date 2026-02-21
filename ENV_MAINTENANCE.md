# Environment Variables Maintenance Guide

This document explains how to manage environment variables across the VIPContentAI project.

## 📁 Environment File Structure

```
project-root/
├── .env.example              # Next.js environment template (committed to git)
├── .env.staging              # Next.js staging config (committed, direct copy to server)
├── .env.production           # Next.js production config (committed, direct copy to server)
├── .env.local                # Next.js local development (gitignored)
├── api-service/
│   ├── .env.example          # FastAPI environment template (committed to git)
│   ├── .env.staging          # FastAPI staging config (committed, direct copy to server)
│   ├── .env.production       # FastAPI production config (committed, direct copy to server)
│   └── .env                  # FastAPI local development (gitignored)
└── .github/workflows/
    └── deploy-ec2-staging.yml # Deployment workflow
```

## 🎯 Deployment Methods

The workflow supports **two methods** for environment configuration:

### Method 1: Direct Copy (Recommended for Simple Deployments)

**How it works:**
1. Create `.env.staging` or `.env.production` files in your repository
2. Commit them to git (they're allowed in `.gitignore`)
3. The workflow will copy them directly to the server (no secrets override)

**When to use:**
- ✅ Simple deployments with fixed configuration
- ✅ When you want full control over the env file
- ✅ When you don't want to manage GitHub Secrets

**Files to create:**
- Root: `.env.staging` or `.env.production`
- API Service: `api-service/.env.staging` or `api-service/.env.production`

### Method 2: Template + Secrets (Recommended for Secure Deployments)

**How it works:**
1. Use `.env.example` as a template
2. Override values from GitHub Secrets
3. More secure (secrets not in repository)

**When to use:**
- ✅ Production deployments with sensitive data
- ✅ When you want to use GitHub Secrets
- ✅ When you need different secrets per environment

**Priority Order:**
1. `.env.staging` / `.env.production` (if exists, direct copy)
2. `.env.example` + GitHub Secrets (template-based)
3. Default values (fallback)

## 🔐 Environment Files

### 1. Next.js Application (Root `.env.local`)

**Location**: Root directory  
**File**: `.env.local` (development) or `.env.production` (production)

**Required Variables**:
```bash
# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/vipcontentai
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai

# FastAPI AI Service (REQUIRED)
FASTAPI_AI_SERVICE_URL=http://localhost:8000

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
```

**Optional Variables**:
```bash
# Ollama Configuration (for admin routes)
OLLAMA_BASE_URL=http://localhost:11434

# Next.js Server Configuration
NODE_ENV=development
PORT=3000
HOSTNAME=0.0.0.0

# Redis (if used)
REDIS_URL=redis://localhost:6379

# Firecrawl API (if used for web scraping)
FIRECRAWL_API_KEY=your-firecrawl-api-key

# SendGrid API (if used for email)
SENDGRID_API_KEY=your-sendgrid-api-key
```

### 2. FastAPI Service (`api-service/.env`)

**Location**: `api-service/` directory  
**File**: `.env`

**Required Variables**:
```bash
# Ollama Configuration (REQUIRED)
OLLAMA_BASE_URL=http://localhost:11434

# Model Configuration
DEFAULT_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text
```

**Optional Variables**:
```bash
# Quality Model (optional)
QUALITY_MODEL=llama3.1:70b

# Model Parameters
MAX_TOKENS=4096
TEMPERATURE=0.7
TOP_P=0.9
FREQUENCY_PENALTY=0.0
PRESENCE_PENALTY=0.0

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
RELOAD=false

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

## 🚀 Setup Instructions

### Local Development

1. **Copy example files**:
   ```bash
   # Next.js
   cp .env.example .env.local
   
   # FastAPI
   cp api-service/.env.example api-service/.env
   ```

2. **Update values** in `.env.local` and `api-service/.env`:
   - Replace placeholder values with your actual configuration
   - Update MongoDB URI, JWT secret, etc.

3. **Never commit** `.env` or `.env.local` files to git (they're in `.gitignore`)

### Staging/Production Deployment

#### Option A: Direct Copy Method (Simple)

1. **Create environment-specific files**:
   ```bash
   # For staging
   cp .env.example .env.staging
   cp api-service/.env.example api-service/.env.staging
   
   # For production
   cp .env.example .env.production
   cp api-service/.env.example api-service/.env.production
   ```

2. **Update values** in both files:
   - **Root `.env.staging`**: Add MongoDB URI, JWT secret, FastAPI URL, etc.
   - **`api-service/.env.staging`**: Add Ollama URL, model names, CORS origins, etc.
   - These files will be committed to git

3. **Commit and push**:
   ```bash
   git add .env.staging .env.production
   git add api-service/.env.staging api-service/.env.production
   git commit -m "Add staging and production environment configurations"
   git push
   ```

4. **Deploy**: The workflow will automatically:
   - Copy `.env.staging` → `/opt/vipcontentai/frontend/.env.production`
   - Copy `api-service/.env.staging` → `/opt/vipcontentai/api-service/.env`

#### Option B: Template + Secrets Method (Secure)

1. **Keep `.env.example`** as template (already in repo)

2. **Configure GitHub Secrets** (see GitHub Secrets section below)

3. **Deploy**: The workflow will use `.env.example` + secrets

### Production Deployment

The GitHub Actions workflow automatically:
1. Uses `.env.example` as a template
2. Overrides values from GitHub Secrets
3. Creates `.env` files on the server

## 🔒 GitHub Secrets Configuration

For production deployments, configure these secrets in GitHub:

**Repository Settings → Secrets and variables → Actions**

### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Generate with: `openssl rand -base64 32` |
| `FASTAPI_AI_SERVICE_URL` | FastAPI service URL | `http://localhost:8000` |

### Optional Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `DEFAULT_MODEL` | Default LLM model | `llama3.1:8b` |
| `EMBEDDING_MODEL` | Embedding model | `nomic-embed-text` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000,https://yourdomain.com` |
| `FIRECRAWL_API_KEY` | Firecrawl API key | `fc-xxxxx` |
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxxxx` |

## 📝 Maintaining .env.example Files

### When to Update

Update `.env.example` files when:
- ✅ Adding new environment variables to the code
- ✅ Changing default values
- ✅ Adding new optional services (Redis, Firecrawl, etc.)
- ✅ Documenting new configuration options

### How to Update

1. **Add the variable** to the code with a default value:
   ```typescript
   // Next.js
   const NEW_VAR = process.env.NEW_VAR || 'default-value';
   ```

   ```python
   # FastAPI
   NEW_VAR = os.getenv("NEW_VAR", "default-value")
   ```

2. **Add to `.env.example`** with documentation:
   ```bash
   # New Feature Configuration
   # Description of what this does
   NEW_VAR=default-value
   ```

3. **Update this documentation** if it's a significant change

4. **Update workflow YAML** if it needs to be configurable via secrets

## 🔄 Workflow Integration

The deployment workflow (`.github/workflows/deploy-ec2-staging.yml`) automatically:

1. **Checks for `.env.example`** in the repository
2. **Copies it** to the deployment directory as `.env`
3. **Overrides values** from GitHub Secrets
4. **Sets proper permissions** (600 - owner read/write only)

### Workflow Priority Order

1. **GitHub Secrets** (highest priority)
2. **Workflow inputs** (manual deployment overrides)
3. **`.env.example` defaults** (fallback)

## 🛡️ Security Best Practices

1. **Never commit** `.env` or `.env.local` files
2. **Use strong secrets** for production (min 32 characters for JWT_SECRET)
3. **Rotate secrets** periodically
4. **Use different secrets** for staging and production
5. **Restrict access** to GitHub Secrets (only admins)
6. **Use environment-specific** `.env` files (`.env.staging`, `.env.production`)

## 🔍 Troubleshooting

### Missing Environment Variable

**Error**: `Please add your MongoDB URI to .env.local`

**Solution**:
1. Check if `.env.local` exists
2. Verify `MONGODB_URI` is set
3. Restart the development server

### Deployment Fails

**Error**: Service won't start after deployment

**Solution**:
1. Check GitHub Secrets are configured
2. Verify `.env.example` has all required variables
3. Check deployment logs: `sudo journalctl -u vipcontentai-api.service -n 50`

### Environment Variable Not Updating

**Solution**:
1. Restart the service: `sudo systemctl restart vipcontentai-api.service`
2. Check the `.env` file on the server: `cat /opt/vipcontentai/api-service/.env`
3. Verify the secret is set in GitHub

## 📚 Related Documentation

- [Local Setup Guide](misc/LOCAL_SETUP_GUIDE.md)
- [API Service README](api-service/README.md)
- [Deployment Workflow](.github/workflows/README.md)

## 🔗 Quick Reference

### Generate Secure Secrets

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Random password
openssl rand -hex 16
```

### Check Environment Variables

```bash
# Next.js (development)
cat .env.local

# FastAPI (development)
cat api-service/.env

# Production (on server)
sudo cat /opt/vipcontentai/api-service/.env
sudo cat /opt/vipcontentai/frontend/.env.production
```

### Validate Environment Setup

```bash
# Check Next.js can read env vars
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.MONGODB_URI)"

# Check FastAPI can read env vars
cd api-service
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('OLLAMA_BASE_URL'))"
```

