#!/bin/bash
# Fix Frontend Deployment - Properly sync files from frontend_unpacked
# Run this on the EC2 server to fix stale code issues

set -e

FRONTEND_PATH="${EC2_FRONTEND_PATH:-/var/www/vipcontentai-frontend}"

echo "========================================="
echo "Fixing Frontend Deployment"
echo "========================================="
echo "Frontend Path: $FRONTEND_PATH"
echo ""

# Check if directory exists
if [ ! -d "$FRONTEND_PATH" ]; then
    echo "❌ Error: Frontend path does not exist: $FRONTEND_PATH"
    exit 1
fi

cd "$FRONTEND_PATH"

# Check if frontend_unpacked exists
if [ ! -d "frontend_unpacked" ]; then
    echo "❌ Error: frontend_unpacked directory not found"
    echo "The deployment archive may not have been extracted yet."
    exit 1
fi

echo "🧹 Removing old build artifacts..."
# Remove old .next directory completely
rm -rf .next
# Remove old node_modules (will reinstall)
rm -rf node_modules

echo "📦 Syncing files from frontend_unpacked..."

# Copy .next directory (new build)
if [ -d "frontend_unpacked/.next" ]; then
    echo "  → Copying .next directory..."
    cp -r frontend_unpacked/.next .
    echo "  ✅ .next directory synced"
else
    echo "  ⚠️  Warning: .next directory not found in frontend_unpacked"
fi

# Copy public directory
if [ -d "frontend_unpacked/public" ]; then
    echo "  → Copying public directory..."
    rm -rf public
    cp -r frontend_unpacked/public .
    echo "  ✅ public directory synced"
fi

# Copy package files
if [ -f "frontend_unpacked/package.json" ]; then
    echo "  → Copying package.json..."
    cp frontend_unpacked/package.json .
    echo "  ✅ package.json synced"
fi

if [ -f "frontend_unpacked/pnpm-lock.yaml" ]; then
    echo "  → Copying pnpm-lock.yaml..."
    cp frontend_unpacked/pnpm-lock.yaml .
    echo "  ✅ pnpm-lock.yaml synced"
fi

# Copy environment file
if [ -f "frontend_unpacked/.env.production" ]; then
    echo "  → Copying .env.production..."
    cp frontend_unpacked/.env.production .
    echo "  ✅ .env.production synced"
fi

# Copy next.config if exists
if [ -f "frontend_unpacked/next.config.mjs" ]; then
    echo "  → Copying next.config.mjs..."
    cp frontend_unpacked/next.config.mjs .
    echo "  ✅ next.config.mjs synced"
fi

if [ -f "frontend_unpacked/next.config.js" ]; then
    echo "  → Copying next.config.js..."
    cp frontend_unpacked/next.config.js .
    echo "  ✅ next.config.js synced"
fi

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
if ! command -v pnpm >/dev/null 2>&1; then
    echo "  → Installing pnpm..."
    npm install -g pnpm
fi

echo "  → Running pnpm install..."
# Set CI environment variable to avoid TTY issues in automated environments
export CI=true
pnpm install --frozen-lockfile --prod

# Verify .next directory exists and has content
if [ ! -d ".next" ]; then
    echo "❌ Error: .next directory still missing after sync"
    exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
    echo "⚠️  Warning: .next/BUILD_ID not found - build may be incomplete"
fi

echo ""
echo "✅ Frontend deployment fixed!"
echo ""
echo "Current directory contents:"
ls -lah | grep -E "^d|^-" | head -10

echo ""
echo "Next steps:"
echo "  1. Restart Next.js service:"
echo "     sudo systemctl restart vipcontentai-frontend.service"
echo "     # OR if using PM2:"
echo "     pm2 restart vipcontentai-frontend"
echo ""
echo "  2. Check service status:"
echo "     sudo systemctl status vipcontentai-frontend.service"
echo ""
echo "  3. View logs:"
echo "     sudo journalctl -u vipcontentai-frontend.service -f"

