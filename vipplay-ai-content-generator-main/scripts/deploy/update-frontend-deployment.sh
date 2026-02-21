#!/bin/bash
# Update Frontend Deployment Script
# This script improves the GitHub Actions deployment to properly sync files

set -euo pipefail

FRONTEND_PATH="${EC2_FRONTEND_PATH:-/var/www/vipcontentai-frontend}"

echo "📁 Using EC2_FRONTEND_PATH=$FRONTEND_PATH"
echo "👤 Remote user: $USER"

echo "📂 Ensuring directory exists and fixing permissions..."
sudo mkdir -p "$FRONTEND_PATH"
sudo chown -R "$USER:$USER" "$FRONTEND_PATH"

cd "$FRONTEND_PATH"

echo "🧹 Cleaning previous unpacked build..."
rm -rf frontend_unpacked || true
mkdir -p frontend_unpacked

echo "📦 Extracting ~/frontend.tar.gz into frontend_unpacked..."
if [ ! -f ~/frontend.tar.gz ]; then
    echo "❌ Error: ~/frontend.tar.gz not found"
    exit 1
fi

tar -xzf ~/frontend.tar.gz -C frontend_unpacked

echo "📁 Syncing build files (removing old first)..."

# Remove old build artifacts completely
echo "  → Removing old .next directory..."
rm -rf .next

echo "  → Copying new .next directory..."
if [ -d "frontend_unpacked/.next" ]; then
    cp -r frontend_unpacked/.next .
    echo "  ✅ .next directory synced"
else
    echo "  ❌ Error: .next directory not found in archive"
    exit 1
fi

# Sync public directory
echo "  → Syncing public directory..."
rm -rf public
if [ -d "frontend_unpacked/public" ]; then
    cp -r frontend_unpacked/public .
    echo "  ✅ public directory synced"
fi

# Sync package files
echo "  → Syncing package files..."
cp -f frontend_unpacked/package.json .
if [ -f "frontend_unpacked/pnpm-lock.yaml" ]; then
    cp -f frontend_unpacked/pnpm-lock.yaml .
fi
if [ -f "frontend_unpacked/.env.production" ]; then
    cp -f frontend_unpacked/.env.production .
fi

# Copy next.config if exists
if [ -f "frontend_unpacked/next.config.mjs" ]; then
    cp -f frontend_unpacked/next.config.mjs .
fi
if [ -f "frontend_unpacked/next.config.js" ]; then
    cp -f frontend_unpacked/next.config.js .
fi

echo "📦 Ensuring pnpm is installed..."
if ! command -v pnpm >/dev/null 2>&1; then
    npm install -g pnpm
fi

echo "📥 Installing production dependencies..."
# Set CI environment variable to avoid TTY issues in automated environments
export CI=true
pnpm install --frozen-lockfile --prod

# Verify build
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "❌ Error: Build verification failed - .next directory incomplete"
    exit 1
fi

echo "✅ Frontend deployment completed successfully!"
echo ""
echo "Build ID: $(cat .next/BUILD_ID 2>/dev/null || echo 'unknown')"
echo "Deployment timestamp: $(date)"

