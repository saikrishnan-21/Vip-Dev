#!/bin/bash
# Script to create .env.staging files for deployment
# These files will be committed to git and copied directly to the server

set -e

echo "Creating .env.staging files for staging deployment..."

# Create api-service/.env.staging
cat > api-service/.env.staging <<'EOF'
# Ollama Configuration
OLLAMA_BASE_URL=http://44.197.16.15:11434
DEFAULT_MODEL=llama3.1:8b
QUALITY_MODEL=llama3.1:70b
EMBEDDING_MODEL=nomic-embed-text

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
# Set to "*" to allow all origins (not recommended for production)
# Or specify comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
EOF

echo "✅ Created api-service/.env.staging"

# Create root .env.staging
# Try to read MONGODB_URI from .env.production if it exists
MONGODB_URI_VALUE="mongodb://admin:PLACEHOLDER_PASSWORD@YOUR_IP:27017/vipcontentai"
if [ -f .env.production ]; then
  echo "📄 Found .env.production, reading MONGODB_URI from lines 17-18..."
  # Read lines 17-18 from .env.production
  PROD_MONGODB_URI=$(sed -n '17,18p' .env.production | grep -E "^MONGODB_URI=" | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  if [ -n "$PROD_MONGODB_URI" ]; then
    MONGODB_URI_VALUE="$PROD_MONGODB_URI"
    # Ensure database name is included in URI
    if [[ "$MONGODB_URI_VALUE" != *"/vipcontentai"* ]] && [[ "$MONGODB_URI_VALUE" != *"/"* ]]; then
      MONGODB_URI_VALUE="${MONGODB_URI_VALUE}/vipcontentai"
      echo "⚠️  Added database name to MONGODB_URI"
    fi
    echo "✅ Using MONGODB_URI from .env.production: ${MONGODB_URI_VALUE%%@*}" # Mask password
  else
    echo "⚠️  MONGODB_URI not found in lines 17-18 of .env.production, using default"
  fi
else
  echo "⚠️  .env.production not found, using default MONGODB_URI"
fi

cat > .env.staging <<EOF
# =============================================================================
# VIPContentAI - Staging Environment Variables
# =============================================================================
# This file is used for staging deployments
# Update values as needed for your staging environment
# =============================================================================

# -----------------------------------------------------------------------------
# Application
# -----------------------------------------------------------------------------
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
NEXT_PUBLIC_APP_URL=http://3.212.80.63:3000

# -----------------------------------------------------------------------------
# Database - MongoDB
# -----------------------------------------------------------------------------
MONGODB_URI=${MONGODB_URI_VALUE}
MONGODB_DB_NAME=vipcontentai

# -----------------------------------------------------------------------------
# Authentication - JWT
# -----------------------------------------------------------------------------
JWT_SECRET=change-this-to-secure-random-string-for-staging-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# -----------------------------------------------------------------------------
# FastAPI AI Service
# -----------------------------------------------------------------------------
FASTAPI_URL=http://3.212.80.63:8000
FASTAPI_AI_SERVICE_URL=http://3.212.80.63:8000

# -----------------------------------------------------------------------------
# Ollama Configuration
# -----------------------------------------------------------------------------
OLLAMA_BASE_URL=http://44.197.16.15:11434
OLLAMA_DEFAULT_MODEL=ollama/qwen2.5:3b
OLLAMA_QUALITY_MODEL=ollama/qwen2.5:3b
EMBEDDING_MODEL=nomic-embed-text:latest
RESEARCHER_MODEL=ollama/qwen2.5:3b
WRITER_MODEL=ollama/qwen2.5:3b
SEO_MODEL=ollama/qwen2.5:3b

# -----------------------------------------------------------------------------
# Hugging Face Model API
# -----------------------------------------------------------------------------
HF_API_BASE_URL=http://44.197.16.15:7860
HF_DEFAULT_IMAGE_MODEL=Tongyi-MAI/Z-Image-Turbo
HF_DEFAULT_VIDEO_MODEL=Wan-AI/Wan2.2-TI2V-5B
HF_DEFAULT_INFERENCE_STEPS=9
HF_DEFAULT_GUIDANCE_SCALE=0.5
HF_DEFAULT_VIDEO_FRAMES=14

# -----------------------------------------------------------------------------
# Weaviate Vector Database
# -----------------------------------------------------------------------------
WEAVIATE_URL=http://44.197.16.15:8080

# -----------------------------------------------------------------------------
# External APIs
# -----------------------------------------------------------------------------
FIRECRAWL_API_KEY=YOUR_FIRECRAWL_API_KEY

# -----------------------------------------------------------------------------
# Email Notifications - AWS SES
# -----------------------------------------------------------------------------
EMAIL_ENABLED=false
EMAIL_SERVICE=aws-ses
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@vipcontentai.com
AWS_SES_FROM_NAME=VIPContentAI
AWS_SES_VERIFIED_EMAILS=noreply@vipcontentai.com

# -----------------------------------------------------------------------------
# File Storage - AWS S3
# -----------------------------------------------------------------------------
STORAGE_TYPE=s3
UPLOAD_DIR=./public/uploads
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=vipplay-ai-content-storage
S3_FOLDER_PREFIX=prod

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
CORS_ORIGIN=http://3.212.80.63:3000
ALLOWED_HOSTS=localhost,127.0.0.1,3.212.80.63
ALLOWED_ORIGINS=*

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# -----------------------------------------------------------------------------
# Logging & Monitoring
# -----------------------------------------------------------------------------
LOG_LEVEL=info
ENABLE_MONITORING=false

# -----------------------------------------------------------------------------
# Feature Flags
# -----------------------------------------------------------------------------
FEATURE_AI_IMAGE_GEN=true
FEATURE_BULK_EXPORT=true
FEATURE_EMAIL_NOTIFICATIONS=false

# -----------------------------------------------------------------------------
# Model Parameters
# -----------------------------------------------------------------------------
MAX_TOKENS=4096
TEMPERATURE=0.7
TOP_P=0.9
FREQUENCY_PENALTY=0.0
PRESENCE_PENALTY=0.0

# -----------------------------------------------------------------------------
# API Configuration
# -----------------------------------------------------------------------------
API_HOST=3.212.80.63
API_PORT=8000
RELOAD=true
CREWAI_TRACING_ENABLED=false

# -----------------------------------------------------------------------------
# EC2 Deployment Paths (used by workflow)
# -----------------------------------------------------------------------------
EC2_BACKEND_PATH=/var/www/vipcontentai-backend
EC2_FRONTEND_PATH=/var/www/vipcontentai-frontend
EC2_HOST=3.212.80.63
EC2_USER=ubuntu
EOF

echo "✅ Created .env.staging"

echo ""
echo "📝 Next steps:"
echo "1. Review and update the .env.staging files with your actual staging values:"
echo "   - ✅ MONGODB_URI: Already set from .env.production or default"
echo "   - ⚠️  JWT_SECRET: Update with secure random string (openssl rand -base64 32)"
echo "   - ⚠️  AWS_SECRET_ACCESS_KEY: Update with your actual AWS secret"
echo "   - ⚠️  FIRECRAWL_API_KEY: Update if different"
echo "   - ⚠️  Review all URLs and IPs match your staging environment"
echo "   - ⚠️  Update EC2 paths if different from defaults"
echo ""
echo "2. All environment variables are included:"
echo "   - Database (MongoDB)"
echo "   - Authentication (JWT)"
echo "   - AI Services (Ollama, FastAPI, Hugging Face)"
echo "   - Storage (AWS S3)"
echo "   - Email (AWS SES)"
echo "   - Security & Rate Limiting"
echo "   - Feature Flags"
echo ""
echo "3. Commit the files:"
echo "   git add .env.staging api-service/.env.staging"
echo "   git commit -m 'Add staging environment configuration with all variables'"
echo "   git push"
echo ""
echo "4. Deploy: The workflow will automatically use these files for staging deployments"
echo "   - Workflow reads .env.staging and creates .env.production"
echo "   - GitHub Secrets can override any variable (optional)"
echo ""
echo "⚠️  Security Note:"
echo "   - Sensitive values (JWT_SECRET, AWS keys) should be updated before committing"
echo "   - Or use GitHub Secrets to override them securely"
echo "   - See .github/workflows/ENV_VARIABLES.md for details"

