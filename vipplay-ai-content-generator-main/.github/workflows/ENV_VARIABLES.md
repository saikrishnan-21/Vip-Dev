# Environment Variables in GitHub Actions Workflow

## Overview

The `deploy-ec2-staging-env.yml` workflow uses **two methods** for environment variables:

1. **`.env.staging` files from repository** (primary method)
2. **GitHub Secrets** (optional override)

## How MONGODB_URI Works

### Method 1: From .env.staging File (Default)

The workflow reads `MONGODB_URI` from the `.env.staging` file in your repository:

```yaml
# In workflow:
- name: Prepare .env.production from .env.staging
  run: |
    if [ -f .env.staging ]; then
      cp .env.staging .env.production
      # MONGODB_URI is included from .env.staging
    fi
```

**Steps:**
1. Create `.env.staging` file in repository root
2. Add `MONGODB_URI=mongodb://...` to the file
3. Commit and push
4. Workflow automatically uses it

### Method 2: From GitHub Secrets (Optional Override)

You can also set `MONGODB_URI` as a GitHub Secret to override the value from `.env.staging`:

**Setup:**
1. Go to **Repository Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `MONGODB_URI`
4. Value: Your MongoDB connection string
5. Click **Add secret**

**How it works:**
```yaml
# Workflow checks for secret and overrides if found
if [ -n "${{ secrets.MONGODB_URI }}" ]; then
  # Override MONGODB_URI in .env.production
  sed -i "s|^MONGODB_URI=.*|MONGODB_URI=${{ secrets.MONGODB_URI }}|" .env.production
fi
```

## Why MONGODB_URI Might Not Be Available

### Issue 1: .env.staging File Missing

**Problem:** `.env.staging` file doesn't exist in repository

**Solution:**
```bash
# Create .env.staging file
bash scripts/create-env-staging.sh

# Edit and add MONGODB_URI
nano .env.staging

# Commit and push
git add .env.staging
git commit -m "Add .env.staging with MONGODB_URI"
git push
```

### Issue 2: MONGODB_URI Not in .env.staging

**Problem:** `.env.staging` exists but doesn't have `MONGODB_URI`

**Solution:**
```bash
# Edit .env.staging
nano .env.staging

# Add this line:
MONGODB_URI=mongodb://username:password@host:port/vipcontentai

# Commit and push
git add .env.staging
git commit -m "Add MONGODB_URI to .env.staging"
git push
```

### Issue 3: GitHub Secret Not Set

**Problem:** Want to use GitHub Secret but haven't set it up

**Solution:**
1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add secret `MONGODB_URI` with your connection string
3. The workflow will automatically use it to override `.env.staging`

## Environment Variables Priority

The workflow uses this priority order:

1. **GitHub Secrets** (if set) - Highest priority
2. **`.env.staging` file** (from repository)
3. **Default values** (fallback)

## Available GitHub Secrets

### Required Secrets:
- `EC2_HOST` - EC2 instance hostname/IP
- `EC2_USER` - SSH username
- `EC2_SSH_KEY` - Private SSH key
- `EC2_FRONTEND_PATH` - Frontend deployment path
- `EC2_BACKEND_PATH` - Backend deployment path

### Optional Secrets (Override .env.staging):
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `FASTAPI_AI_SERVICE_URL` - FastAPI service URL
- `OLLAMA_BASE_URL` - Ollama service URL

## Adding MONGODB_URI to Workflow

### Option A: Use .env.staging (Recommended for Staging)

1. **Create/Update `.env.staging`:**
   ```bash
   bash scripts/create-env-staging.sh
   nano .env.staging
   # Add: MONGODB_URI=mongodb://...
   ```

2. **Commit:**
   ```bash
   git add .env.staging
   git commit -m "Add MONGODB_URI to staging config"
   git push
   ```

### Option B: Use GitHub Secret (More Secure)

1. **Add Secret:**
   - Repository → Settings → Secrets → Actions
   - New secret: `MONGODB_URI`
   - Value: Your MongoDB connection string

2. **Workflow automatically uses it** (no code changes needed)

## Debugging

