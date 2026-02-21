# MongoDB Connection String Guide

## Where to Get Your MongoDB Connection String

The MongoDB connection string (`MONGODB_URI`) depends on where your MongoDB database is hosted. Here are the common scenarios:

---

## 1. Local MongoDB (Development)

If MongoDB is running on your local machine or the same server:

### Format:
```env
MONGODB_URI=mongodb://username:password@localhost:27017/vipcontentai
```

### Without Authentication (Default):
```env
MONGODB_URI=mongodb://localhost:27017/vipcontentai
```

### How to Get It:

1. **Check if MongoDB is running locally:**
   ```bash
   # Linux/Mac
   sudo systemctl status mongod
   # or
   brew services list | grep mongodb
   
   # Windows
   # Check Services app for MongoDB
   ```

2. **Default connection (no auth):**
   - Host: `localhost` or `127.0.0.1`
   - Port: `27017` (default MongoDB port)
   - Database: `vipcontentai`
   - **Connection String:** `mongodb://localhost:27017/vipcontentai`

3. **With authentication:**
   - If you created a user, use: `mongodb://username:password@localhost:27017/vipcontentai`
   - To create a user:
     ```bash
     mongosh
     use admin
     db.createUser({
       user: "admin",
       pwd: "yourpassword",
       roles: ["root"]
     })
     ```

---

## 2. Remote MongoDB Server (EC2, VPS, etc.)

If MongoDB is running on a remote server:

### Format:
```env
MONGODB_URI=mongodb://username:password@hostname-or-ip:27017/vipcontentai
```

### How to Get It:

1. **Find your MongoDB server details:**
   - **Host/IP:** The IP address or hostname of your MongoDB server
   - **Port:** Usually `27017` (default)
   - **Username/Password:** Database user credentials
   - **Database:** `vipcontentai`

2. **Example from your project:**
   ```env
   MONGODB_URI=mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai
   ```
   - Host: `3.105.105.52` (your MongoDB server IP)
   - Username: `admin`
   - Password: `VipplayPass123`
   - Port: `27017`
   - Database: `vipcontentai`

3. **Test the connection:**
   ```bash
   mongosh "mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai"
   ```

---

## 3. MongoDB Atlas (Cloud)

If you're using MongoDB Atlas (cloud-hosted):

### Format:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vipcontentai
```

### How to Get It:

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com
   - Sign in to your account

2. **Get Connection String:**
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Select **"Node.js"** and version
   - Copy the connection string
   - It will look like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

3. **Update the connection string:**
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add database name: `/vipcontentai` at the end
   - **Final format:**
     ```env
     MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/vipcontentai?retryWrites=true&w=majority
     ```

4. **Important Atlas Settings:**
   - **Network Access:** Whitelist your server IP address
   - **Database User:** Create a user with read/write permissions
   - **IP Whitelist:** Add `0.0.0.0/0` for testing (not recommended for production)

---

## 4. Docker MongoDB

If MongoDB is running in Docker:

### Format:
```env
# From host machine
MONGODB_URI=mongodb://username:password@localhost:27017/vipcontentai

# From another container
MONGODB_URI=mongodb://username:password@mongodb-container-name:27017/vipcontentai
```

### How to Get It:

1. **Check Docker container:**
   ```bash
   docker ps | grep mongo
   ```

2. **Check port mapping:**
   ```bash
   docker port <container-name>
   # Usually: 27017:27017
   ```

3. **Connection string:**
   - If port is mapped: `mongodb://localhost:27017/vipcontentai`
   - If using Docker network: `mongodb://mongodb:27017/vipcontentai` (container name)

---

## Connection String Format Breakdown

```
mongodb://[username:password@]host[:port][/database][?options]
```

### Components:

- **Protocol:** `mongodb://` or `mongodb+srv://` (for Atlas)
- **Username:** Database user (optional if no auth)
- **Password:** Database password (optional if no auth)
- **Host:** IP address or hostname
- **Port:** MongoDB port (default: `27017`)
- **Database:** Database name (`vipcontentai`)
- **Options:** Query parameters (optional)

### Examples:

