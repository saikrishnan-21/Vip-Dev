/**
 * MongoDB Collections Migration Script
 * Creates all collections based on TypeScript type definitions
 * 
 * Usage: pnpm tsx scripts/db/migrate-collections.ts
 */

import { MongoClient, Db } from 'mongodb';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables from .env.local (if exists), fallback to .env
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  config({ path: envPath });
}

// Default connection string (from project documentation)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:VipplayPass123@3.105.105.52:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'vipcontentai';

// Collection definitions based on lib/types/*.ts
const COLLECTIONS = {
  users: {
    indexes: [
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { role: 1 }, name: 'role_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { lastLoginAt: -1 }, sparse: true, name: 'last_login_desc' }
    ]
  },

  sources: {
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { userId: 1, type: 1 }, name: 'user_type_index' },
      { key: { type: 1, status: 1 }, name: 'type_status_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { feedUrl: 1 }, sparse: true, name: 'feed_url_index' },
      { key: { websiteUrl: 1 }, sparse: true, name: 'website_url_index' },
      { key: { lastFetchedAt: -1 }, sparse: true, name: 'last_fetched_desc' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  articles: {
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { sourceId: 1 }, name: 'source_id_index' },
      { key: { sourceId: 1, guid: 1 }, unique: true, sparse: true, name: 'source_guid_unique' },
      { key: { guid: 1 }, sparse: true, name: 'guid_index' },
      { key: { publishedAt: -1 }, sparse: true, name: 'published_at_desc' },
      { key: { fetchedAt: -1 }, name: 'fetched_at_desc' },
      { key: { tags: 1 }, name: 'tags_index' },
      { key: { hasEmbedding: 1 }, name: 'has_embedding_index' },
      { key: { title: 'text', content: 'text' }, name: 'text_search_index' }
    ]
  },

  generated_content: {
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { userId: 1, status: 1 }, name: 'user_status_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { sourceType: 1 }, name: 'source_type_index' },
      { key: { version: 1 }, name: 'version_index' },
      { key: { previousVersionId: 1 }, sparse: true, name: 'previous_version_index' },
      { key: { publishedAt: -1 }, sparse: true, name: 'published_at_desc' },
      { key: { scheduledFor: 1 }, sparse: true, name: 'scheduled_for_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { title: 'text', content: 'text' }, name: 'text_search_index' }
    ]
  },

  media: {
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { type: 1 }, name: 'type_index' },
      { key: { source: 1 }, name: 'source_index' },
      { key: { tags: 1 }, name: 'tags_index' },
      { key: { category: 1 }, sparse: true, name: 'category_index' },
      { key: { mimeType: 1 }, name: 'mime_type_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { filename: 'text', originalName: 'text', tags: 'text' }, name: 'text_search_index' }
    ]
  },

  ai_configurations: {
    indexes: [
      { key: { key: 1 }, unique: true, name: 'key_unique' },
      { key: { category: 1 }, name: 'category_index' },
      { key: { isActive: 1 }, name: 'is_active_index' },
      { key: { category: 1, isActive: 1 }, name: 'category_active_index' },
      { key: { createdBy: 1 }, name: 'created_by_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  model_groups: {
    indexes: [
      { key: { name: 1 }, unique: true, name: 'name_unique' },
      { key: { isActive: 1 }, name: 'is_active_index' },
      { key: { routingStrategy: 1 }, name: 'routing_strategy_index' },
      { key: { createdBy: 1 }, name: 'created_by_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  export_jobs: {
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { contentId: 1 }, name: 'content_id_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { format: 1 }, name: 'format_index' },
      { key: { status: 1, createdAt: -1 }, name: 'status_created_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  bulk_export_jobs: {
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { format: 1 }, name: 'format_index' },
      { key: { status: 1, createdAt: -1 }, name: 'status_created_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  notification_settings: {
    indexes: [
      { key: { userId: 1 }, unique: true, name: 'user_unique' },
      { key: { email: 1 }, name: 'email_index' },
      { key: { emailVerified: 1 }, name: 'email_verified_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  email_notifications: {
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { email: 1 }, name: 'email_index' },
      { key: { status: 1, createdAt: -1 }, name: 'status_created_index' },
      { key: { sentAt: -1 }, sparse: true, name: 'sent_at_desc' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  notifications: {
    indexes: [
      { key: { userId: 1, read: 1 }, name: 'user_read_index' },
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { read: 1 }, name: 'read_index' },
      { key: { type: 1 }, name: 'type_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  generation_jobs: {
    indexes: [
      { key: { userId: 1, status: 1 }, name: 'user_status_index' },
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { status: 1, createdAt: -1 }, name: 'status_created_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  content_versions: {
    indexes: [
      { key: { contentId: 1, versionNumber: 1 }, unique: true, name: 'content_version_unique' },
      { key: { contentId: 1 }, name: 'content_id_index' },
      { key: { editedBy: 1 }, name: 'edited_by_index' },
      { key: { editedAt: -1 }, name: 'edited_at_desc' }
    ]
  }
};

async function migrateCollections() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔄 Starting MongoDB collections migration...\n');
    console.log(`📦 Connecting to: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`📂 Database: ${DB_NAME}\n`);

    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    // Get existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = new Set(existingCollections.map(c => c.name));

    console.log('━'.repeat(60));
    console.log('📋 Creating Collections & Indexes\n');

    let createdCount = 0;
    let updatedCount = 0;

    for (const [collectionName, config] of Object.entries(COLLECTIONS)) {
      const exists = existingCollectionNames.has(collectionName);
      
      if (exists) {
        console.log(`📂 ${collectionName}:`);
        console.log(`   ℹ️  Collection already exists`);
        updatedCount++;
      } else {
        // Create collection (MongoDB creates collections on first insert, but we'll create it explicitly)
        await db.createCollection(collectionName);
        console.log(`📂 ${collectionName}:`);
        console.log(`   ✅ Collection created`);
        createdCount++;
      }

      // Create indexes
      const collection = db.collection(collectionName);
      const existingIndexes = await collection.indexes();
      const existingIndexNames = new Set(existingIndexes.map(idx => idx.name));

      for (const indexSpec of config.indexes) {
        if (existingIndexNames.has(indexSpec.name)) {
          console.log(`   ℹ️  Index '${indexSpec.name}' already exists`);
        } else {
          try {
            await collection.createIndex(indexSpec.key, {
              unique: indexSpec.unique || false,
              sparse: indexSpec.sparse || false,
              name: indexSpec.name
            });
            console.log(`   ✅ Index '${indexSpec.name}' created`);
          } catch (error: any) {
            console.log(`   ⚠️  Failed to create index '${indexSpec.name}': ${error.message}`);
          }
        }
      }
    }

    // Summary
    console.log('\n━'.repeat(60));
    console.log('📊 Migration Summary:\n');

    for (const collectionName of Object.keys(COLLECTIONS)) {
      const collection = db.collection(collectionName);
      const docCount = await collection.countDocuments();
      const indexes = await collection.indexes();
      console.log(`📂 ${collectionName}:`);
      console.log(`   Documents: ${docCount}`);
      console.log(`   Indexes: ${indexes.length}`);
    }

    console.log('\n━'.repeat(60));
    console.log(`✅ Migration completed!\n`);
    console.log(`   Created: ${createdCount} collections`);
    console.log(`   Updated: ${updatedCount} collections`);
    console.log(`   Total: ${Object.keys(COLLECTIONS).length} collections`);
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Connection closed\n');
  }
}

// Run migration
migrateCollections()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

