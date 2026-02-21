# How to Find "Football in kerala" Article in MongoDB

Based on the UI screenshot showing the article "Football in kerala", here's how to locate and retrieve it from the database.

## 📍 Where the Article is Stored

**Collection:** `generated_content`  
**Database:** `vipcontentai`  
**Status:** `completed` (as shown in UI)  
**Keywords:** `["Football"]`  
**Word Count:** `1000` (as shown in UI)

---

## 🔍 MongoDB Queries to Find the Article

### 1. Find by Title (Exact Match)

```javascript
// ⚠️ If this returns null, try the flexible queries below

// Exact title match (may fail due to case/spacing)
db.generated_content.findOne({
  title: "Football in kerala"
})

// Case-insensitive exact match
db.generated_content.findOne({
  title: { $regex: /^Football in kerala$/i }
})

// ⚠️ If still null, the title might be stored differently
// Try Solution 2 or 3 below instead
```

### 2. Find by Title (Partial Match)

```javascript
// Find articles with "Football" and "kerala" in title
db.generated_content.find({
  title: { $regex: /football.*kerala|kerala.*football/i }
})
  .sort({ createdAt: -1 })
  .pretty()

// Find articles containing "Football" in title
db.generated_content.find({
  title: { $regex: /football/i }
})
  .sort({ createdAt: -1 })
  .pretty()
```

### 3. Find by Keywords

```javascript
// Find articles with "Football" keyword
db.generated_content.find({
  keywords: { $in: ["Football"] }
})
  .sort({ createdAt: -1 })
  .pretty()

// Case-insensitive keyword search
db.generated_content.find({
  keywords: { $regex: /football/i }
})
  .sort({ createdAt: -1 })
  .pretty()
```

### 4. Find by Word Count

```javascript
// Find articles with 1000 words
db.generated_content.find({
  wordCount: 1000
})
  .sort({ createdAt: -1 })
  .pretty()

// Find articles with wordCount around 1000
db.generated_content.find({
  wordCount: { $gte: 900, $lte: 1100 }
})
  .sort({ createdAt: -1 })
  .pretty()
```

### 5. Find by Status

```javascript
// Find all completed articles
db.generated_content.find({
  status: "completed"
})
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()
```

### 6. Combined Search (Most Accurate)

```javascript
// Find article matching all criteria from UI
db.generated_content.findOne({
  title: { $regex: /football.*kerala/i },
  status: "completed",
  wordCount: 1000,
  keywords: { $in: ["Football"] }
})
```

### 7. Find Latest Articles (Like in UI)

```javascript
// Latest 10 completed articles (like the list in UI)
db.generated_content.find({
  status: "completed"
})
  .sort({ createdAt: -1 })
  .limit(10)
  .pretty()
```

### 8. Find by Date Range

```javascript
// Articles generated around 12/4/2025 (as shown in UI)
// Adjust date based on your timezone
const startDate = new Date("2025-12-04T00:00:00Z")
const endDate = new Date("2025-12-05T00:00:00Z")

db.generated_content.find({
  createdAt: {
    $gte: startDate,
    $lt: endDate
  }
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## 🔗 How the Article is Retrieved in the Application

### Frontend Code

**Location:** `app/dashboard/content/page.tsx`

**API Call:**
```typescript
// Line 1343-1347
const response = await fetch(`/api/content/${articleId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
```

### Backend API

**Location:** `app/api/content/[contentId]/route.ts`

**Query:**
```typescript
// Line 37-42
const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

const content = await collection.findOne({
  _id: new ObjectId(contentId),
  userId: new ObjectId(payload.userId)
});
```

**Collection Used:** `generated_content` (Collections.GENERATED_CONTENT)

---

## 📊 Complete Article Structure

Based on the UI, the article has this structure:

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  title: "Football in kerala",
  content: "In a world where fantasy sports enthusiasts...", // Full article content
  status: "completed",
  wordCount: 1000,
  keywords: ["Football"],
  createdAt: ISODate("2025-12-04T..."), // Generated 12/4/2025
  updatedAt: ISODate("2025-12-04T..."),
  // Additional fields may include:
  mode: "topic" | "keywords" | "trends" | "spin",
  jobId: "...",
  tone: "...",
  imagesGenerated: 0,
  images: []
}
```

---

## 🎯 Quick Queries to Find This Specific Article

### Option 1: Search by Title Pattern

```javascript
// Most likely to find it
db.generated_content.find({
  title: { $regex: /football.*kerala/i }
})
  .sort({ createdAt: -1 })
  .pretty()
```

### Option 2: Search by Content Preview

```javascript
// Search in content for the preview text shown in UI
db.generated_content.find({
  content: { 
    $regex: /Super League Kerala|fantasy sports enthusiasts/i 
  }
})
  .sort({ createdAt: -1 })
  .pretty()
