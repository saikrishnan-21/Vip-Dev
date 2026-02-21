#!/bin/bash
# Immediate Frontend Sync Script
# Run this on the server to sync files from frontend_unpacked NOW
# Usage: ./sync-frontend-now.sh

set -e

FRONTEND_PATH="${FRONTEND_PATH:-/var/www/vipcontentai-frontend}"

echo "========================================="
echo "Syncing Frontend Files NOW"
echo "========================================="
echo "Frontend Path: $FRONTEND_PATH"
echo "Timestamp: $(date)"
echo ""

cd "$FRONTEND_PATH"

# Check if frontend_unpacked exists
if [ ! -d "frontend_unpacked" ]; then
    echo "❌ Error: frontend_unpacked directory not found"
    echo "   Current directory: $(pwd)"
    echo "   Contents:"
    ls -la
    exit 1
fi

echo "📋 Files in frontend_unpacked:"
ls -lah frontend_unpacked/ | head -10
echo ""

echo "🧹 Removing OLD build artifacts..."
# Remove old .next completely
if [ -d ".next" ]; then
    echo "  → Removing old .next directory (from $(stat -c %y .next 2>/dev/null | cut -d' ' -f1))..."
    rm -rf .next
fi

# Remove old node_modules (will reinstall)
if [ -d "node_modules" ]; then
    echo "  → Removing old node_modules..."
    rm -rf node_modules
fi

echo ""
echo "📦 Syncing NEW files from frontend_unpacked..."

# Copy .next directory (NEW build)
if [ -d "frontend_unpacked/.next" ]; then
    echo "  → Copying NEW .next directory..."
    cp -r frontend_unpacked/.next .
    echo "  ✅ .next directory synced"
    if [ -f ".next/BUILD_ID" ]; then
        echo "     Build ID: $(cat .next/BUILD_ID)"
    fi
else
    echo "  ❌ Error: .next directory not found in frontend_unpacked"
    exit 1
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
    cp -f frontend_unpacked/package.json .
    echo "  ✅ package.json synced"
fi

if [ -f "frontend_unpacked/pnpm-lock.yaml" ]; then
    echo "  → Copying pnpm-lock.yaml..."
    cp -f frontend_unpacked/pnpm-lock.yaml .
    echo "  ✅ pnpm-lock.yaml synced"
fi

# Copy environment file
if [ -f "frontend_unpacked/.env.production" ]; then
    echo "  → Copying .env.production..."
    cp -f frontend_unpacked/.env.production .
    echo "  ✅ .env.production synced"
fi

# Copy next.config if exists
if [ -f "frontend_unpacked/next.config.mjs" ]; then
    echo "  → Copying next.config.mjs..."
    cp -f frontend_unpacked/next.config.mjs .
    echo "  ✅ next.config.mjs synced"
fi

if [ -f "frontend_unpacked/next.config.js" ]; then
    echo "  → Copying next.config.js..."
    cp -f frontend_unpacked/next.config.js .
    echo "  ✅ next.config.js synced"
fi

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
if ! command -v pnpm >/dev/null 2>&1; then
    echo "  → Installing pnpm..."
    npm install -g pnpm
fi

echo "  → Running pnpm install --frozen-lockfile --prod..."
# Set CI environment variable to avoid TTY issues in automated environments
export CI=true
pnpm install --frozen-lockfile --prod

# Verify
echo ""
echo "✅ Verification:"
if [ -d ".next" ]; then
    echo "  ✅ .next directory exists"
    if [ -f ".next/BUILD_ID" ]; then
        BUILD_ID=$(cat .next/BUILD_ID)
        echo "  ✅ Build ID: $BUILD_ID"
        echo "  ✅ Build timestamp: $(stat -c %y .next/BUILD_ID 2>/dev/null | cut -d' ' -f1-2 || echo 'unknown')"
    else
        echo "  ⚠️  Warning: BUILD_ID not found"
    fi
else
    echo "  ❌ Error: .next directory missing!"
    exit 1
fi

echo ""
echo "========================================="
echo "✅ Frontend sync completed!"
echo "========================================="
echo ""
echo "Current directory structure:"
ls -lah | grep -E "^d|^-" | head -15
echo ""
echo "📊 Directory sizes:"
du -sh .next 2>/dev/null || echo "  .next: N/A"
du -sh node_modules 2>/dev/null || echo "  node_modules: N/A"
du -sh frontend_unpacked 2>/dev/null || echo "  frontend_unpacked: N/A"
echo ""
echo "🔄 Next steps:"
echo "  1. Restart Next.js service:"
echo "     sudo systemctl restart vipcontentai-frontend.service"
echo "     # OR if using PM2:"
echo "     pm2 restart vipcontentai-frontend"
echo ""
echo "  2. Check service status:"
echo "     sudo systemctl status vipcontentai-frontend.service"
echo ""
echo "  3. View logs:"
echo "     sudo journalctl -u vipcontentai-frontend.service -f --lines=50"

