# MongoDB Queries for Generated Content

Quick reference guide for querying generated articles in MongoDB.

## 🔍 Basic Queries

### 1. Check if Generated Content Exists

```javascript
// Check total count of generated articles
db.generated_content.countDocuments({})

// Check if any content exists
db.generated_content.findOne({})
```

### 2. Find Latest Generated Articles

```javascript
// Latest 10 articles (sorted by creation date, newest first)
db.generated_content.find({})
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// Latest 5 articles with only essential fields
db.generated_content.find({}, {
  title: 1,
  status: 1,
  mode: 1,
  wordCount: 1,
  createdAt: 1,
  userId: 1
})
  .sort({ createdAt: -1 })
  .limit(5)
  .pretty()
```

### 3. Find Latest Articles for Specific User

```javascript
// Replace with your actual user ID
const userId = ObjectId("507f1f77bcf86cd799439012")

// Latest articles for user
db.generated_content.find({ userId: userId })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// Count articles for user
db.generated_content.countDocuments({ userId: userId })
```

### 4. Find Articles by Status

```javascript
// Latest completed articles
db.generated_content.find({ status: "completed" })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// Latest draft articles
db.generated_content.find({ status: "draft" })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// All statuses with counts
db.generated_content.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
      latest: { $max: "$createdAt" }
    }
  },
  { $sort: { count: -1 } }
])
```

### 5. Find Articles by Generation Mode

```javascript
// Latest topic-based articles
db.generated_content.find({ mode: "topic" })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// Latest keyword-based articles
db.generated_content.find({ mode: "keywords" })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// Latest trend-based articles
db.generated_content.find({ mode: "trends" })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// Latest spin articles
db.generated_content.find({ mode: "spin" })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()
```

---

## 🔎 Advanced Queries

### 6. Find Articles by Job ID

```javascript
// Find content by job ID (string)
db.generated_content.find({ jobId: "507f1f77bcf86cd799439011" })
  .pretty()

// Find all content for multiple jobs
db.generated_content.find({
  jobId: { $in: ["job-id-1", "job-id-2", "job-id-3"] }
})
  .pretty()
```

### 7. Find Articles Created Today

```javascript
// Articles created today
const today = new Date()
today.setHours(0, 0, 0, 0)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

db.generated_content.find({
  createdAt: {
    $gte: today,
    $lt: tomorrow
  }
})
  .sort({ createdAt: -1 })
  .pretty()

// Count articles created today
db.generated_content.countDocuments({
  createdAt: {
    $gte: today,
    $lt: tomorrow
  }
})
```

### 8. Find Articles Created in Last 24 Hours

```javascript
// Articles from last 24 hours
const last24Hours = new Date()
last24Hours.setHours(last24Hours.getHours() - 24)

db.generated_content.find({
  createdAt: { $gte: last24Hours }
})
  .sort({ createdAt: -1 })
  .pretty()
```

### 9. Find Articles by Date Range

```javascript
// Articles between two dates
const startDate = new Date("2025-01-01")
const endDate = new Date("2025-01-31")

db.generated_content.find({
  createdAt: {
    $gte: startDate,
    $lte: endDate
  }
})
  .sort({ createdAt: -1 })
  .pretty()
```

### 10. Search Articles by Title or Content

```javascript
// Search in title (case-insensitive)
db.generated_content.find({
  title: { $regex: "fantasy", $options: "i" }
})
  .sort({ createdAt: -1 })
  .pretty()

// Search in content (case-insensitive)
db.generated_content.find({
  content: { $regex: "football", $options: "i" }
})
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// Search in both title and content
db.generated_content.find({
  $or: [
    { title: { $regex: "fantasy", $options: "i" } },
    { content: { $regex: "fantasy", $options: "i" } }
  ]
})
  .sort({ createdAt: -1 })
  .pretty()
```

### 11. Find Articles by Keywords

```javascript
// Articles containing specific keyword
db.generated_content.find({
  keywords: { $in: ["fantasy", "football"] }
})
  .sort({ createdAt: -1 })
  .pretty()

// Articles with all specified keywords
db.generated_content.find({
  keywords: { $all: ["fantasy", "football", "strategy"] }
})
  .sort({ createdAt: -1 })
  .pretty()
```