### Check if MONGODB_URI is Available

Add this to your workflow step for debugging:

```yaml
- name: Debug Environment Variables
  run: |
    echo "Checking MONGODB_URI sources..."
    
    # Check GitHub Secret
    if [ -n "${{ secrets.MONGODB_URI }}" ]; then
      echo "✅ MONGODB_URI found in GitHub Secrets"
    else
      echo "❌ MONGODB_URI not in GitHub Secrets"
    fi
    
    # Check .env.staging
    if [ -f .env.staging ]; then
      if grep -q "^MONGODB_URI=" .env.staging; then
        echo "✅ MONGODB_URI found in .env.staging"
        grep "^MONGODB_URI=" .env.staging | sed 's|://[^:]*:[^@]*@|://***:***@|'
      else
        echo "❌ MONGODB_URI not in .env.staging"
      fi
    else
      echo "❌ .env.staging file not found"
    fi
```

### View Final .env.production

Add this step to see what's in the final file:

```yaml
- name: Show .env.production (masked)
  run: |
    if [ -f .env.production ]; then
      echo "📋 .env.production contents (MONGODB_URI masked):"
      sed 's|MONGODB_URI=.*|MONGODB_URI=***|' .env.production
    fi
```

## Best Practices

### For Staging Environment:
✅ **Use `.env.staging` file** - Simple, version controlled  
✅ **Commit to repository** - Easy to update  
⚠️ **Use strong passwords** - Even for staging  

### For Production Environment:
✅ **Use GitHub Secrets** - More secure  
✅ **Don't commit secrets** - Keep out of repository  
✅ **Rotate regularly** - Change passwords quarterly  

## Example: Complete Setup

### 1. Create .env.staging with MONGODB_URI:
```bash
bash scripts/create-env-staging.sh
nano .env.staging
# Add: MONGODB_URI=mongodb://admin:password@host:27017/vipcontentai
```

### 2. Or Set GitHub Secret:
- Settings → Secrets → Actions → New secret
- Name: `MONGODB_URI`
- Value: `mongodb://admin:password@host:27017/vipcontentai`

### 3. Workflow Will Use It:
- If GitHub Secret exists → Uses secret
- Else if .env.staging exists → Uses file
- Else → Uses default

## Troubleshooting

### "MONGODB_URI not found" Error

**Check:**
1. Is `.env.staging` in repository?
   ```bash
   git ls-files | grep .env.staging
   ```

2. Does it contain MONGODB_URI?
   ```bash
   grep MONGODB_URI .env.staging
   ```

3. Is GitHub Secret set?
   - Go to Settings → Secrets → Actions
   - Check if `MONGODB_URI` exists

### "Database connection failed" After Deployment

**Check:**
1. Verify MONGODB_URI format:
   ```bash
   # On server
   cat /path/to/frontend/.env.production | grep MONGODB_URI
   ```

2. Test connection:
   ```bash
   mongosh "your-mongodb-uri-here"
   ```

3. Check MongoDB server:
   - Is MongoDB running?
   - Is IP whitelisted?
   - Are credentials correct?

## AWS S3 Configuration

### Required for Image Storage

The FastAPI backend now uses AWS S3 to store generated images. The following environment variables must be configured:

**GitHub Secrets (Required for FastAPI):**
- `AWS_ACCESS_KEY_ID` - AWS access key for S3
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for S3
- `AWS_REGION` - AWS region (e.g., `ap-southeast-2`)
- `S3_BUCKET_NAME` - S3 bucket name (e.g., `vipplay-ai-content-storage`)
- `S3_FOLDER_PREFIX` - Folder prefix for organization (e.g., `dev`, `staging`, `prod`)

**Note:** These are automatically added to the FastAPI `.env` file during deployment.

## Summary

- **MONGODB_URI** comes from `.env.staging` file OR GitHub Secrets
- **GitHub Secrets** override `.env.staging` if both exist
- **Create `.env.staging`** with `MONGODB_URI` for staging
- **Use GitHub Secrets** for production (more secure)
- **AWS S3 credentials** must be set as GitHub Secrets for FastAPI image storage

