# MongoDB Collections Migration

This script creates all MongoDB collections based on the TypeScript type definitions in `lib/types/`.

## Prerequisites

1. MongoDB connection credentials in `.env.local`:
```env
MONGODB_URI=mongodb://admin:VipplayPass123@3.105.105.52:27017
MONGODB_DB_NAME=vipcontentai
```

2. Or set environment variables directly:
```bash
export MONGODB_URI="mongodb://admin:VipplayPass123@3.105.105.52:27017"
export MONGODB_DB_NAME="vipcontentai"
```

## Usage

Run the migration script:

```bash
pnpm db:migrate
```

Or directly:

```bash
pnpm tsx scripts/db/migrate-collections.ts
```

## What It Does

1. **Connects to MongoDB** using credentials from `.env.local`
2. **Creates collections** if they don't exist:
   - `users` - User accounts and authentication
   - `sources` - RSS/website/topic/trend sources
   - `articles` - Captured articles with embeddings
   - `generated_content` - AI-generated content
   - `media` - Media library (images/videos)
   - `ai_configurations` - AI model configurations
   - `model_groups` - Model routing groups
   - `export_jobs` - Single export job tracking
   - `bulk_export_jobs` - Bulk export job tracking
   - `notification_settings` - User notification preferences
   - `email_notifications` - Email notification history
   - `notifications` - In-app notifications
   - `generation_jobs` - Background generation jobs
   - `content_versions` - Content version history

3. **Creates indexes** for optimal query performance:
   - Unique indexes (email, keys, etc.)
   - Compound indexes for common queries
   - Text search indexes for content search
   - Sparse indexes for optional fields

## Collections Created

### Core Collections

- **users** - User authentication and profiles
- **sources** - Content sources (RSS, websites, topics, trends)
- **articles** - Captured articles with vector embeddings
- **generated_content** - AI-generated content with versioning
- **media** - Media assets (images, videos, audio)

### Configuration Collections

- **ai_configurations** - AI model and routing configurations
- **model_groups** - Model routing strategies

### Job Tracking Collections

- **generation_jobs** - Background content generation jobs
- **export_jobs** - Single content export jobs
- **bulk_export_jobs** - Bulk export jobs

### Notification Collections

- **notifications** - In-app notifications
- **notification_settings** - User notification preferences
- **email_notifications** - Email notification queue

### Version Control

- **content_versions** - Content edit history and versioning

## Indexes Created

Each collection has optimized indexes for:
- **User queries** - Filtering by userId with sorting
- **Status filtering** - Querying by status (active, pending, etc.)
- **Text search** - Full-text search on content fields
- **Unique constraints** - Preventing duplicates (email, GUID, etc.)
- **Date sorting** - Efficient sorting by createdAt, updatedAt

## Idempotent Operation

The script is **idempotent** - it's safe to run multiple times:
- Existing collections are not recreated
- Existing indexes are not duplicated
- Only missing indexes are created

## Verification

After running the migration, verify collections:

```bash
# Using mongosh
mongosh "mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai"

# List collections
show collections

# Check indexes for a collection
db.users.getIndexes()
db.articles.getIndexes()
```

## Troubleshooting

### Connection Errors

If you get connection errors:
1. Verify MongoDB server is running
2. Check credentials in `.env.local`
3. Verify network access to MongoDB server
4. Check firewall settings

### Index Creation Errors

If index creation fails:
- Check if index already exists (safe to ignore)
- Verify collection exists
- Check MongoDB user permissions

### Missing Collections

If a collection is missing:
- Check the script output for errors
- Verify MongoDB user has create collection permissions
- Run the script again (it's idempotent)

## Next Steps

After migration:
1. Run `pnpm db:setup` to seed initial data (optional)
2. Start the Next.js application: `pnpm dev`
3. Start the FastAPI service: `cd api-service && uvicorn main:app --reload`

## Seeding Sample Data

After running the migration, you can populate the database with sample data:

```bash
pnpm db:seed
```

This will create:
- **3 Users** (admin, demo, user) with password `SecurePass123!`
- **4 Sources** (RSS, website, topic, trends)
- **3 Articles** with content and metadata
- **2 Generated Content** items (approved and draft)
- **2 Media Assets** (images)
- **6 AI Configurations** (models, limits, performance)
- **3 Model Groups** (default, quality, fast)
- **2 Generation Jobs** (completed and processing)
- **2 Export Jobs** (markdown and PDF)
- **2 Notification Settings** (user preferences)
- **3 Notifications** (in-app notifications)
- **2 Email Notifications** (sent and pending)
- **1 Content Version** (version history)

All seed data is **idempotent** - running the script multiple times won't create duplicates.

## Related Scripts

- `pnpm db:setup` - Full database setup with seeding
- `pnpm db:migrate` - This migration script (collections only)
- `pnpm db:seed` - Seed sample data (run after migration)

