#!/bin/bash
# Script to create .env.example files for the project
# Run this script to set up environment variable templates

set -e

echo "Creating .env.example files..."

# Create api-service/.env.example
cat > api-service/.env.example <<'EOF'
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
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
# Number of worker processes for multi-user support (default: 4)
FASTAPI_WORKERS=4

# CORS Configuration
# Set to "*" to allow all origins (not recommended for production)
# Or specify comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
EOF

echo "✅ Created api-service/.env.example"

# Verify the file was created
if [ -f "api-service/.env.example" ]; then
  echo "✅ Verified: api-service/.env.example exists"
else
  echo "⚠️  Warning: api-service/.env.example was not created. You may need to create it manually."
fi

# Create root .env.example
cat > .env.example <<'EOF'
# MongoDB Configuration
# Required: MongoDB connection string
# Format: mongodb://[username:password@]host[:port]/[database]
# Example: mongodb://admin:password@localhost:27017/vipcontentai
# Example (Atlas): mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai
MONGODB_URI=mongodb://localhost:27017/vipcontentai

# FastAPI AI Service Configuration
# Required: URL of the FastAPI AI microservice
# This is used by Next.js to call AI operations
FASTAPI_AI_SERVICE_URL=http://localhost:8000
FASTAPI_URL=http://localhost:8000

# JWT Configuration
# Required: Secret key for JWT token signing (minimum 32 characters recommended)
# Generate a secure random string for production
# Example: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256

# AWS SQS Configuration (for asynchronous job processing)
# Required for SQS queue feature
# Get these from AWS Console → SQS → Your Queue → Details
SQS_ARTICLES_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT_ID/prod-vipplay-articles
SQS_IMAGE_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT_ID/prod-vipplay-image
SQS_VIDEO_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT_ID/prod-vipplay-video

# AWS Credentials (Required for SQS)
# Get these from AWS Console → IAM → Users → Security Credentials
# Or use AWS IAM roles if running on EC2
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# SQS Worker Configuration (Optional - defaults shown, optimized for multi-user)
# Poll interval in milliseconds (how often worker checks for messages)
SQS_POLL_INTERVAL=3000
# Maximum messages to receive per poll (increased for better throughput)
SQS_MAX_MESSAGES=10
# Visibility timeout in seconds (how long message is hidden after being received)
SQS_VISIBILITY_TIMEOUT=600
# Long polling wait time in seconds (how long to wait for messages)
SQS_WAIT_TIME_SECONDS=20

# SQS Worker Concurrency Limits (Optional - defaults shown, optimized for multi-user)
# Maximum concurrent articles per worker instance (run multiple workers for scaling)
MAX_CONCURRENT_ARTICLES=5
# Maximum concurrent images per worker instance
MAX_CONCURRENT_IMAGES=5
# Maximum concurrent videos per worker instance
MAX_CONCURRENT_VIDEOS=3

# Queue Limit Configuration
# Maximum concurrent jobs (queued or processing) per user across all types (articles + images)
# Default: 10 (increased from 5 for better user experience)
MAX_CONCURRENT_JOBS=10

# MongoDB Connection Pool (Optional - defaults shown, optimized for multi-user)
# Maximum connections in the pool (increased for multi-user support)
MONGODB_MAX_POOL_SIZE=50
# Minimum connections in the pool (increased for multi-user support)
MONGODB_MIN_POOL_SIZE=10

# Ollama Configuration (for admin routes)
# Optional: Direct Ollama URL for admin/model management routes
# If not set, will default to http://localhost:11434
OLLAMA_BASE_URL=http://localhost:11434

# Next.js Configuration
# Optional: Server configuration
NODE_ENV=development
PORT=3000
HOSTNAME=0.0.0.0

# Redis Configuration (if used)
# Optional: Redis connection string for caching/rate limiting
# REDIS_URL=redis://localhost:6379

# Firecrawl API (if used for web scraping)
# Optional: API key for Firecrawl service
# FIRECRAWL_API_KEY=your-firecrawl-api-key

# SendGrid API (if used for email notifications)
# Optional: API key for SendGrid email service
# SENDGRID_API_KEY=your-sendgrid-api-key
EOF

echo "✅ Created .env.example"

echo ""
echo "📝 Next steps:"
echo "1. Review the created .env.example files"
echo "2. Copy them to create your local .env files:"
echo "   cp .env.example .env.local"
echo "   cp api-service/.env.example api-service/.env"
echo "3. Update the values in .env.local and api-service/.env with your actual configuration"
echo "4. Never commit .env or .env.local files to git (they're in .gitignore)"
echo ""
echo "See ENV_MAINTENANCE.md for detailed documentation."