### 12. Find Articles with Images

```javascript
// Articles with generated images
db.generated_content.find({
  imagesGenerated: { $gt: 0 }
})
  .sort({ createdAt: -1 })
  .pretty()

// Articles with specific number of images
db.generated_content.find({
  imagesGenerated: 3
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## 📊 Analytics Queries

### 13. Statistics and Aggregations

```javascript
// Total articles by mode
db.generated_content.aggregate([
  {
    $group: {
      _id: "$mode",
      count: { $sum: 1 },
      avgWordCount: { $avg: "$wordCount" }
    }
  },
  { $sort: { count: -1 } }
])

// Articles by status
db.generated_content.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])

// Daily article count (last 7 days)
db.generated_content.aggregate([
  {
    $match: {
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt"
        }
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: -1 } }
])

// Average word count by mode
db.generated_content.aggregate([
  {
    $group: {
      _id: "$mode",
      avgWordCount: { $avg: "$wordCount" },
      minWordCount: { $min: "$wordCount" },
      maxWordCount: { $max: "$wordCount" },
      count: { $sum: 1 }
    }
  }
])
```

### 14. User Statistics

```javascript
// Replace with your user ID
const userId = ObjectId("507f1f77bcf86cd799439012")

// User's article statistics
db.generated_content.aggregate([
  { $match: { userId: userId } },
  {
    $group: {
      _id: null,
      totalArticles: { $sum: 1 },
      byStatus: {
        $push: "$status"
      },
      byMode: {
        $push: "$mode"
      },
      avgWordCount: { $avg: "$wordCount" },
      totalWordCount: { $sum: "$wordCount" }
    }
  }
])

// User's articles by mode
db.generated_content.aggregate([
  { $match: { userId: userId } },
  {
    $group: {
      _id: "$mode",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])
```

---

## 🔗 Join Queries (Related Data)

### 15. Get Content with Job Information

```javascript
// Join with generation_jobs collection
db.generated_content.aggregate([
  {
    $lookup: {
      from: "generation_jobs",
      localField: "jobId",
      foreignField: "_id",
      as: "job"
    }
  },
  { $unwind: "$job" },
  {
    $project: {
      title: 1,
      status: 1,
      mode: 1,
      wordCount: 1,
      createdAt: 1,
      "job.status": 1,
      "job.message": 1,
      "job.createdAt": 1
    }
  },
  { $sort: { createdAt: -1 } },
  { $limit: 10 }
])
```

### 16. Get Content with User Information

```javascript
// Join with users collection
db.generated_content.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  { $unwind: "$user" },
  {
    $project: {
      title: 1,
      status: 1,
      mode: 1,
      createdAt: 1,
      "user.email": 1,
      "user.firstName": 1,
      "user.lastName": 1
    }
  },
  { $sort: { createdAt: -1 } },
  { $limit: 10 }
])
```

---

## 🧪 Verification Queries

### 17. Verify Content Structure

```javascript
// Check one document structure
db.generated_content.findOne({})

// Check if required fields exist
db.generated_content.find({
  $or: [
    { title: { $exists: false } },
    { content: { $exists: false } },
    { userId: { $exists: false } },
    { createdAt: { $exists: false } }
  ]
})
  .count()

// Find documents missing jobId
db.generated_content.find({
  jobId: { $exists: false }
})
  .count()
```

### 18. Check for Duplicates

```javascript
// Find duplicate jobIds (should be unique per content)
db.generated_content.aggregate([
  {
    $group: {
      _id: "$jobId",
      count: { $sum: 1 },
      ids: { $push: "$_id" }
    }
  },
  { $match: { count: { $gt: 1 } } }
])
```

### 19. Find Empty or Invalid Content

```javascript
// Articles with empty content
db.generated_content.find({
  $or: [
    { content: { $exists: false } },
    { content: "" },
    { content: null }
  ]
})
  .pretty()

// Articles with missing title
db.generated_content.find({
  $or: [
    { title: { $exists: false } },
    { title: "" },
    { title: null }
  ]
})
  .pretty()
