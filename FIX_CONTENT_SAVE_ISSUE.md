# Fix: Content Not Saved to Database

## ✅ Changes Made

I've added **error handling** around the database save operations to:
1. **Catch save errors** and log them properly
2. **Update job status** if save fails
3. **Log detailed information** about why content isn't saved

---

## 📝 Files Modified

### 1. `app/api/content/generate/route.ts`

**Added error handling around save operation (Line 461):**

```typescript
try {
  const saveResult = await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
  console.log(`[FastAPI Generation] Job ${jobId} - Content saved to generated_content collection`, {
    contentId: saveResult.insertedId.toString(),
    contentLength: fastapiData.content?.length || 0,
    imagesGenerated: 0,
  });
} catch (saveError: any) {
  console.error(`[FastAPI Generation] Job ${jobId} - Failed to save content to database:`, saveError);
  // Update job with save error
  await jobsCollection.updateOne(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        status: 'failed',
        error: `Failed to save content to database: ${saveError.message}`,
        message: `Generation completed but save failed: ${saveError.message}`,
        updatedAt: new Date(),
      },
    }
  );
  throw new Error(`Database save failed: ${saveError.message}`);
}
```

**Added logging when content is not saved (Line 485):**

```typescript
} else {
  // Content not saved - log reason
  console.warn(`[FastAPI Generation] Job ${jobId} - Content not saved. Reason:`, {
    isCompleted,
    hasSuccess: fastapiData.success,
    hasContent: !!fastapiData.content,
    successValue: fastapiData.success,
    contentLength: fastapiData.content?.length || 0,
    message: fastapiData.message,
  });
  // ... rest of error handling
}
```

### 2. `lib/services/sqs-worker.ts`

**Added same error handling for SQS worker (Line 228):**

```typescript
try {
  const saveResult = await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
  console.log(`[SQS Worker] Article generation job ${jobId} completed successfully`, {
    contentId: saveResult.insertedId.toString(),
    contentLength: fastapiData.content?.length || 0,
  });
} catch (saveError: any) {
  console.error(`[SQS Worker] Article generation job ${jobId} - Failed to save content:`, saveError);
  // Update job with save error
  await jobsCollection.updateOne(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        status: 'failed',
        error: `Failed to save content to database: ${saveError.message}`,
        message: `Generation completed but save failed: ${saveError.message}`,
        updatedAt: new Date(),
      },
    }
  );
  throw saveError; // Re-throw to prevent message deletion
}
```

---

## 🔍 How to Diagnose the Issue

### Step 1: Check Server Logs

**After generating content, look for these log messages:**

✅ **Success:**
```
[FastAPI Generation] Job {jobId} - Content saved to generated_content collection
  contentId: "..."
  contentLength: 1234
```

❌ **Save Failed:**
```
[FastAPI Generation] Job {jobId} - Failed to save content to database: {error}
```

⚠️ **Content Not Saved (Condition Not Met):**
```
[FastAPI Generation] Job {jobId} - Content not saved. Reason: {
  isCompleted: false,
  hasSuccess: false,
  hasContent: false,
  ...
}
```

### Step 2: Check Generation Jobs

```javascript
// Find jobs with save errors
db.generation_jobs.find({
  error: { $regex: /Failed to save content/i }
})
  .sort({ createdAt: -1 })
  .pretty()

// Check job status
db.generation_jobs.find({})
  .sort({ createdAt: -1 })
  .limit(10)
  .forEach(job => {
    print(`\nJob: ${job._id}`)
    print(`Status: ${job.status}`)
    print(`Error: ${job.error || 'None'}`)
    print(`Message: ${job.message}`)
    
    // Check if content exists
    const content = db.generated_content.findOne({ 
      jobId: job._id.toString() 
    })
    print(`Content Saved: ${content ? 'YES ✅' : 'NO ❌'}`)
  })
```

### Step 3: Check FastAPI Response

**The save only happens if:**
- `fastapiData.success === true`
- `fastapiData.content` exists and is not empty

**Verify FastAPI is returning:**
```json
{
  "success": true,
  "content": "Full article content here...",
  "message": "Generation completed"
}
```

**If FastAPI returns:**
- `success: false` → Content won't be saved (expected)
- Missing `content` → Content won't be saved (check FastAPI)
- `content: null` or empty → Content won't be saved (check FastAPI)

---

## 🐛 Common Issues & Solutions

### Issue 1: MongoDB Connection Error

**Error in logs:**
```
Failed to save content to database: MongoServerError: ...
```

**Solution:**
1. Check MongoDB connection string in `.env.local`
2. Verify MongoDB is accessible
3. Check network connectivity

### Issue 2: FastAPI Not Returning Content

**Log shows:**
```
Content not saved. Reason: { hasContent: false, ... }
```

**Solution:**
1. Check FastAPI logs
2. Verify FastAPI is generating content
3. Check FastAPI response format

### Issue 3: Database Write Permission

**Error:**
```
Failed to save content to database: MongoServerError: not authorized
```

**Solution:**
1. Check MongoDB user permissions
2. Verify user has write access to `generated_content` collection

### Issue 4: Collection Doesn't Exist

**Error:**
```
Failed to save content to database: Collection not found
```

**Solution:**
1. Create collection: `db.createCollection("generated_content")`
2. Or let MongoDB create it automatically (should work)

---

## ✅ Testing the Fix

### Test 1: Generate New Article

1. **Generate a new article** via the UI
2. **Check server logs** for save message
3. **Query MongoDB:**
```javascript
// Get latest article
const latest = db.generated_content.findOne({}, { 
  sort: { createdAt: -1 } 
})

if (latest && latest.content) {
  print(`✅ Content saved!`)
  print(`Title: ${latest.title}`)
  print(`Content length: ${latest.content.length} chars`)
} else {
  print(`❌ Content not found`)
}
```

### Test 2: Check Error Handling

1. **Temporarily break MongoDB connection** (wrong connection string)
2. **Generate article**
3. **Check logs** for error message
4. **Check job status** - should be "failed" with error message

---

## 📊 Diagnostic Queries

### Check All Jobs and Their Content Status

```javascript
// Complete diagnostic
db.generation_jobs.find({})
  .sort({ createdAt: -1 })
  .limit(20)
  .forEach(job => {
    const content = db.generated_content.findOne({ 
      jobId: job._id.toString() 
    })
    
    print(`\nJob: ${job._id}`)
    print(`Status: ${job.status}`)
    print(`Content Saved: ${content ? 'YES ✅' : 'NO ❌'}`)
    
    if (!content && job.status === 'completed') {
      print(`⚠️ WARNING: Job completed but no content saved!`)
      print(`Error: ${job.error || 'None'}`)
      print(`Message: ${job.message}`)
    }
  })
```

### Find Jobs with Save Errors

```javascript
// Jobs that failed to save
db.generation_jobs.find({
  $or: [
    { error: { $regex: /Failed to save/i } },
    { message: { $regex: /save failed/i } }
  ]
})
  .sort({ createdAt: -1 })
  .pretty()
```

---

## 🎯 Next Steps

1. **Restart your Next.js server** to apply changes
2. **Generate a new article** and check logs
3. **Run diagnostic queries** to see if content is being saved
4. **Check for error messages** in logs if save fails

**The error handling will now show you EXACTLY why content isn't being saved!** 🔍

---

## 📝 Summary

**Before:** Save errors were silent - no way to know why content wasn't saved

**After:** 
- ✅ Save errors are caught and logged
- ✅ Job status updated with error details
- ✅ Detailed logging when content isn't saved
- ✅ Clear error messages for debugging

**Now you can see exactly what's preventing content from being saved!** 🎉

