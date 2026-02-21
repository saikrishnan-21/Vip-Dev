# Generated Content Storage Guide

## 📍 Where Generated Articles Are Stored

**Generated articles are stored in the `generated_content` collection in MongoDB**, NOT in the `articles` collection.

### Important Distinction

| Collection | Purpose | Content Type |
|------------|---------|--------------|
| **`articles`** | Captured/scraped articles | Articles from RSS feeds, websites, topics, trends |
| **`generated_content`** | AI-generated articles | Content created by AI (topic, keywords, trends, spin) |

---

## 🗄️ Database Details

### Collection Name
```
generated_content
```

### Database
```
vipcontentai
```
(Configurable via `MONGODB_DB_NAME` environment variable)

### Connection
Configured via `MONGODB_URI` in `.env.local`

---

## 📋 Generated Content Schema

```typescript
{
  _id: ObjectId,                    // MongoDB document ID
  userId: ObjectId,                 // User who generated the content
  jobId: string,                    // Reference to generation_jobs collection
  title: string,                    // Article title
  content: string,                  // Full generated article content
  summary?: string,                 // Article summary
  status: string,                   // 'completed', 'draft', 'review', 'approved', 'published', etc.
  mode: string,                     // 'topic', 'keywords', 'trends', 'spin'
  wordCount: number,                // Word count of the article
  tone: string,                     // Tone used (e.g., 'Professional')
  keywords: string[],               // Keywords used for generation
  imagesGenerated: number,         // Number of images generated
  images: Array,                    // Array of image metadata
  createdAt: Date,                 // When content was generated
  updatedAt: Date,                  // Last update timestamp
  
  // Additional fields (may vary):
  version?: number,                 // Content version number
  sourceType?: string,              // Type of source
  seoScore?: number,               // SEO score
  readabilityScore?: number,        // Readability score
  metaDescription?: string,        // Meta description
  publishedAt?: Date,              // Publication date
  scheduledFor?: Date,             // Scheduled publication
  rejectionReason?: string,        // Rejection reason (if rejected)
  rejectedAt?: Date,               // Rejection timestamp
  rejectedBy?: ObjectId,            // Who rejected it
  previousVersionId?: ObjectId,     // Previous version reference
  createdBy: ObjectId,             // Creator user ID
  lastEditedBy: ObjectId           // Last editor user ID
}
```

---

## 🔍 How to Retrieve Generated Content

### 1. List All Generated Content

**API Endpoint:**
```
GET /api/content
```

**Query Parameters:**
- `status` - Filter by status (completed, draft, review, approved, published, etc.)
- `sourceType` - Filter by source type (topic, keywords, trends, spin)
- `limit` - Number of items per page (default: 20, max: 100)
- `offset` - Skip number of items (for pagination)
- `page` - Page number (alternative to offset)
- `search` - Search in title and content

**Example Request:**
```bash
GET /api/content?status=completed&limit=20&page=1
Authorization: Bearer <your-token>
```

