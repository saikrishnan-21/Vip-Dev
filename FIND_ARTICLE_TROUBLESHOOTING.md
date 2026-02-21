# Troubleshooting: Article Not Found in MongoDB

If you're getting `null` but the article is visible on the website, try these solutions:

## 🔍 Problem: Query Returns Null

**Possible Causes:**
1. Title has different casing or spacing
2. Title is stored differently than displayed
3. Article is in a different collection
4. Special characters or encoding issues
5. User ID mismatch

---

## ✅ Solution 1: More Flexible Title Search

### Try These Queries (in order):

```javascript
// 1. Case-insensitive partial match
db.generated_content.find({
  title: { $regex: /football/i }
})
  .sort({ createdAt: -1 })
  .pretty()

// 2. Search for "kerala" in title
db.generated_content.find({
  title: { $regex: /kerala/i }
})
  .sort({ createdAt: -1 })
  .pretty()

// 3. Search for both words (any order)
db.generated_content.find({
  title: { $regex: /football|kerala/i }
})
  .sort({ createdAt: -1 })
  .pretty()

// 4. Search with word boundaries
db.generated_content.find({
  title: { $regex: /\bfootball\b.*\bkerala\b/i }
})
  .sort({ createdAt: -1 })
  .pretty()

// 5. Search with any spacing
db.generated_content.find({
  title: { $regex: /football\s+in\s+kerala/i }
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## ✅ Solution 2: Search in Content Field

The title might be different, but content should match:

```javascript
// Search in content for the preview text
db.generated_content.find({
  content: { 
    $regex: /Super League Kerala|fantasy sports enthusiasts/i 
  }
})
  .sort({ createdAt: -1 })
  .pretty()