```

### Option 3: Find All "Football" Articles

```javascript
// Find all articles with Football keyword
db.generated_content.find({
  $or: [
    { title: { $regex: /football/i } },
    { keywords: { $in: [/football/i] } },
    { content: { $regex: /football/i } }
  ]
})
  .sort({ createdAt: -1 })
  .pretty()
```

### Option 4: Get Article ID from Browser

If you have the article open in the browser:

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Click on the article** in the list
4. **Look for API call:** `/api/content/[contentId]`
5. **Copy the `contentId`** from the URL
6. **Query MongoDB:**

```javascript
// Replace with actual contentId from browser
const contentId = "507f1f77bcf86cd799439011"

db.generated_content.findOne({
  _id: ObjectId(contentId)
})
```

---

## 🔍 Verification Queries

### Check if Article Exists

```javascript
// Count articles matching criteria
db.generated_content.countDocuments({
  title: { $regex: /football.*kerala/i },
  status: "completed"
})

// Should return: 1 (if article exists)
```

### Get Full Article Details

```javascript
// Get complete article with all fields
db.generated_content.findOne({
  title: { $regex: /football.*kerala/i }
}, {
  // Include all fields
})
  .pretty()
```

### Check Article Metadata

```javascript
// Get article with specific fields only
db.generated_content.findOne({
  title: { $regex: /football.*kerala/i }
}, {
  _id: 1,
  title: 1,
  status: 1,
  wordCount: 1,
  keywords: 1,
  createdAt: 1,
  userId: 1,
  jobId: 1
})
  .pretty()
```

---

## 📝 Using MongoDB Atlas

### In Atlas Data Explorer

1. **Go to MongoDB Atlas Dashboard**
2. **Click "Browse Collections"**
3. **Select Database:** `vipcontentai`
4. **Select Collection:** `generated_content`
5. **Use Filter:**
   ```json
   { "title": { "$regex": "football.*kerala", "$options": "i" } }
   ```
6. **Or Filter by Status:**
   ```json
   { "status": "completed" }
   ```
7. **Sort by:** `createdAt` → `-1` (descending)

### In MongoDB Compass

1. **Connect to Atlas** using connection string
2. **Navigate:** `vipcontentai` → `generated_content`
3. **Use Filter:**
   ```
   { "title": /football.*kerala/i }
   ```
4. **Or search in search bar:** "Football in kerala"

---

## 🎯 Most Likely Query

Based on the UI screenshot, try these queries in order:

### If Exact Match Returns Null:

```javascript
// 1. Search in content (most reliable)
db.generated_content.find({
  content: { $regex: /Super League Kerala|fantasy sports enthusiasts/i }
})
  .sort({ createdAt: -1 })
  .pretty()

// 2. Search by word count and status
db.generated_content.find({
  status: "completed",
  wordCount: 1000
})
  .sort({ createdAt: -1 })
  .pretty()

// 3. List all recent articles to see actual titles
db.generated_content.find({
  status: "completed"
})
  .sort({ createdAt: -1 })
  .limit(20)
  .forEach(article => {
    print(`Title: "${article.title}" | ID: ${article._id}`)
  })

// 4. Flexible title search
db.generated_content.find({
  $and: [
    { title: { $regex: /football/i } },
    { title: { $regex: /kerala/i } },
    { status: "completed" }
  ]
})
  .sort({ createdAt: -1 })
  .pretty()
```

### Get Article ID from Browser (Recommended):

1. Open article in browser
2. Press F12 → Network tab
3. Click on article → Look for `/api/content/[id]`
4. Copy the ID and query:

```javascript
db.generated_content.findOne({
  _id: ObjectId("id-from-browser")
})
```

---

## 🔄 Related Queries

### Find All Articles for Same User

```javascript
// First, get the article to find userId
const article = db.generated_content.findOne({
  title: { $regex: /football.*kerala/i }
})

// Then find all articles for that user
db.generated_content.find({
  userId: article.userId
})
  .sort({ createdAt: -1 })
  .pretty()
```

### Find Related Articles (Same Keywords)

```javascript
// Find other articles with "Football" keyword
db.generated_content.find({
  keywords: { $in: ["Football"] },
  _id: { $ne: ObjectId("article-id-here") } // Exclude current article
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## ✅ Summary

**Article Location:**
- **Collection:** `generated_content`
- **Database:** `vipcontentai`
- **Title:** "Football in kerala"
- **Status:** `completed`
- **Word Count:** `1000`
- **Keywords:** `["Football"]`

**Quick Find Query:**
```javascript
db.generated_content.find({
  title: { $regex: /football.*kerala/i }
})
  .sort({ createdAt: -1 })
  .pretty()
```

**API Endpoint:**
```
GET /api/content/[contentId]
```

**Frontend Page:**
```
app/dashboard/content/page.tsx
```

---

Run these queries in MongoDB Atlas, MongoDB Compass, or MongoDB Shell to find your article! 🎯