**Example Response:**
```json
{
  "success": true,
  "content": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "title": "Fantasy Football Strategies",
      "content": "Full article content here...",
      "status": "completed",
      "mode": "topic",
      "wordCount": 1500,
      "tone": "Professional",
      "keywords": ["fantasy", "football"],
      "imagesGenerated": 0,
      "images": [],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 2. Get Single Generated Content

**API Endpoint:**
```
GET /api/content/[contentId]
```

**Example Request:**
```bash
GET /api/content/507f1f77bcf86cd799439011
Authorization: Bearer <your-token>
```

**Example Response:**
```json
{
  "content": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Fantasy Football Strategies",
    "content": "Full article content...",
    "status": "completed",
    "wordCount": 1500,
    "seoScore": 85,
    "readabilityScore": 72,
    "imagesGenerated": 0,
    "images": [],
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### 3. Query Directly in MongoDB

**Using MongoDB Compass or CLI:**

```javascript
// Connect to MongoDB
use vipcontentai

// Find all generated content for a user
db.generated_content.find({ 
  userId: ObjectId("507f1f77bcf86cd799439012") 
})

// Find completed content
db.generated_content.find({ 
  status: "completed" 
})

// Find by generation mode
db.generated_content.find({ 
  mode: "topic" 
})

// Find by job ID
db.generated_content.find({ 
  jobId: "507f1f77bcf86cd799439011" 
})

// Count total generated articles
db.generated_content.countDocuments({})

// Find with pagination
db.generated_content.find({})
  .sort({ createdAt: -1 })
  .skip(0)
  .limit(20)
```

---

## 🔄 Where Content is Saved After Generation

### Flow 1: Direct FastAPI Call (Without SQS)

**Location:** `app/api/content/generate/route.ts`

**When:** After FastAPI returns successful response

**Code:**
```typescript
// Line 422-461 in app/api/content/generate/route.ts
if (isCompleted && fastapiData.content) {
  const generatedContent = {
    userId: new ObjectId(user.userId),
    jobId: jobId,
    mode,
    status: 'completed',
    title: contentTitle,
    content: fastapiData.content,
    wordCount: wordCount,
    tone,
    keywords: keywords || [],
    imagesGenerated: 0,
    images: [],
    createdAt: now,
    updatedAt: new Date(),
  };

  await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
}
```

### Flow 2: SQS Worker Processing (With SQS Queue)

**Location:** `lib/services/sqs-worker.ts`

**When:** Worker processes message from SQS queue

**Code:**
```typescript
// Line 186-228 in lib/services/sqs-worker.ts
if (isCompleted && fastapiData.content) {
  const generatedContent = {
    userId: new ObjectId(userId),
    jobId: jobId,
    mode: articlePayload.mode,
    status: 'completed',
    title: contentTitle,
    content: fastapiData.content,
    wordCount: articlePayload.wordCount,
    tone: articlePayload.tone,
    keywords: articlePayload.keywords || [],
    imagesGenerated: 0,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
}
```

### Flow 3: Bulk Generation

**Location:** `app/api/content/bulk-generate/route.ts`

**When:** Multiple articles generated at once

**Code:**
```typescript
// Line 293-319 in app/api/content/bulk-generate/route.ts
const generatedContentCollection = db.collection(Collections.GENERATED_CONTENT);
const contentDocs = [];

for (const result of fastapiData.results || []) {
  if (result.success && result.content) {
    contentDocs.push({
      userId: new ObjectId(user.userId),
      jobId: jobId,
      mode,
      status: 'completed',
      title: result.topic,
      content: result.content,
      wordCount: result.word_count || wordCount,
      tone,
      keywords: keywords || [],
      imagesGenerated: 0,
      images: [],
      createdAt: now,
      updatedAt: new Date(),
    });
  }
}

if (contentDocs.length > 0) {
  await generatedContentCollection.insertMany(contentDocs);
}
```

---

## 🔗 Related Collections

### 1. `generation_jobs`
Tracks the generation job status and metadata.

**Relationship:** `generated_content.jobId` → `generation_jobs._id`

**Query to get job info:**
```javascript
// Get content with job details
db.generated_content.aggregate([
  {
    $lookup: {
      from: "generation_jobs",
      localField: "jobId",
      foreignField: "_id",
      as: "job"
    }
  }
])
```

### 2. `users`
User who generated the content.

**Relationship:** `generated_content.userId` → `users._id`

### 3. `media`
Generated images associated with content.

**Relationship:** `generated_content.images[].mediaId` → `media._id`

---

## 📊 Status Values

Generated content can have these statuses:

| Status | Description |
|--------|-------------|
| `completed` | Generation finished successfully |
| `draft` | Content is in draft state |
| `review` | Awaiting review/approval |
| `approved` | Approved for publishing |
| `published` | Published |
| `rejected` | Rejected during review |
| `archived` | Archived content |

---

## 🔍 Troubleshooting: Why Can't I See Generated Content?

### Issue 1: Content Not Saved

**Check:**
1. Check job status in `generation_jobs` collection
2. Look for errors in console logs
3. Verify FastAPI returned `success: true` and `content` field

**Query:**
```javascript
// Check if job completed
db.generation_jobs.find({ 
  _id: ObjectId("your-job-id") 
})

// Check if content was saved
db.generated_content.find({ 
  jobId: "your-job-id" 
})
```

### Issue 2: Wrong Collection

**Problem:** Looking in `articles` collection instead of `generated_content`

**Solution:** Use `generated_content` collection for AI-generated content

### Issue 3: User ID Mismatch

**Problem:** Content exists but filtered by wrong userId

**Solution:** Verify userId matches:
```javascript
// Check your user ID
db.users.find({ email: "your-email@example.com" })

// Find content for your user
db.generated_content.find({ 
  userId: ObjectId("your-user-id") 
})
```

### Issue 4: Status Filter

**Problem:** Content exists but has different status

**Solution:** Check all statuses:
```javascript
// Find all content regardless of status
db.generated_content.find({ 
  userId: ObjectId("your-user-id") 
})

// Check status distribution
db.generated_content.aggregate([
  { $match: { userId: ObjectId("your-user-id") } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

---

## 💻 Code Examples

### Access Generated Content in Code

```typescript
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Get database
const db = await getDatabase();
const collection = db.collection(Collections.GENERATED_CONTENT);

// Find all generated content for a user
const content = await collection.find({
  userId: new ObjectId(userId)
}).toArray();

// Find by job ID
const contentByJob = await collection.findOne({
  jobId: jobId
});

// Find completed content
const completedContent = await collection.find({
  userId: new ObjectId(userId),
  status: 'completed'
}).sort({ createdAt: -1 }).toArray();
```

### Using API Endpoints

```typescript
// Fetch all generated content
const response = await fetch('/api/content?status=completed', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(data.content); // Array of generated articles

// Fetch single content
const singleResponse = await fetch(`/api/content/${contentId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const singleData = await singleResponse.json();
console.log(singleData.content); // Single article
```

---

## 📝 Summary

✅ **Collection:** `generated_content`  
✅ **Database:** `vipcontentai`  
✅ **API Endpoint:** `GET /api/content`  
✅ **Single Item:** `GET /api/content/[contentId]`  
✅ **Status:** Usually `completed` after successful generation  
✅ **Key Field:** `jobId` links to `generation_jobs` collection  

**Remember:** Generated articles go to `generated_content`, NOT `articles` collection!

