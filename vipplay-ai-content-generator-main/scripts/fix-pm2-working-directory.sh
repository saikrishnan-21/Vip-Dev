#!/bin/bash
# Quick fix script for PM2 working directory issue
# Run this on your server to fix the PM2 process

set -e

echo "🔧 Fixing PM2 working directory issue..."

# Get the frontend path (update this with your actual path)
FRONTEND_PATH="${EC2_FRONTEND_PATH:-/var/www/vipcontentai-frontend}"

if [ -z "$FRONTEND_PATH" ] || [ ! -d "$FRONTEND_PATH" ]; then
  echo "❌ Frontend path not found: $FRONTEND_PATH"
  echo "Please set EC2_FRONTEND_PATH environment variable or update FRONTEND_PATH in this script"
  exit 1
fi

echo "📁 Frontend path: $FRONTEND_PATH"

# Change to frontend directory
cd "$FRONTEND_PATH"

# Verify package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ ERROR: package.json not found in $FRONTEND_PATH"
  echo "Current directory: $(pwd)"
  echo "Contents:"
  ls -la
  exit 1
fi

echo "✅ Found package.json in $FRONTEND_PATH"

# Get absolute path
ABS_PATH=$(pwd)
echo "📍 Absolute path: $ABS_PATH"

# Stop existing PM2 process
echo "🛑 Stopping existing PM2 process..."
pm2 delete vipcontentai-frontend 2>/dev/null || true
sleep 2

# Create PM2 ecosystem file
echo "📝 Creating PM2 ecosystem file..."
cat > "$ABS_PATH/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'vipcontentai-frontend',
    script: 'npm',
    args: 'start',
    cwd: '$ABS_PATH',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '$ABS_PATH/logs/pm2-error.log',
    out_file: '$ABS_PATH/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

echo "✅ Created ecosystem.config.js"

# Create logs directory
mkdir -p "$ABS_PATH/logs"

# Start PM2 with ecosystem file
echo "🚀 Starting PM2 with ecosystem file..."
cd "$ABS_PATH"
pm2 start "$ABS_PATH/ecosystem.config.js"
pm2 save

# Verify
echo ""
echo "✅ PM2 process started!"
echo ""
echo "📊 PM2 Status:"
pm2 status vipcontentai-frontend

echo ""
echo "📋 PM2 Process Details:"
pm2 describe vipcontentai-frontend | grep -E "cwd|script|args|status" || true

echo ""
echo "📝 Logs location:"
echo "   Error: $ABS_PATH/logs/pm2-error.log"
echo "   Output: $ABS_PATH/logs/pm2-out.log"
echo ""
echo "💡 View logs with: pm2 logs vipcontentai-frontend"