```

---

## 🎯 Quick Check Queries

### 20. One-Liner Quick Checks

```javascript
// Latest article
db.generated_content.findOne({}, {}, { sort: { createdAt: -1 } })

// Count all articles
db.generated_content.countDocuments({})

// Latest 5 article titles
db.generated_content.find({}, { title: 1, createdAt: 1 })
  .sort({ createdAt: -1 })
  .limit(5)

// Check if specific job has content
db.generated_content.findOne({ jobId: "your-job-id" })

// Latest article for user (replace userId)
db.generated_content.findOne(
  { userId: ObjectId("507f1f77bcf86cd799439012") },
  {},
  { sort: { createdAt: -1 } }
)
```

---

## 📝 MongoDB Compass Queries

If using MongoDB Compass, paste these in the filter bar:

### Filter by Status
```json
{ "status": "completed" }
```

### Filter by Mode
```json
{ "mode": "topic" }
```

### Filter by Date (Last 24 Hours)
```json
{
  "createdAt": {
    "$gte": { "$date": "2025-01-15T00:00:00Z" }
  }
}
```

### Filter by User
```json
{ "userId": { "$oid": "507f1f77bcf86cd799439012" } }
```

### Sort by Latest
In MongoDB Compass:
1. Click "Sort" button
2. Add: `createdAt` → `-1` (descending)

---

## 🔧 Useful Helper Functions

### Create Helper Function to Get Latest Articles

```javascript
// Define function
function getLatestArticles(limit = 10, userId = null) {
  const query = userId ? { userId: ObjectId(userId) } : {}
  return db.generated_content.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
}

// Use it
getLatestArticles(5)
getLatestArticles(10, "507f1f77bcf86cd799439012")
```

### Create Helper Function to Check Job Content

```javascript
// Define function
function checkJobContent(jobId) {
  const content = db.generated_content.findOne({ jobId: jobId })
  const job = db.generation_jobs.findOne({ _id: ObjectId(jobId) })
  
  return {
    job: job,
    content: content,
    exists: content !== null
  }
}

// Use it
checkJobContent("507f1f77bcf86cd799439011")
```

---

## 📋 Complete Verification Checklist

Run these queries to verify everything is working:

```javascript
// 1. Check if collection exists
db.getCollectionNames().includes("generated_content")

// 2. Check total count
db.generated_content.countDocuments({})

// 3. Check latest article
db.generated_content.findOne({}, {}, { sort: { createdAt: -1 } })

// 4. Check articles by status
db.generated_content.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// 5. Check articles by mode
db.generated_content.aggregate([
  { $group: { _id: "$mode", count: { $sum: 1 } } }
])

// 6. Check recent articles (last hour)
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
db.generated_content.countDocuments({
  createdAt: { $gte: oneHourAgo }
})

// 7. Verify data structure
db.generated_content.findOne({}, {
  title: 1,
  content: 1,
  status: 1,
  mode: 1,
  jobId: 1,
  userId: 1,
  createdAt: 1
})
```

---

## 🚀 Quick Start: Copy-Paste These

### Most Common Queries

```javascript
// 1. Latest 10 articles
db.generated_content.find({})
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// 2. Latest completed articles
db.generated_content.find({ status: "completed" })
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()

// 3. Count all articles
db.generated_content.countDocuments({})

// 4. Latest article
db.generated_content.findOne({}, {}, { sort: { createdAt: -1 } })

// 5. Articles from last 24 hours
const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
db.generated_content.find({ createdAt: { $gte: last24h } })
  .sort({ createdAt: -1 })
  .pretty()
```

---

## 💡 Tips

1. **Use `.pretty()`** for readable output
2. **Use `.limit()`** to avoid loading too much data
3. **Use projection** `{ field: 1 }` to select only needed fields
4. **Use indexes** on `createdAt`, `userId`, `status` for faster queries
5. **Use aggregation** for complex analytics

---

## 🔍 Finding Your User ID

If you need to find your user ID first:

```javascript
// Find user by email
db.users.findOne({ email: "your-email@example.com" })

// Get all users
db.users.find({}, { email: 1, _id: 1 }).pretty()
```

Then use the `_id` in your queries!