// Search for specific phrase from preview
db.generated_content.find({
  content: { 
    $regex: /Super League Kerala stands as an intriguing anomaly/i 
  }
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## ✅ Solution 3: Find by Word Count and Status

```javascript
// Find all completed articles with 1000 words
db.generated_content.find({
  status: "completed",
  wordCount: 1000
})
  .sort({ createdAt: -1 })
  .pretty()

// Find recent completed articles
db.generated_content.find({
  status: "completed"
})
  .sort({ createdAt: -1 })
  .limit(20)
  .pretty()
```

---

## ✅ Solution 4: Get Article ID from Browser

### Method 1: Browser DevTools

1. **Open the article** in your browser
2. **Press F12** to open DevTools
3. **Go to Network tab**
4. **Click on the article** in the list (if it makes an API call)
5. **Look for request:** `/api/content/[contentId]`
6. **Copy the `contentId`** from the URL
7. **Query MongoDB:**

```javascript
// Replace with actual contentId from browser
const contentId = "507f1f77bcf86cd799439011"

db.generated_content.findOne({
  _id: ObjectId(contentId)
})
```

### Method 2: Browser Console

1. **Open the article** in your browser
2. **Press F12** → **Console tab**
3. **Run this JavaScript:**

```javascript
// Get current article ID from URL or state
// Check the URL or React state
console.log(window.location.pathname)
// Or check localStorage/state for article ID
```

---

## ✅ Solution 5: List All Recent Articles

```javascript
// Get all recent articles and check titles
db.generated_content.find({})
  .sort({ createdAt: -1 })
  .limit(50)
  .forEach(article => {
    print(`Title: ${article.title} | Status: ${article.status} | ID: ${article._id}`)
  })

// Or get just titles
db.generated_content.find({}, { title: 1, status: 1, createdAt: 1 })
  .sort({ createdAt: -1 })
  .limit(50)
  .pretty()
```

---

## ✅ Solution 6: Check for Title Variations

```javascript
// Check for common title variations
const variations = [
  "Football in kerala",
  "Football in Kerala",
  "Football In Kerala",
  "FOOTBALL IN KERALA",
  "Football in Kerala",
  "Football  in  kerala",  // double spaces
  "Football in kerala ",    // trailing space
  " Football in kerala",    // leading space
]

variations.forEach(title => {
  const result = db.generated_content.findOne({ title: title })
  if (result) {
    print(`Found with title: "${title}"`)
    printjson(result)
  }
})
```

---

## ✅ Solution 7: Search All Fields

```javascript
// Search across multiple fields
db.generated_content.find({
  $or: [
    { title: { $regex: /football/i } },
    { title: { $regex: /kerala/i } },
    { content: { $regex: /football/i } },
    { content: { $regex: /kerala/i } },
    { keywords: { $in: [/football/i, /kerala/i] } }
  ]
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## ✅ Solution 8: Check User ID

The article might be filtered by userId. Check your user ID first:

```javascript
// Find your user ID
db.users.find({}, { email: 1, _id: 1 }).pretty()

// Then search with your userId
const userId = ObjectId("your-user-id-here")

db.generated_content.find({
  userId: userId,
  status: "completed"
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## ✅ Solution 9: Check API Response

### Get Article via API

If the article is visible on the site, you can get it via API:

```bash
# Get your auth token from browser localStorage
# Then call the API

curl -X GET "http://localhost:3000/api/content" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# This will return all articles, find the one you need
```

### Or Check Browser Network Tab

1. **Open DevTools** → **Network tab**
2. **Filter:** `XHR` or `Fetch`
3. **Look for:** `/api/content` or `/api/content/[id]`
4. **Check Response:** See the actual data structure
5. **Note the `_id`** from the response
6. **Query MongoDB with that ID:**

```javascript
db.generated_content.findOne({
  _id: ObjectId("id-from-api-response")
})
```

---

## ✅ Solution 10: Check Different Collections

Sometimes articles might be in different collections:

```javascript
// Check articles collection (captured articles)
db.articles.find({
  title: { $regex: /football.*kerala/i }
})
  .sort({ createdAt: -1 })
  .pretty()

// Check generation_jobs (job tracking)
db.generation_jobs.find({
  topic: { $regex: /football.*kerala/i }
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## 🔧 Debugging Steps

### Step 1: Verify Collection Exists

```javascript
// Check if collection exists
db.getCollectionNames()

// Should include: "generated_content"
```

### Step 2: Check Collection Count

```javascript
// Count total documents
db.generated_content.countDocuments({})

// Count by status
db.generated_content.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

### Step 3: List All Titles

```javascript
// Get all unique titles (first 100)
db.generated_content.find({}, { title: 1 })
  .limit(100)
  .forEach(doc => print(doc.title))
```

### Step 4: Check Exact Title Format

```javascript
// Get all titles and check for similar ones
db.generated_content.find({}, { title: 1, _id: 1 })
  .sort({ createdAt: -1 })
  .limit(20)
  .forEach(doc => {
    if (doc.title.toLowerCase().includes("football") || 
        doc.title.toLowerCase().includes("kerala")) {
      print(`Found: "${doc.title}" | ID: ${doc._id}`)
    }
  })
```

---

## 🎯 Most Likely Solutions

Based on common issues, try these in order:

### 1. Case Sensitivity Issue

```javascript
// Try exact case variations
db.generated_content.find({
  $or: [
    { title: "Football in kerala" },
    { title: "Football in Kerala" },
    { title: "Football In Kerala" },
    { title: "football in kerala" }
  ]
})
  .pretty()
```

### 2. Extra Spaces

```javascript
// Trim and search
db.generated_content.find({})
  .forEach(doc => {
    if (doc.title && doc.title.trim().toLowerCase() === "football in kerala") {
      printjson(doc)
    }
  })
```

### 3. Search in Content

```javascript
// Most reliable - search in content
db.generated_content.find({
  content: { $regex: /Super League Kerala/i }
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## 📋 Complete Diagnostic Query

Run this to get comprehensive information:

```javascript
// Complete diagnostic
const results = {
  totalCount: db.generated_content.countDocuments({}),
  completedCount: db.generated_content.countDocuments({ status: "completed" }),
  recentArticles: db.generated_content.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray(),
  footballArticles: db.generated_content.find({
    $or: [
      { title: { $regex: /football/i } },
      { content: { $regex: /football/i } },
      { keywords: { $in: [/football/i] } }
    ]
  })
    .sort({ createdAt: -1 })
    .toArray()
}

printjson(results)
```

---

## 🔍 Alternative: Use API to Find Article

Since the article is visible on the site, use the API:

### Get All Articles

```javascript
// In browser console or via curl
fetch('/api/content?status=completed&limit=100', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
})
  .then(r => r.json())
  .then(data => {
    // Find article in response
    const article = data.content.find(a => 
      a.title.toLowerCase().includes('football') && 
      a.title.toLowerCase().includes('kerala')
    )
    console.log('Found article:', article)
    console.log('Article ID:', article._id)
  })
```

Then use the ID to query MongoDB:

```javascript
db.generated_content.findOne({
  _id: ObjectId("id-from-api-response")
})
```

---

## ✅ Quick Fix: Get Article ID from UI

**Easiest Method:**

1. **Open the article** in your browser
2. **Right-click** on the article title → **Inspect Element**
3. **Look for data attributes** like `data-article-id` or `data-id`
4. **Or check the React component props** in DevTools
5. **Copy the ID** and query:

```javascript
db.generated_content.findOne({
  _id: ObjectId("copied-id-here")
})
```

---

## 🎯 Recommended Approach

**Start with this query (most likely to work):**

```javascript
// 1. Get all recent completed articles
db.generated_content.find({
  status: "completed"
})
  .sort({ createdAt: -1 })
  .limit(20)
  .forEach(article => {
    print(`\nTitle: "${article.title}"`)
    print(`ID: ${article._id}`)
    print(`Status: ${article.status}`)
    print(`Word Count: ${article.wordCount}`)
    print(`Keywords: ${JSON.stringify(article.keywords)}`)
    print(`Created: ${article.createdAt}`)
    print("---")
  })
```

This will show you all recent articles so you can identify the exact title format.

---

**Run the diagnostic query above to see all recent articles and find the exact title format!** 🔍

