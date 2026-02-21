# Fix PM2 Working Directory Issue

## Problem

PM2 is trying to run from `/root/` instead of the application directory, causing:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/root/package.json'
```

## Quick Fix (On Server)

### Option 1: Fix Existing PM2 Process

SSH into your server and run:

```bash
# 1. Stop the current PM2 process
pm2 delete vipcontentai-frontend

# 2. Navigate to your application directory
cd /path/to/your/frontend  # Replace with actual EC2_FRONTEND_PATH

# 3. Verify package.json exists
ls -la package.json

# 4. Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vipcontentai-frontend',
    script: 'npm',
    args: 'start',
    cwd: process.cwd(),
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# 5. Create logs directory
mkdir -p logs

# 6. Start PM2 with ecosystem file
pm2 start ecosystem.config.js

# 7. Save PM2 configuration
pm2 save

# 8. Check status
pm2 status vipcontentai-frontend
pm2 logs vipcontentai-frontend --lines 20
```

### Option 2: Manual PM2 Start with Working Directory

```bash
# 1. Stop current process
pm2 delete vipcontentai-frontend

# 2. Navigate to application directory
cd /path/to/your/frontend  # Replace with actual path

# 3. Start PM2 from the correct directory
pm2 start npm --name vipcontentai-frontend -- start

# 4. Save
pm2 save
```

### Option 3: Use Absolute Path in PM2

```bash
# 1. Stop current process
pm2 delete vipcontentai-frontend

# 2. Start with explicit cwd (replace with your actual path)
FRONTEND_PATH="/opt/vipcontentai/frontend"  # Update this
cd "$FRONTEND_PATH"
pm2 start npm --name vipcontentai-frontend -- start
pm2 save
```

## Find Your Application Directory

If you're not sure where your application is deployed:

```bash
# Search for package.json
find / -name "package.json" -type f 2>/dev/null | grep -v node_modules

# Or check PM2 process info
pm2 describe vipcontentai-frontend

# Or check where files were deployed (look for .next directory)
find / -name ".next" -type d 2>/dev/null
```

## Verify Fix

After applying the fix:

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs vipcontentai-frontend --lines 50

# Verify it's running from correct directory
pm2 describe vipcontentai-frontend | grep cwd

# Test the application
curl http://localhost:3000/api/health
```

## Prevention

The deployment workflow has been updated to:
1. Create a PM2 ecosystem file with explicit `cwd`
2. Verify `package.json` exists before starting
3. Use absolute paths for working directory

The next deployment will automatically fix this issue.

## Troubleshooting

### If PM2 still can't find package.json:

1. **Verify the path:**
   ```bash
   cd /path/to/frontend
   pwd
   ls -la package.json
   ```

2. **Check file permissions:**
   ```bash
   ls -la package.json
   # Should be readable by the user running PM2
   ```

3. **Check PM2 is running as correct user:**
   ```bash
   whoami
   pm2 describe vipcontentai-frontend | grep user
   ```

4. **Restart PM2 daemon:**
   ```bash
   pm2 kill
   pm2 resurrect
   ```

### If the application still doesn't start:

1. **Check Node.js and npm:**
   ```bash
   node --version
   npm --version
   ```

2. **Check environment variables:**
   ```bash
   cd /path/to/frontend
   cat .env.production
   ```

3. **Try starting manually:**
   ```bash
   cd /path/to/frontend
   npm start
   # This will show any errors
   ```

## Updated Deployment Workflow

The deployment workflow now:
- ✅ Creates a PM2 ecosystem file with explicit working directory
- ✅ Verifies `package.json` exists before starting
- ✅ Creates logs directory
- ✅ Uses absolute paths for reliability

This ensures PM2 always runs from the correct directory.

