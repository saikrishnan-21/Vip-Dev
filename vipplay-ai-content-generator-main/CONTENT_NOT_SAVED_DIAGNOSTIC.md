# Content Not Saved to Database - Diagnostic Guide

## 🚨 Problem: Article Content Not Available in Database

If articles are visible on the website but not in MongoDB, this guide will help you diagnose and fix the issue.

---

## 🔍 Root Cause Analysis

### Where Content SHOULD Be Saved

**Location:** `app/api/content/generate/route.ts` (Line 461)
**Collection:** `generated_content`
**Condition:** Only saves if `isCompleted && fastapiData.content` is true

### Potential Issues

1. **Save Operation Not Executed**
   - Condition `isCompleted && fastapiData.content` is false
   - FastAPI returns `success: false` or missing `content` field
   - Save code never reached

2. **Save Operation Fails Silently**
   - No try-catch around `insertOne()`
   - MongoDB connection error
   - Database write permission issue
   - Error swallowed in promise chain

3. **Wrong Database/Collection**
   - Querying wrong database
   - Collection name mismatch
   - Connection string issue

---

## 🔧 Diagnostic Steps

### Step 1: Check Server Logs

**Look for these log messages:**

✅ **Success Log (Should appear):**
```
[FastAPI Generation] Job {jobId} - Content saved to generated_content collection
```

❌ **Error Logs (Indicates problem):**
```
[FastAPI Generation] Job {jobId} - FastAPI returned success: false
[FastAPI Generation] Job {jobId} - isCompleted: false
[FastAPI Generation] Job {jobId} - Error processing response
```

**Action:** Check your Next.js server console/logs for these messages.

### Step 2: Check Generation Jobs

```javascript
// Find recent jobs and their status
db.generation_jobs.find({})
  .sort({ createdAt: -1 })
  .limit(10)
  .forEach(job => {
    print(`\nJob ID: ${job._id}`)
    print(`Status: ${job.status}`)
    print(`Message: ${job.message}`)
    print(`Error: ${job.error || 'None'}`)
    print(`Progress: ${job.progress}%`)
    
    // Check if content exists
    const content = db.generated_content.findOne({ 
      jobId: job._id.toString() 
    })
    print(`Content Saved: ${content ? 'YES ✅' : 'NO ❌'}`)
    if (content) {
      print(`  Content ID: ${content._id}`)
      print(`  Title: ${content.title}`)
    }
  })
```

### Step 3: Check FastAPI Response

**The save only happens if:**
```javascript
const isCompleted = fastapiData.success === true && fastapiData.content;
```

**Verify FastAPI is returning correct format:**

```bash
# Check FastAPI logs
# Should see response like:
{
  "success": true,
  "content": "Generated article content...",
  "message": "Generation completed"
}
```

**If FastAPI returns:**
- `success: false` → Content won't be saved
- Missing `content` field → Content won't be saved
- `success: true` but `content: null` → Content won't be saved

### Step 4: Check MongoDB Connection

```javascript
// Verify database connection
db.getName()  // Should be: vipcontentai

// Check if collection exists
db.getCollectionNames()  // Should include: generated_content

// Check write permissions
try {
  const testDoc = {
    _test: true,
    createdAt: new Date()
  }
  const result = db.generated_content.insertOne(testDoc)
  print(`✅ Write test successful: ${result.insertedId}`)
  
  // Clean up test doc
  db.generated_content.deleteOne({ _test: true })
} catch (error) {
  print(`❌ Write test failed: ${error.message}`)
}
```

### Step 5: Check Save Condition

**The save code (line 423):**
```typescript
if (isCompleted && fastapiData.content) {
  // Save content
  await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
}
```

**Add logging to verify condition:**

Check if this log appears:
```
[FastAPI Generation] Job {jobId} - isCompleted: {true/false}, success: {true/false}, hasContent: {true/false}
```

**If `isCompleted: false` or `hasContent: false`:** Content won't be saved.

---

## 🐛 Common Issues & Fixes

### Issue 1: FastAPI Returns Wrong Format

**Problem:** FastAPI returns `success: false` or missing `content`

**Check FastAPI Response:**
```typescript
// In route.ts, add logging:
console.log('FastAPI Response:', JSON.stringify(fastapiData, null, 2));
```

**Fix:** Ensure FastAPI returns:
```json
{
  "success": true,
  "content": "Full article content here...",
  "message": "Generation completed"
}
```

### Issue 2: Save Operation Fails Silently

**Problem:** `insertOne()` throws error but not caught

**Current Code (Line 461):**
```typescript
await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
```

**Fix:** Add try-catch around save:
```typescript
try {
  const result = await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
  console.log(`[FastAPI Generation] Job ${jobId} - Content saved: ${result.insertedId}`);
} catch (saveError: any) {
  console.error(`[FastAPI Generation] Job ${jobId} - Save failed:`, saveError);
  // Still update job status
  await jobsCollection.updateOne(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        status: 'failed',
        error: `Failed to save content: ${saveError.message}`,
        updatedAt: new Date(),
      },
    }
  );
}
```

### Issue 3: SQS Worker Not Running

**If using SQS:** Content is saved by SQS worker, not directly

**Check:**
1. Is SQS worker running? `npm run worker:sqs`
2. Check SQS worker logs for save messages
3. Verify SQS queue has messages

