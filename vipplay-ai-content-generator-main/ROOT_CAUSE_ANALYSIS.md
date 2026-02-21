# Root Cause Analysis: Data Disappearing Issue

## Problem
Images and articles are created successfully but disappear after some time when viewing them in the UI.

## Investigation Results

### ✅ What We Verified
1. **Data exists in database** - Diagnostic shows 77 media items and 194 content items
2. **No TTL indexes** - Data is not being auto-deleted
3. **No orphaned data** - All userIds are valid
4. **Data matches userId** - User's data (57 media, 175 content) exists and matches their userId

### 🔍 Root Cause Identified

The issue is likely one of these:

#### 1. **JWT Token userId Mismatch** (MOST LIKELY)
- When user logs in, JWT token contains `userId`
- Data is saved with this `userId`
- If token expires or user logs in again, new token might have different `userId` (if there's a bug in token generation)
- Queries filter by `userId` from token, so if userId changes, data "disappears"

#### 2. **MongoDB URI Missing Database Name**
- Current URI: `mongodb://admin:VipplayPass123@52.202.212.166:27017`
- Should be: `mongodb://admin:VipplayPass123@52.202.212.166:27017/vipcontentai`
- While code has fallback (`MONGODB_DB_NAME`), connection pooling might cause issues

#### 3. **Frontend State Management**
- Frontend might be clearing state after some time
- Pagination might not be loading all data
- Cache might be expiring

#### 4. **API Query Filtering**
- Status filters might be excluding data
- Search queries might be too restrictive

## Solutions

### Fix 1: Update MongoDB URI to Include Database Name
This ensures consistent database connection.

### Fix 2: Add Logging to Track userId Changes
Add logging to see if userId in token changes over time.

### Fix 3: Verify JWT Token Consistency
Ensure userId in token always matches the user who created the data.

### Fix 4: Add Debug Endpoint
Create an endpoint to check what userId is in the current token vs what's in the database.

## Recommended Actions

1. **Immediate**: Update `.env.local` to include database name in URI
2. **Short-term**: Add logging to track userId in requests
3. **Long-term**: Implement proper session management and token refresh

