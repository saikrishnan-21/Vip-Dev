# VIPContentAI Database Setup Guide

This directory contains scripts for initializing and managing the MongoDB database for VIPContentAI.

## Database Configuration

**Connection Details:**
- **Server**: 3.105.105.52:27017
- **Database**: vipcontentai
- **User**: admin
- **Connection String**:
  ```
  mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai
  ```

## Setup Steps

### 1. Install Dependencies

```bash
# Already included in main package.json
pnpm install
```

### 2. Configure Environment

Create `.env.local` in project root:

```env
MONGODB_URI=mongodb://admin:VipplayPass123@3.105.105.52:27017
MONGODB_DB_NAME=vipcontentai
```

### 3. Run Migration (Create Collections & Indexes)

This script creates all 12 collections with optimized indexes:

```bash
pnpm run db:migrate
```

**What it does:**
- Creates all MongoDB collections if they don't exist
- Creates single-field indexes (email, userId, status, etc.)
- Creates compound indexes for common queries
- Creates full-text search indexes on content
- Creates vector search index for embeddings
- Validates connection and reports status

**Collections Created:**
1. `users` - User accounts and authentication
2. `sources` - Knowledge base sources (RSS, websites, topics, trends)
3. `articles` - Captured articles with embeddings
4. `generated_content` - AI-generated content
5. `media` - Media library (images/videos)
6. `generation_jobs` - Background job tracking
7. `model_groups` - AI model routing groups
8. `ai_configurations` - AI provider settings
9. `export_jobs` - Export job tracking
10. `notification_settings` - User notification preferences
11. `notifications` - Notification history
12. `content_versions` - Version control for content edits

### 4. Seed Database (Optional)

This script populates the database with initial data:

```bash
pnpm run db:seed
```

**What it creates:**

**Users:**
- Superadmin: `admin@vipcontentai.com` / `Admin@123`
- Demo User: `demo@vipcontentai.com` / `Demo@123`

**AI Configurations:**
- Default Ollama configuration (http://44.197.16.15:11434)
- Default model: gpt-oss
- Quality model: llama3.1
- Embedding model: nomic-embed-text

**Model Groups:**
- Fast Generation (gpt-oss, llama3.1:8b, mistral:7b)
- High Quality (llama3.1, llama3.1:70b)
- Embeddings (nomic-embed-text)

**Sample Data (Optional):**
- 5 example RSS sources
- 3 example topics
- 10 sample articles
- 5 sample generated content

### 5. Verify Setup

```bash
# Test connection
mongosh "mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai"

# List collections
show collections

# Count documents
db.users.countDocuments()
db.sources.countDocuments()
```

## MongoDB Server Configuration

### Vector Search Setup

The migration script creates a vector search index on the `articles` collection for semantic similarity search.

**Index Configuration:**
```json
{
  "name": "article_embeddings",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      }
    ]
  }
}
```

**Manual Setup (if needed):**
1. Go to MongoDB Atlas Dashboard
2. Select your cluster → Browse Collections
3. Select `vipcontentai` database → `articles` collection
4. Click "Search Indexes" tab
5. Click "Create Search Index"
6. Choose "JSON Editor"
7. Paste the configuration above
8. Click "Create"

### Connection Pooling

Recommended connection options:

```javascript
const options = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4
};
```

### Security Best Practices

1. **Network Access**: Whitelist your server IP in MongoDB Atlas
2. **Database User**: Create separate users for dev/staging/prod
3. **Password Rotation**: Rotate database password quarterly
4. **Backup**: Enable automatic backups in MongoDB Atlas
5. **Monitoring**: Set up alerts for connection failures

## Database Schema Overview

### Core Collections

#### 1. users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  firstName: String,
  lastName: String,
  role: String, // user, editor, admin, superadmin
  emailVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email: 1` (unique)
- `role: 1`
- `createdAt: -1`

#### 2. sources
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String, // rss, website, topic, trend
  name: String,
  url: String,
  syncFrequency: String,
  lastSync: Date,
  nextSync: Date,
  status: String,
  articleCount: Number,
  createdAt: Date
}
```

**Indexes:**
- `userId: 1, type: 1`
- `status: 1`
- `nextSync: 1`

#### 3. articles
```javascript
{
  _id: ObjectId,
  sourceId: ObjectId,
  userId: ObjectId,
  title: String,
  content: String,
  url: String,
  embedding: Array[768], // Vector embedding
  keywords: Array,
  publishedAt: Date,
  createdAt: Date
}
```

**Indexes:**
- `userId: 1, createdAt: -1`
- `sourceId: 1`
- `title: 'text', content: 'text', keywords: 'text'` (full-text)
- `embedding: 'vectorSearch'` (vector index in Atlas)

#### 4. generated_content
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  jobId: String (unique),
  title: String,
  content: String,
  mode: String, // topic, keywords, trends, spin
  status: String, // pending, approved, rejected, published
  seo: Object,
  readability: Object,
  version: Number,
  createdAt: Date
}
```

**Indexes:**
- `userId: 1, status: 1, createdAt: -1`
- `jobId: 1` (unique)
- `status: 1`

#### 5. media
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String, // image, video
  filename: String,
  url: String,
  tags: Array,
  generatedByAI: Boolean,
  usageCount: Number,
  createdAt: Date
}
```

