# Fix for 500 Error on Login

## Issue Found in .env.local

Your MongoDB URI is missing the database name in the connection string.

### Current (WRONG):
```env
MONGODB_URI=mongodb://admin:VipplayPass123@52.202.212.166:27017
```

### Should be (CORRECT):
```env
MONGODB_URI=mongodb://admin:VipplayPass123@52.202.212.166:27017/vipcontentai
```

## Fix Steps

1. **Update your `.env.local` file:**

   Change this line:
   ```env
   MONGODB_URI=mongodb://admin:VipplayPass123@52.202.212.166:27017
   ```
   
   To this:
   ```env
   MONGODB_URI=mongodb://admin:VipplayPass123@52.202.212.166:27017/vipcontentai
   ```

2. **Restart your Next.js server** after making the change:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   pnpm dev
   ```

3. **Verify the fix:**
   - Visit: `http://98.94.212.38:3000/api/health`
   - Should show: `"mongodb_connection": { "status": "ok" }`

## Additional Checks

If the error persists, also verify:

1. **Database exists and has collections:**
   ```bash
   pnpm db:migrate
   ```

2. **Users exist in database:**
   ```bash
   pnpm db:seed
   ```

3. **Test login with seeded user:**
   - Email: `admin@vipcontentai.com`
   - Password: `SecurePass123!`

## Why This Causes 500 Error

When the MongoDB URI doesn't include the database name, the connection might:
- Connect to the default database instead of `vipcontentai`
- Fail to find the `users` collection
- Throw an error when trying to query collections

The `getDatabase()` function uses `MONGODB_DB_NAME` as a fallback, but it's better to include it in the URI for reliability.