```env
# Local, no auth
MONGODB_URI=mongodb://localhost:27017/vipcontentai

# Local, with auth
MONGODB_URI=mongodb://admin:password@localhost:27017/vipcontentai

# Remote server
MONGODB_URI=mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai

# With connection options
MONGODB_URI=mongodb://admin:password@host:27017/vipcontentai?serverSelectionTimeoutMS=30000&connectTimeoutMS=30000
```

---

## Where to Put the Connection String

### For Staging Environment:

1. **Edit `.env.staging` file:**
   ```bash
   # In project root
   nano .env.staging
   ```

2. **Update the MONGODB_URI line:**
   ```env
   # Replace this:
   MONGODB_URI=mongodb://localhost:27017/vipcontentai
   
   # With your actual connection string:
   MONGODB_URI=mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai
   ```

3. **Or use the script:**
   ```bash
   bash scripts/create-env-staging.sh
   # Then edit .env.staging with your actual values
   ```

### For Development:

1. **Create `.env.local` file:**
   ```bash
   cp .env.staging .env.local
   # Then edit .env.local with your local MongoDB connection
   ```

---

## Finding Your Current MongoDB Connection

### If You Already Have MongoDB Running:

1. **Check existing environment files:**
   ```bash
   # Look for existing .env files
   cat .env.local 2>/dev/null
   cat .env.production 2>/dev/null
   grep MONGODB_URI .env* 2>/dev/null
   ```

2. **Check MongoDB server directly:**
   ```bash
   # SSH into MongoDB server
   ssh user@mongodb-server
   
   # Check MongoDB config
   cat /etc/mongod.conf | grep -A 5 net
   # Shows: port, bindIp, etc.
   ```

3. **Check Docker Compose (if using):**
   ```bash
   cat scripts/deploy/docker-compose.yml | grep -A 5 mongodb
   ```

4. **Check application logs:**
   ```bash
   # Look for connection attempts in logs
   grep -i mongodb logs/*.log
   ```

---

## Common Connection Strings in This Project

Based on your codebase, here are examples found:

### Remote Server (Production):
```env
MONGODB_URI=mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai
```

### MongoDB Atlas (if configured):
```env
MONGODB_URI=mongodb+srv://andy_db_user:F5QOW2nb8Xujl5jP@andy-cluster-personal.5zbgd4r.mongodb.net/vipcontentai
```

### Local Development:
```env
MONGODB_URI=mongodb://localhost:27017/vipcontentai
```

---

## Testing Your Connection String

Before using it in your application:

```bash
# Test with mongosh
mongosh "mongodb://username:password@host:port/vipcontentai"

# Or test with the diagnostic script
pnpm db:test
```

---

## Security Notes

⚠️ **Important:**

1. **Never commit passwords to git:**
   - Use `.env.local` (gitignored) for development
   - Use GitHub Secrets for CI/CD
   - Use `.env.staging` only if it's safe to commit (staging only)

2. **Use strong passwords:**
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

3. **Restrict network access:**
   - Whitelist only necessary IPs in MongoDB Atlas
   - Use firewall rules for self-hosted MongoDB

---

## Quick Reference

| Scenario | Connection String Format |
|----------|-------------------------|
| **Local, no auth** | `mongodb://localhost:27017/vipcontentai` |
| **Local, with auth** | `mongodb://user:pass@localhost:27017/vipcontentai` |
| **Remote server** | `mongodb://user:pass@ip:27017/vipcontentai` |
| **MongoDB Atlas** | `mongodb+srv://user:pass@cluster.mongodb.net/vipcontentai` |
| **Docker** | `mongodb://user:pass@container-name:27017/vipcontentai` |

---

## Still Need Help?

1. **Run diagnostic:**
   ```bash
   pnpm db:test
   ```

2. **Check MongoDB status:**
   ```bash
   # Local
   sudo systemctl status mongod
   
   # Remote
   ssh user@server "sudo systemctl status mongod"
   ```

3. **Test connection manually:**
   ```bash
   mongosh "your-connection-string-here"
   ```

4. **Check project documentation:**
   - `MONGODB_TROUBLESHOOTING.md` - Detailed troubleshooting
   - `ENV_MAINTENANCE.md` - Environment variable management

