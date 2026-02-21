# MongoDB Atlas Setup Guide for VIPContentAI

Complete guide to set up and configure MongoDB Atlas for the VIPContentAI project.

## 📋 Table of Contents

1. [What is MongoDB Atlas?](#what-is-mongodb-atlas)
2. [Getting Started](#getting-started)
3. [Creating a Cluster](#creating-a-cluster)
4. [Database User Setup](#database-user-setup)
5. [Network Access Configuration](#network-access-configuration)
6. [Getting Connection String](#getting-connection-string)
7. [Configuring the Project](#configuring-the-project)
8. [Testing Connection](#testing-connection)
9. [MongoDB Atlas Queries](#mongodb-atlas-queries)
10. [Troubleshooting](#troubleshooting)

---

## 🌐 What is MongoDB Atlas?

MongoDB Atlas is MongoDB's fully-managed cloud database service. It provides:
- ✅ Automatic backups
- ✅ High availability
- ✅ Automatic scaling
- ✅ Security features
- ✅ Monitoring and alerts
- ✅ Free tier available (M0 cluster)

---

## 🚀 Getting Started

### Step 1: Create MongoDB Atlas Account

1. **Visit MongoDB Atlas:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Click "Try Free" or "Sign Up"

2. **Sign Up:**
   - Use email or Google/GitHub account
   - Verify your email address

3. **Complete Setup:**
   - Choose your organization name
   - Select cloud provider (AWS, Google Cloud, Azure)
   - Choose region closest to your users

---

## 🏗️ Creating a Cluster

### Step 1: Create New Cluster

1. **In MongoDB Atlas Dashboard:**
   - Click "Build a Database"
   - Or click "Create" → "Database"

2. **Choose Cluster Type:**
   - **Free Tier (M0):** For development/testing
   - **Shared (M2/M5):** For small production apps
   - **Dedicated (M10+):** For production workloads

3. **Select Cloud Provider & Region:**
   - **AWS:** Recommended for most users
   - **Google Cloud:** Alternative option
   - **Azure:** Alternative option
   - Choose region closest to your application servers

4. **Cluster Name:**
   - Enter a name (e.g., "vipcontentai-cluster")
   - Click "Create Cluster"

5. **Wait for Creation:**
   - Takes 3-5 minutes
   - You'll see "Your cluster is ready" message

---

## 👤 Database User Setup

### Step 1: Create Database User

1. **Go to Database Access:**
   - Click "Database Access" in left sidebar
   - Click "Add New Database User"

2. **Authentication Method:**
   - Select "Password" (recommended)

3. **User Details:**
   - **Username:** `vipcontentai_user` (or your choice)
   - **Password:** Click "Autogenerate Secure Password" or create your own
   - **⚠️ Save the password!** You'll need it for connection string

4. **Database User Privileges:**
   - Select "Read and write to any database"
   - Or select specific database: `vipcontentai`

5. **Click "Add User"**

### Step 2: Save Credentials

**Important:** Save these credentials securely:
- Username: `vipcontentai_user`
- Password: `[your-password]`

---

## 🔒 Network Access Configuration

### Step 1: Configure IP Whitelist

1. **Go to Network Access:**
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"

2. **For Development:**
   - Click "Add Current IP Address" (adds your current IP)
   - Or click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
   - ⚠️ **Warning:** `0.0.0.0/0` allows access from anywhere (less secure)

3. **For Production:**
   - Add specific IP addresses of your servers
   - Add IP ranges if using multiple servers
   - Example: `52.202.212.166/32` (single IP)

4. **Click "Confirm"**

### Step 2: Verify Network Access

- Green checkmark means IP is whitelisted
- Red X means access is blocked

---

## 🔗 Getting Connection String

### Step 1: Get Connection String

1. **Go to Database:**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster

2. **Choose Connection Method:**
   - Click "Connect your application"

3. **Select Driver:**
   - **Driver:** Node.js
   - **Version:** 5.5 or later

4. **Copy Connection String:**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 2: Update Connection String

Replace placeholders in the connection string:

**Before:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**After:**
```
mongodb+srv://vipcontentai_user:YourPassword123@cluster0.xxxxx.mongodb.net/vipcontentai?retryWrites=true&w=majority
```

**Changes:**
1. Replace `<username>` with your database username
2. Replace `<password>` with your database password
3. Add `/vipcontentai` before the `?` (database name)
4. Keep `?retryWrites=true&w=majority` (connection options)

---

## ⚙️ Configuring the Project

### Step 1: Update Environment Variables

**Create or edit `.env.local` in project root:**

```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://vipcontentai_user:YourPassword123@cluster0.xxxxx.mongodb.net/vipcontentai?retryWrites=true&w=majority
MONGODB_DB_NAME=vipcontentai

# Optional: If you want to specify database name separately
# (Database name is already in URI above, but this is a fallback)
```

### Step 2: Environment File Examples

**Development (`.env.local`):**
```bash
MONGODB_URI=mongodb+srv://vipcontentai_user:YourPassword123@cluster0.xxxxx.mongodb.net/vipcontentai?retryWrites=true&w=majority
MONGODB_DB_NAME=vipcontentai
```

**Production (`.env.production`):**
```bash
MONGODB_URI=mongodb+srv://vipcontentai_prod:SecurePassword456@cluster0.xxxxx.mongodb.net/vipcontentai?retryWrites=true&w=majority
MONGODB_DB_NAME=vipcontentai
```

### Step 3: Restart Application

After updating environment variables:

```bash
# Stop the application (Ctrl+C)
# Then restart
npm run dev
```

---

## ✅ Testing Connection

### Method 1: Using Project Script

```bash
# Test MongoDB connection
npm run db:test
```

This will:
- ✅ Check if `MONGODB_URI` is set
- ✅ Validate connection string format
- ✅ Test connection to MongoDB Atlas
- ✅ Verify database and collections

### Method 2: Using MongoDB Shell

```bash
# Install MongoDB Shell (if not installed)
# macOS: brew install mongosh
# Windows: Download from https://www.mongodb.com/try/download/shell

# Test connection
mongosh "mongodb+srv://vipcontentai_user:YourPassword123@cluster0.xxxxx.mongodb.net/vipcontentai"
```

### Method 3: Using MongoDB Compass

1. **Download MongoDB Compass:**
   - https://www.mongodb.com/products/compass

2. **Connect:**
   - Open MongoDB Compass
   - Paste connection string
   - Click "Connect"

3. **Verify:**
   - You should see `vipcontentai` database
   - Collections should be visible

---

## 🔍 MongoDB Atlas Queries

### Using MongoDB Atlas Data Explorer

1. **Go to Collections:**
   - Click "Browse Collections" in Atlas dashboard
   - Select `vipcontentai` database
   - Select `generated_content` collection

2. **View Documents:**
   - Click on collection name
   - Documents will be displayed

3. **Filter Documents:**
   - Use filter bar at top
   - Example: `{ "status": "completed" }`

4. **Sort Documents:**
   - Click "Sort" button
   - Add: `createdAt` → `-1` (descending)

### Using MongoDB Shell (mongosh)

Connect to Atlas:

```bash
mongosh "mongodb+srv://vipcontentai_user:YourPassword123@cluster0.xxxxx.mongodb.net/vipcontentai"
```

Then run queries:

```javascript
// Switch to database
use vipcontentai

// Check collections
show collections

// Count generated content
db.generated_content.countDocuments({})

// Latest 10 articles
db.generated_content.find({})
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// Find by status
db.generated_content.find({ status: "completed" })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()
```

### Using MongoDB Compass

1. **Connect to Atlas:**
   - Paste connection string
   - Click "Connect"

2. **Navigate:**
   - Select `vipcontentai` database
   - Select `generated_content` collection

3. **Query:**
   - Use filter bar: `{ "status": "completed" }`
   - Use sort: `createdAt` → `-1`
   - Click "Find"

---

## 📊 MongoDB Atlas Features

### 1. Monitoring & Alerts

**View Metrics:**
- Go to "Metrics" tab in Atlas
- View:
  - Connection count
  - Operations per second
  - Storage usage
  - CPU/Memory usage

**Set Up Alerts:**
- Go to "Alerts" in left sidebar
- Create alerts for:
  - High connection count
  - Storage threshold
  - Replication lag

### 2. Backups

**Enable Backups:**
- Go to "Backups" in left sidebar
- Click "Edit Configuration"
- Enable "Cloud Backup"
- Set backup frequency

**Restore from Backup:**
- Go to "Backups" → "Restore"
- Select backup point
- Choose restore destination

### 3. Performance Advisor

**View Recommendations:**
- Go to "Performance Advisor"
- See index recommendations
- Apply suggested indexes

### 4. Database Access

**Manage Users:**
- Go to "Database Access"
- Add/remove users
- Change passwords
- Update permissions

---

## 🔧 Advanced Configuration

### Connection String Options

Add these options to your connection string for better performance:

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai?retryWrites=true&w=majority&serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=45000&maxPoolSize=10&minPoolSize=2
```

**Options Explained:**
- `retryWrites=true` - Retry write operations
- `w=majority` - Write concern (wait for majority)
- `serverSelectionTimeoutMS=30000` - Server selection timeout (30s)
- `connectTimeoutMS=30000` - Connection timeout (30s)
- `socketTimeoutMS=45000` - Socket timeout (45s)
- `maxPoolSize=10` - Maximum connections in pool
- `minPoolSize=2` - Minimum connections in pool

### Using Connection Pooling

The project already uses connection pooling in `lib/mongodb.ts`:

```typescript
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
};
```

---

## 🐛 Troubleshooting

### Issue 1: Connection Timeout

**Error:** `MongoServerError: connection timed out`

**Solutions:**
1. **Check IP Whitelist:**
   - Go to "Network Access"
   - Verify your IP is whitelisted
   - Add current IP if missing

2. **Check Firewall:**
   - Ensure port 27017 is not blocked
   - For Atlas, use SRV connection (port handled automatically)

3. **Increase Timeout:**
   ```bash
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai?serverSelectionTimeoutMS=60000
   ```

### Issue 2: Authentication Failed

**Error:** `MongoServerError: Authentication failed`

**Solutions:**
1. **Verify Credentials:**
   - Check username and password
   - Ensure no extra spaces
   - URL-encode special characters in password

2. **Check User Permissions:**
   - Go to "Database Access"
   - Verify user has "Read and write" permissions

3. **Reset Password:**
   - Go to "Database Access"
   - Click "Edit" on user
   - Change password
   - Update connection string

### Issue 3: Database Not Found

**Error:** `MongoServerError: database not found`

**Solutions:**
1. **Verify Database Name:**
   - Ensure `/vipcontentai` is in connection string
   - Or set `MONGODB_DB_NAME=vipcontentai`

2. **Create Database:**
   - Database is created automatically on first write
   - Or create manually in MongoDB Compass

### Issue 4: SSL/TLS Certificate Error

**Error:** `MongoServerError: SSL certificate problem`

**Solutions:**
1. **Update Node.js:**
   ```bash
   node --version  # Should be 18+ for Atlas
   ```

2. **Check Connection String:**
   - Use `mongodb+srv://` (not `mongodb://`)
   - SRV automatically handles SSL

### Issue 5: Too Many Connections

**Error:** `MongoServerError: too many connections`

**Solutions:**
1. **Reduce Connection Pool:**
   ```typescript
   maxPoolSize: 5,  // Reduce from 10
   ```

2. **Check Connection Leaks:**
   - Ensure connections are closed properly
   - Check for multiple database instances

3. **Upgrade Cluster:**
   - Free tier (M0) has connection limits
   - Upgrade to M2+ for more connections

---

## 🔐 Security Best Practices

### 1. Use Strong Passwords

```bash
# Generate secure password
openssl rand -base64 32
```

### 2. Restrict IP Access

**Development:**
- Add only your development IPs
- Use `0.0.0.0/0` only for testing

**Production:**
- Add only production server IPs
- Never use `0.0.0.0/0` in production

### 3. Use Separate Users

**Create Different Users:**
- `vipcontentai_dev` - Development
- `vipcontentai_prod` - Production
- `vipcontentai_readonly` - Read-only access

### 4. Enable Encryption

**Atlas Encryption:**
- Encryption at rest: Enabled by default
- Encryption in transit: Enabled by default (TLS/SSL)

### 5. Regular Backups

- Enable automatic backups
- Test restore procedures
- Keep multiple backup copies

---

## 📈 Monitoring Queries in Atlas

### View Active Connections

1. Go to "Metrics" → "Real-Time"
2. View "Connections" graph
3. Monitor connection count

### View Query Performance

1. Go to "Performance Advisor"
2. View slow queries
3. See index recommendations

### View Database Size

1. Go to "Metrics" → "Storage"
2. View database size
3. Monitor growth trends

---

## 🎯 Quick Reference

### Connection String Format

```
mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]?[options]
```

### Example Connection Strings

**Basic:**
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/vipcontentai
```

**With Options:**
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/vipcontentai?retryWrites=true&w=majority&serverSelectionTimeoutMS=30000
```

### Common Atlas URLs

- **Dashboard:** https://cloud.mongodb.com
- **Documentation:** https://docs.atlas.mongodb.com
- **Support:** https://support.mongodb.com

---

## ✅ Verification Checklist

After setup, verify:

- [ ] MongoDB Atlas account created
- [ ] Cluster created and running
- [ ] Database user created with read/write permissions
- [ ] IP address whitelisted
- [ ] Connection string obtained and updated
- [ ] `.env.local` file updated with connection string
- [ ] Connection test successful (`npm run db:test`)
- [ ] Can see database in MongoDB Compass
- [ ] Can query collections in Atlas Data Explorer

---

## 🚀 Next Steps

1. **Run Database Setup:**
   ```bash
   npm run db:setup
   ```

2. **Verify Collections:**
   - Check collections in Atlas
   - Verify indexes are created

3. **Test Application:**
   - Start Next.js: `npm run dev`
   - Create a test user
   - Generate test content
   - Verify data in Atlas

4. **Set Up Monitoring:**
   - Configure alerts
   - Set up backups
   - Monitor performance

---

## 📚 Additional Resources

- **MongoDB Atlas Documentation:** https://docs.atlas.mongodb.com
- **Connection String Guide:** See `MONGODB_CONNECTION_STRING_GUIDE.md`
- **Troubleshooting Guide:** See `MONGODB_TROUBLESHOOTING.md`
- **MongoDB Queries:** See `MONGODB_QUERIES.md`

---

**Your MongoDB Atlas setup is complete! 🎉**

You can now use Atlas to store and retrieve generated articles. All queries from `MONGODB_QUERIES.md` work with Atlas as well.