**Indexes:**
- `userId: 1, createdAt: -1`
- `type: 1`
- `tags: 1`

#### 6. generation_jobs
```javascript
{
  _id: ObjectId,
  jobId: String (unique),
  userId: ObjectId,
  status: String, // queued, processing, completed, failed
  progress: Object,
  result: Object,
  createdAt: Date,
  completedAt: Date
}
```

**Indexes:**
- `jobId: 1` (unique)
- `userId: 1, createdAt: -1`
- `status: 1`

#### 7. model_groups
```javascript
{
  _id: ObjectId,
  name: String (unique),
  description: String,
  models: Array,
  routingStrategy: String,
  isActive: Boolean,
  stats: Object,
  createdAt: Date
}
```

**Indexes:**
- `name: 1` (unique)
- `isActive: 1`

#### 8. ai_configurations
```javascript
{
  _id: ObjectId,
  provider: String, // ollama, openai, etc.
  name: String,
  config: Object,
  isActive: Boolean,
  isDefault: Boolean,
  createdAt: Date
}
```

**Indexes:**
- `provider: 1`
- `isActive: 1, isDefault: 1`

## Common Operations

### Query Examples

**Find user by email:**
```javascript
db.users.findOne({ email: "admin@vipcontentai.com" });
```

**Get user's generated content:**
```javascript
db.generated_content.find({
  userId: ObjectId("..."),
  status: "pending"
}).sort({ createdAt: -1 }).limit(10);
```

**Vector similarity search:**
```javascript
db.articles.aggregate([
  {
    $vectorSearch: {
      index: "article_embeddings",
      queryVector: [...], // 768-dimensional array
      path: "embedding",
      numCandidates: 100,
      limit: 10
    }
  }
]);
```

**Full-text search:**
```javascript
db.articles.find({
  $text: { $search: "fantasy football draft strategy" }
}).sort({ score: { $meta: "textScore" } });
```

### Backup & Restore

**Backup:**
```bash
mongodump --uri="mongodb+srv://andy_db_user:F5QOW2nb8Xujl5jP@andy-cluster-personal.5zbgd4r.mongodb.net/vipcontentai" --out=./backup
```

**Restore:**
```bash
mongorestore --uri="mongodb+srv://andy_db_user:F5QOW2nb8Xujl5jP@andy-cluster-personal.5zbgd4r.mongodb.net/vipcontentai" ./backup/vipcontentai
```

### Data Cleanup

**Delete old jobs:**
```javascript
db.generation_jobs.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
});
```

**Archive old content:**
```javascript
db.generated_content.updateMany(
  {
    status: "approved",
    createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
  },
  { $set: { archived: true } }
);
```

## Monitoring

### Performance Metrics

Monitor these in MongoDB Atlas:
- Connection count
- Query execution time
- Index usage
- Disk IOPS
- Network throughput

### Alerts

Set up alerts for:
- CPU utilization > 80%
- Disk usage > 80%
- Slow queries > 1000ms
- Connection failures
- Replication lag

## Troubleshooting

### Connection Issues

**Error: `MongoServerError: bad auth`**
- Verify username and password
- Check database user permissions in Atlas
- Ensure database name is correct

**Error: `MongooseError: buffering timed out`**
- Check network connectivity
- Verify IP is whitelisted in Atlas
- Check firewall settings

**Error: `ECONNREFUSED`**
- Verify connection string format
- Check if using correct port (27017 for local, SRV for Atlas)
- Ensure MongoDB service is running

### Performance Issues

**Slow queries:**
- Check `db.collection.explain()` for query plan
- Verify indexes are being used
- Consider adding compound indexes

**High memory usage:**
- Review index size: `db.collection.totalIndexSize()`
- Check for large documents
- Consider archiving old data

**Connection pool exhausted:**
- Increase `maxPoolSize` in connection options
- Check for connection leaks (unclosed cursors)
- Monitor concurrent connections

## Support

For database issues:
1. Check MongoDB Atlas dashboard for alerts
2. Review CloudWatch logs (if using AWS)
3. Run `pnpm run db:migrate` to verify indexes
4. Consult MongoDB documentation: https://docs.mongodb.com/

---

**VIPContentAI Database** | MongoDB Atlas | Production-Ready Setup
