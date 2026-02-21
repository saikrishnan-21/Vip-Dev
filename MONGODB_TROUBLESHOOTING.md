# MongoDB Connection Troubleshooting Guide

## Quick Diagnosis

Run the diagnostic script to identify the issue:

```bash
pnpm db:test
```

This will check:
- ✅ Environment variables
- ✅ URI format
- ✅ Connection to MongoDB
- ✅ Database and collections

## Common Issues and Solutions

### 1. "Database connection failed" Error

**Symptoms:**
- Error message: "Database connection failed. Please check your MongoDB configuration."
- Appears when trying to login or access database

**Common Causes:**

#### A. Missing MONGODB_URI

**Solution:**
1. Create or update `.env.local` file in project root:
   ```env
   MONGODB_URI=mongodb://username:password@host:port/database
   ```

2. Example for local MongoDB:
   ```env
   MONGODB_URI=mongodb://admin:password@localhost:27017/vipcontentai
   ```

3. Example for MongoDB Atlas:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vipcontentai
   ```

4. **Restart your Next.js server** after updating `.env.local`

#### B. Database Name Missing in URI

**Problem:**
```env
MONGODB_URI=mongodb://admin:password@localhost:27017  # ❌ Missing database name
```

**Solution:**
```env
MONGODB_URI=mongodb://admin:password@localhost:27017/vipcontentai  # ✅ Includes database
```

Or set separately:
```env
MONGODB_URI=mongodb://admin:password@localhost:27017
MONGODB_DB_NAME=vipcontentai
```

#### C. Incorrect Credentials

**Check:**
- Username is correct
- Password is correct (no extra spaces)
- For MongoDB Atlas: User has proper permissions

**Solution:**
1. Verify credentials in MongoDB:
   ```bash
   # Test connection manually
   mongosh "mongodb://username:password@host:port/database"
   ```

2. For MongoDB Atlas:
   - Go to Database Access
   - Verify user exists and has read/write permissions
   - Check network access (IP whitelist)

#### D. Network/Firewall Issues

**Symptoms:**
- Connection timeout errors
- ECONNREFUSED errors

**Solution:**

1. **For Remote MongoDB:**
   - Check if IP is whitelisted in MongoDB Atlas
   - Verify firewall allows connections on port 27017
   - Test connectivity: `telnet <host> 27017`

2. **For Local MongoDB:**
   - Ensure MongoDB service is running:
     ```bash
     # Linux/Mac
     sudo systemctl status mongod
     # or
     brew services list | grep mongodb
     
     # Windows
     # Check Services app for MongoDB
     ```

3. **Check MongoDB is listening:**
   ```bash
   # Linux/Mac
   netstat -an | grep 27017
   # or
   lsof -i :27017
   ```

#### E. Connection Timeout

**Solution:**
Add timeout options to your URI:
```env
MONGODB_URI=mongodb://admin:password@host:27017/vipcontentai?serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=60000
```

### 2. "Authentication failed" Error

**Solution:**
1. Verify username and password
2. Check database user permissions
3. For MongoDB Atlas: Ensure user has access to the database

### 3. "Collection not found" Error

**Solution:**
Run database migrations to create collections:
```bash
pnpm db:migrate
```

### 4. "No users found" Error

**Solution:**
Seed the database with initial data:
```bash
pnpm db:seed
```

This creates a default admin user:
- Email: `admin@vipcontentai.com`
- Password: `SecurePass123!`

## Step-by-Step Fix

### Step 1: Check Environment Variables

```bash
# Check if MONGODB_URI is set
echo $MONGODB_URI

# Or in Node.js
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
```

### Step 2: Test Connection

```bash
# Run diagnostic script
pnpm db:test
```

### Step 3: Verify MongoDB is Running

**Local MongoDB:**
```bash
# Linux/Mac
sudo systemctl status mongod
# or
ps aux | grep mongod

# Windows
# Check Services app
```

**Remote MongoDB:**
```bash
# Test connectivity
ping <mongodb-host>
telnet <mongodb-host> 27017
```

### Step 4: Check URI Format

**Correct formats:**
```env
# Standard connection
MONGODB_URI=mongodb://username:password@host:port/database

# MongoDB Atlas (SRV)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# With options
MONGODB_URI=mongodb://username:password@host:port/database?serverSelectionTimeoutMS=30000
```

**Common mistakes:**
- ❌ Missing database name: `mongodb://user:pass@host:port`
- ✅ Include database: `mongodb://user:pass@host:port/vipcontentai`
- ❌ Extra spaces in URI
- ❌ Special characters not URL-encoded in password

### Step 5: Restart Application

After fixing `.env.local`:
```bash
# Stop the server (Ctrl+C)
# Then restart
pnpm dev
```

### Step 6: Run Migrations and Seed

```bash
# Create collections
pnpm db:migrate

# Add initial data
pnpm db:seed
```

## Environment File Locations

The app looks for environment files in this order:
1. `.env.local` (development - gitignored)
2. `.env.production` (production)
3. `.env.staging` (staging)
4. `.env` (fallback)

**For development, use `.env.local`**

## Health Check

After fixing, verify the connection:

```bash
# Check health endpoint
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "status": "healthy",
  "checks": {
    "mongodb_connection": {
      "status": "ok",
      "message": "MongoDB connection successful"
    }
  }
}
```

## Still Having Issues?

1. **Check server logs:**
   ```bash
   # Next.js logs will show detailed error messages
   # Look for MongoDB connection errors
   ```

2. **Enable debug logging:**
   ```env
   # Add to .env.local
   DEBUG=mongodb:*
   ```

3. **Test with mongosh:**
   ```bash
   mongosh "your-mongodb-uri"
   ```

4. **Check MongoDB logs:**
   ```bash
   # Linux/Mac
   tail -f /var/log/mongodb/mongod.log
   
   # Or check MongoDB Atlas logs in web interface
   ```

## Quick Reference

### Local MongoDB Setup

```bash
# Install MongoDB (if not installed)
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Create admin user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: ["root"]
})
```

### MongoDB Atlas Setup

1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist your IP address
4. Get connection string
5. Add to `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vipcontentai
   ```

## Support

If issues persist:
1. Run `pnpm db:test` and share the output
2. Check Next.js server logs for detailed errors
3. Verify MongoDB server logs
4. Test connection with mongosh directly

