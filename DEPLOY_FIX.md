# Fix: Pipeline Running But Server Has Old Code

## Problem
The deployment pipeline extracts files to `frontend_unpacked` but doesn't properly sync them to the main directory. The `.next` directory is from Nov 19 (old), while new files are in `frontend_unpacked` from Nov 26.

## Immediate Fix (Run on Server)

SSH into your server and run:

```bash
cd /var/www/vipcontentai-frontend

# Run the sync script
chmod +x scripts/deploy/sync-frontend-now.sh
./scripts/deploy/sync-frontend-now.sh
```

Or manually:

```bash
cd /var/www/vipcontentai-frontend

# Remove old build
rm -rf .next node_modules

# Copy new files from frontend_unpacked
cp -r frontend_unpacked/.next .
cp -r frontend_unpacked/public .
cp -f frontend_unpacked/package.json .
cp -f frontend_unpacked/pnpm-lock.yaml .
cp -f frontend_unpacked/.env.production .

# Reinstall dependencies
pnpm install --frozen-lockfile --prod

# Restart service
sudo systemctl restart vipcontentai-frontend.service
# OR if using PM2:
pm2 restart vipcontentai-frontend
```

## What Was Fixed

1. **Created `sync-frontend-now.sh`** - Script to immediately sync files on the server
2. **Updated GitHub Actions workflow** - Now properly removes old `.next` directory before copying new one
3. **Added verification** - Script checks that files were synced correctly

## Why This Happened

The deployment workflow was using `cp -r` which can merge directories instead of replacing them. The old `.next` directory wasn't being removed first, so old files remained.

## Prevention

The updated workflow now:
1. ✅ Removes old `.next` directory completely before copying
2. ✅ Verifies `.next` directory exists in archive before proceeding
3. ✅ Shows clear error messages if sync fails
4. ✅ Verifies build ID after sync

## Verify Fix

After running the sync script, check:

```bash
# Check build ID
cat /var/www/vipcontentai-frontend/.next/BUILD_ID

# Check service status
sudo systemctl status vipcontentai-frontend.service

# Check logs
sudo journalctl -u vipcontentai-frontend.service -f --lines=50
```

The build ID should match the latest deployment, and the service should be running with the new code.