**SQS Worker Save Location:** `lib/services/sqs-worker.ts` (Line 228)

### Issue 4: Database Connection Issue

**Problem:** MongoDB connection fails during save

**Check:**
```javascript
// Test connection
const db = await getDatabase();
const test = await db.collection('generated_content').findOne({});
print(`Connection OK: ${test !== null ? 'YES' : 'NO'}`)
```

**Fix:** Check MongoDB connection string in `.env.local`

### Issue 5: Wrong Database/Collection

**Problem:** Querying wrong database

**Check:**
```javascript
// Verify current database
db.getName()

// Should be: vipcontentai
// If not, switch: use vipcontentai
```

---

## 🔧 Quick Fix: Add Better Error Handling

### Update `app/api/content/generate/route.ts`

**Find line 461 and replace with:**

```typescript
// If generation completed, store in generated_content collection
if (isCompleted && fastapiData.content) {
  // ... existing title generation code ...
  
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

  // Add try-catch for save operation
  try {
    const saveResult = await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
    console.log(`[FastAPI Generation] Job ${jobId} - Content saved to generated_content collection`, {
      contentId: saveResult.insertedId.toString(),
      contentLength: fastapiData.content?.length || 0,
      imagesGenerated: 0,
    });
  } catch (saveError: any) {
    console.error(`[FastAPI Generation] Job ${jobId} - Failed to save content:`, saveError);
    // Update job with error
    await jobsCollection.updateOne(
      { _id: new ObjectId(jobId) },
      {
        $set: {
          status: 'failed',
          error: `Failed to save content to database: ${saveError.message}`,
          updatedAt: new Date(),
        },
      }
    );
    throw saveError; // Re-throw to be caught by outer catch
  }
} else {
  // Log why content wasn't saved
  console.warn(`[FastAPI Generation] Job ${jobId} - Content not saved. Reason:`, {
    isCompleted,
    hasSuccess: fastapiData.success,
    hasContent: !!fastapiData.content,
    successValue: fastapiData.success,
    contentLength: fastapiData.content?.length || 0,
  });
}
```

---

## 📊 Complete Diagnostic Script

Run this in MongoDB to check everything:

```javascript
// Complete diagnostic
const diagnostic = {
  timestamp: new Date(),
  database: db.getName(),
  collectionExists: db.getCollectionNames().includes("generated_content"),
  totalContent: db.generated_content.countDocuments({}),
  recentJobs: [],
  jobsWithoutContent: [],
  jobsWithContent: []
}

// Check recent jobs
db.generation_jobs.find({})
  .sort({ createdAt: -1 })
  .limit(20)
  .forEach(job => {
    const jobInfo = {
      jobId: job._id.toString(),
      status: job.status,
      message: job.message,
      error: job.error,
      progress: job.progress,
      createdAt: job.createdAt
    }
    
    diagnostic.recentJobs.push(jobInfo)
    
    // Check if content exists
    const content = db.generated_content.findOne({ 
      jobId: job._id.toString() 
    })
    
    if (content) {
      diagnostic.jobsWithContent.push({
        ...jobInfo,
        contentId: content._id.toString(),
        title: content.title,
        contentLength: content.content?.length || 0
      })
    } else {
      diagnostic.jobsWithoutContent.push(jobInfo)
    }
  })

printjson(diagnostic)

// Summary
print(`\n📊 Summary:`)
print(`Total Content in DB: ${diagnostic.totalContent}`)
print(`Jobs with Content: ${diagnostic.jobsWithContent.length}`)
print(`Jobs without Content: ${diagnostic.jobsWithoutContent.length}`)
print(`\n❌ Jobs without content (need investigation):`)
diagnostic.jobsWithoutContent.forEach(job => {
  print(`  - Job ${job.jobId}: ${job.status} - ${job.message || job.error || 'No error'}`)
})
```

---

## ✅ Verification Steps

### After Fixing, Verify:

1. **Generate new article**
2. **Check logs for:** `Content saved to generated_content collection`
3. **Query MongoDB:**
```javascript
// Get latest article
db.generated_content.find({})
  .sort({ createdAt: -1 })
  .limit(1)
  .pretty()
```
4. **Verify content exists:**
```javascript
const latest = db.generated_content.findOne({}, { sort: { createdAt: -1 } })
if (latest && latest.content && latest.content.length > 0) {
  print(`✅ Content saved successfully!`)
  print(`Title: ${latest.title}`)
  print(`Content length: ${latest.content.length} characters`)
} else {
  print(`❌ Content not saved or empty`)
}
```

---

## 🎯 Most Likely Causes (Priority Order)

1. **FastAPI not returning `success: true` and `content`** (Most Common)
2. **Save operation failing silently** (No error handling)
3. **SQS worker not running** (If using SQS)
4. **MongoDB connection issue** (Connection string wrong)
5. **Wrong database** (Querying different database)

---

## 📝 Next Steps

1. **Check server logs** for save messages
2. **Run diagnostic script** above
3. **Add error handling** around save operation
4. **Verify FastAPI response format**
5. **Check MongoDB connection**

**The content IS being generated (visible on site), but the save to MongoDB is failing. Use the diagnostic steps above to find the exact cause!** 🔍

