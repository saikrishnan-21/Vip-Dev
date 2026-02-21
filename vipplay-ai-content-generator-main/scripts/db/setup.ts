/**
 * Unified Database Setup Script
 * VIP-10702: Database Migrations & Seeding
 * 
 * This script combines migration and seeding into a single idempotent operation.
 * It creates collections, indexes, and seeds initial data safely.
 * 
 * Usage: pnpm db:setup
 */

import { MongoClient, Db, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'vipcontentai';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is required. Please set it in .env.local');
  process.exit(1);
}

// Collection schemas with validation
const COLLECTIONS = {
  users: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'password', 'fullName', 'role', 'createdAt'],
        properties: {
          email: {
            bsonType: 'string',
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            description: 'must be a valid email address'
          },
          password: {
            bsonType: 'string',
            description: 'bcrypt hashed password'
          },
          fullName: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'user full name'
          },
          role: {
            enum: ['superadmin', 'admin', 'editor', 'user'],
            description: 'user role'
          },
          createdAt: {
            bsonType: 'date',
            description: 'account creation timestamp'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'last update timestamp'
          },
          preferences: {
            bsonType: 'object',
            properties: {
              theme: {
                enum: ['light', 'dark', 'system'],
                description: 'UI theme preference'
              },
              emailNotifications: {
                bsonType: 'bool',
                description: 'email notification preference'
              },
              defaultTone: {
                bsonType: 'string',
                description: 'default content tone'
              },
              defaultWordCount: {
                bsonType: 'int',
                minimum: 100,
                maximum: 5000,
                description: 'default word count for generation'
              }
            }
          }
        }
      }
    },
    indexes: [
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { role: 1 }, name: 'role_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  sources: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['type', 'name', 'status', 'createdAt'],
        properties: {
          type: {
            enum: ['rss', 'website', 'topic', 'trend'],
            description: 'source type'
          },
          name: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'source name'
          },
          url: {
            bsonType: 'string',
            description: 'source URL (for rss/website types)'
          },
          description: {
            bsonType: 'string',
            description: 'source description'
          },
          status: {
            enum: ['active', 'paused', 'error'],
            description: 'source status'
          },
          keywords: {
            bsonType: 'array',
            items: { bsonType: 'string' },
            description: 'keywords for topic/trend sources'
          },
          settings: {
            bsonType: 'object',
            description: 'source-specific settings'
          },
          userId: {
            bsonType: 'objectId',
            description: 'reference to users collection'
          },
          createdAt: {
            bsonType: 'date',
            description: 'source creation timestamp'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'last update timestamp'
          }
        }
      }
    },
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { type: 1, status: 1 }, name: 'type_status_index' },
      { key: { name: 1 }, name: 'name_index' },
      { key: { url: 1 }, sparse: true, name: 'url_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  articles: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['title', 'content', 'capturedAt'],
        properties: {
          title: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 500,
            description: 'article title'
          },
          content: {
            bsonType: 'string',
            description: 'article content'
          },
          summary: {
            bsonType: 'string',
            description: 'article summary'
          },
          sourceId: {
            bsonType: 'objectId',
            description: 'reference to sources collection'
          },
          userId: {
            bsonType: 'objectId',
            description: 'reference to users collection'
          },
          url: {
            bsonType: 'string',
            description: 'original article URL'
          },
          author: {
            bsonType: 'string',
            description: 'article author'
          },
          publishedAt: {
            bsonType: 'date',
            description: 'original publication date'
          },
          capturedAt: {
            bsonType: 'date',
            description: 'when article was captured'
          },
          keywords: {
            bsonType: 'array',
            items: { bsonType: 'string' },
            description: 'article keywords'
          },
          metadata: {
            bsonType: 'object',
            description: 'additional metadata'
          },
          embedding: {
            bsonType: 'array',
            description: 'vector embedding for similarity search'
          }
        }
      }
    },
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { sourceId: 1 }, name: 'source_id_index' },
      { key: { keywords: 1 }, name: 'keywords_index' },
      { key: { publishedAt: -1 }, name: 'published_at_desc' },
      { key: { capturedAt: -1 }, name: 'captured_at_desc' },
      { key: { title: 'text', content: 'text' }, name: 'text_search_index' }
    ]
  },

  generated_content: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['title', 'content', 'userId', 'generatedAt', 'status'],
        properties: {
          title: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 500,
            description: 'content title'
          },
          content: {
            bsonType: 'string',
            description: 'generated content'
          },
          userId: {
            bsonType: 'objectId',
            description: 'reference to users collection'
          },
          generatedAt: {
            bsonType: 'date',
            description: 'generation timestamp'
          },
          status: {
            enum: ['pending', 'approved', 'rejected', 'published'],
            description: 'content status'
          },
          metadata: {
            bsonType: 'object',
            properties: {
              topic: { bsonType: 'string' },
              wordCount: { bsonType: 'int' },
              tone: { bsonType: 'string' },
              model: { bsonType: 'string' },
              sourceType: { bsonType: 'string' }
            },
            description: 'generation metadata'
          },
          seoAnalysis: {
            bsonType: 'object',
            properties: {
              score: { bsonType: 'int' },
              keywordDensity: { bsonType: 'double' },
              readabilityScore: { bsonType: 'int' },
              suggestions: {
                bsonType: 'array',
                items: { bsonType: 'string' }
              }
            },
            description: 'SEO analysis results'
          },
          rejectionReason: {
            bsonType: 'string',
            description: 'reason for rejection (if status is rejected)'
          },
          approvedAt: {
            bsonType: 'date',
            description: 'approval timestamp'
          },
          publishedAt: {
            bsonType: 'date',
            description: 'publication timestamp'
          },
          scheduledFor: {
            bsonType: 'date',
            description: 'scheduled publication date'
          },
          createdAt: {
            bsonType: 'date',
            description: 'creation timestamp'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'last update timestamp'
          }
        }
      }
    },
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { status: 1, userId: 1 }, name: 'status_user_index' },
      { key: { generatedAt: -1 }, name: 'generated_at_desc' },
      { key: { 'metadata.topic': 1 }, name: 'topic_index' },
      { key: { 'metadata.sourceType': 1 }, name: 'source_type_index' },
      { key: { publishedAt: -1 }, sparse: true, name: 'published_at_desc' },
      { key: { scheduledFor: 1 }, sparse: true, name: 'scheduled_for_index' },
      { key: { title: 'text', content: 'text', keywords: 'text' }, name: 'text_search_index' }
    ]
  },

  media: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['filename', 'mimeType', 'size', 'url', 'type', 'userId', 'status', 'createdAt'],
        properties: {
          filename: {
            bsonType: 'string',
            description: 'stored filename'
          },
          originalName: {
            bsonType: 'string',
            description: 'original filename'
          },
          mimeType: {
            bsonType: 'string',
            description: 'file MIME type'
          },
          size: {
            bsonType: 'int',
            minimum: 0,
            description: 'file size in bytes'
          },
          url: {
            bsonType: 'string',
            description: 'file URL'
          },
          type: {
            enum: ['image', 'video', 'audio'],
            description: 'media type'
          },
          userId: {
            bsonType: 'objectId',
            description: 'reference to users collection'
          },
          tags: {
            bsonType: 'array',
            items: { bsonType: 'string' },
            description: 'media tags'
          },
          metadata: {
            bsonType: 'object',
            description: 'media metadata (width, height, duration, etc.)'
          },
          status: {
            enum: ['active', 'archived', 'deleted'],
            description: 'media status'
          },
          createdAt: {
            bsonType: 'date',
            description: 'creation timestamp'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'last update timestamp'
          }
        }
      }
    },
    indexes: [
      { key: { userId: 1, createdAt: -1 }, name: 'user_created_at_index' },
      { key: { tags: 1 }, name: 'tags_index' },
      { key: { type: 1 }, name: 'type_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { filename: 'text', originalName: 'text', tags: 'text' }, name: 'text_search_index' }
    ]
  },

  notifications: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'type', 'message', 'read', 'createdAt'],
        properties: {
          userId: {
            bsonType: 'objectId',
            description: 'reference to users collection'
          },
          type: {
            enum: ['info', 'success', 'warning', 'error'],
            description: 'notification type'
          },
          message: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 500,
            description: 'notification message'
          },
          read: {
            bsonType: 'bool',
            description: 'read status'
          },
          link: {
            bsonType: 'string',
            description: 'optional link'
          },
          metadata: {
            bsonType: 'object',
            description: 'additional metadata'
          },
          createdAt: {
            bsonType: 'date',
            description: 'creation timestamp'
          }
        }
      }
    },
    indexes: [
      { key: { userId: 1, read: 1 }, name: 'user_read_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' },
      { key: { type: 1 }, name: 'type_index' }
    ]
  },

  generation_jobs: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'status', 'createdAt'],
        properties: {
          userId: {
            bsonType: 'objectId',
            description: 'reference to users collection'
          },
          status: {
            enum: ['pending', 'processing', 'completed', 'failed'],
            description: 'job status'
          },
          type: {
            enum: ['single', 'bulk'],
            description: 'job type'
          },
          settings: {
            bsonType: 'object',
            description: 'generation settings'
          },
          progress: {
            bsonType: 'int',
            minimum: 0,
            maximum: 100,
            description: 'completion percentage'
          },
          results: {
            bsonType: 'array',
            items: { bsonType: 'objectId' },
            description: 'generated content IDs'
          },
          error: {
            bsonType: 'string',
            description: 'error message if failed'
          },
          createdAt: {
            bsonType: 'date',
            description: 'job creation timestamp'
          },
          startedAt: {
            bsonType: 'date',
            description: 'job start timestamp'
          },
          completedAt: {
            bsonType: 'date',
            description: 'job completion timestamp'
          }
        }
      }
    },
    indexes: [
      { key: { userId: 1, status: 1 }, name: 'user_status_index' },
      { key: { status: 1 }, name: 'status_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc' }
    ]
  },

  ai_configurations: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['key', 'value', 'category', 'isActive', 'createdAt'],
        properties: {
          key: {
            bsonType: 'string',
            description: 'configuration key'
          },
          value: {
            bsonType: ['string', 'int', 'double', 'bool'],
            description: 'configuration value'
          },
          description: {
            bsonType: 'string',
            description: 'configuration description'
          },
          category: {
            bsonType: 'string',
            description: 'configuration category'
          },
          isActive: {
            bsonType: 'bool',
            description: 'whether configuration is active'
          },
          createdAt: {
            bsonType: 'date',
            description: 'creation timestamp'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'last update timestamp'
          },
          createdBy: {
            bsonType: 'objectId',
            description: 'reference to users collection'
          }
        }
      }
    },
    indexes: [
      { key: { key: 1 }, unique: true, name: 'key_unique' },
      { key: { category: 1 }, name: 'category_index' },
      { key: { isActive: 1 }, name: 'is_active_index' }
    ]
  },

  model_groups: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['name', 'models', 'routingStrategy', 'isActive', 'createdAt'],
        properties: {
          name: {
            bsonType: 'string',
            description: 'model group name'
          },
          description: {
            bsonType: 'string',
            description: 'model group description'
          },
          models: {
            bsonType: 'array',
            items: { bsonType: 'string' },
            description: 'list of model names'
          },
          routingStrategy: {
            enum: ['fallback', 'round-robin', 'weighted', 'majority-judge'],
            description: 'routing strategy'
          },
          isActive: {
            bsonType: 'bool',
            description: 'whether group is active'
          },
          createdAt: {
            bsonType: 'date',
            description: 'creation timestamp'
          },
          updatedAt: {
            bsonType: 'date',
            description: 'last update timestamp'
          },
          createdBy: {
            bsonType: 'objectId',
            description: 'reference to users collection'
          }
        }
      }
    },
    indexes: [
      { key: { name: 1 }, unique: true, name: 'name_unique' },
      { key: { isActive: 1 }, name: 'is_active_index' }
    ]
  }
};

// Seed data
const SEED_DATA = {
  users: [
    {
      email: 'admin@vipcontentai.com',
      password: '', // Will be hashed
      fullName: 'Super Admin',
      role: 'superadmin',
      preferences: {
        theme: 'system',
        emailNotifications: true,
        defaultTone: 'Professional',
        defaultWordCount: 1500
      }
    },
    {
      email: 'demo@vipcontentai.com',
      password: '', // Will be hashed
      fullName: 'Demo User',
      role: 'user',
      preferences: {
        theme: 'dark',
        emailNotifications: true,
        defaultTone: 'Casual',
        defaultWordCount: 1000
      }
    },
    {
      email: 'user@vipcontentai.com',
      password: '', // Will be hashed
      fullName: 'Test User',
      role: 'user',
      preferences: {
        theme: 'system',
        emailNotifications: true,
        defaultTone: 'Professional',
        defaultWordCount: 1500
      }
    }
  ],
  ai_configurations: [
    {
      key: 'default_generation_model',
      value: 'llama3.1:8b',
      description: 'Default model for content generation',
      category: 'models',
      isActive: true
    },
    {
      key: 'default_embedding_model',
      value: 'nomic-embed-text',
      description: 'Default model for embeddings',
      category: 'models',
      isActive: true
    },
    {
      key: 'max_generation_tokens',
      value: 4096,
      description: 'Maximum tokens for content generation',
      category: 'limits',
      isActive: true
    },
    {
      key: 'generation_temperature',
      value: 0.7,
      description: 'Default temperature for generation',
      category: 'performance',
      isActive: true
    },
    {
      key: 'max_concurrent_jobs',
      value: 5,
      description: 'Maximum concurrent generation jobs per user',
      category: 'limits',
      isActive: true
    }
  ],
  model_groups: [
    {
      name: 'default_generation',
      description: 'Default model group for content generation',
      models: ['llama3.1:8b'],
      routingStrategy: 'round-robin',
      isActive: true
    }
  ]
};

async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔄 Starting database setup...\n');
    console.log(`📦 Connecting to MongoDB: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`📂 Database: ${DB_NAME}\n`);

    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    // Phase 1: Create/Update Collections
    console.log('━'.repeat(60));
    console.log('📋 Phase 1: Creating/Updating Collections\n');
    
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(c => c.name);

    for (const [collectionName, schema] of Object.entries(COLLECTIONS)) {
      console.log(`📂 Processing: ${collectionName}`);

      if (existingCollectionNames.includes(collectionName)) {
        console.log(`   ℹ️  Collection exists, updating schema...`);
        try {
          await db.command({
            collMod: collectionName,
            validator: schema.validator,
            validationLevel: 'moderate',
            validationAction: 'warn'
          });
          console.log(`   ✅ Schema updated`);
        } catch (error: any) {
          console.log(`   ⚠️  Could not update schema: ${error.message}`);
        }
      } else {
        console.log(`   ➕ Creating collection...`);
        await db.createCollection(collectionName, {
          validator: schema.validator,
          validationLevel: 'moderate',
          validationAction: 'warn'
        });
        console.log(`   ✅ Collection created`);
      }
    }

    // Phase 2: Create Indexes
    console.log('\n━'.repeat(60));
    console.log('🔍 Phase 2: Creating Indexes\n');

    for (const [collectionName, schema] of Object.entries(COLLECTIONS)) {
      const collection = db.collection(collectionName);
      console.log(`📂 ${collectionName}:`);

      for (const indexSpec of schema.indexes) {
        try {
          await collection.createIndex(indexSpec.key, {
            unique: indexSpec.unique || false,
            sparse: indexSpec.sparse || false,
            name: indexSpec.name
          });
          console.log(`   ✓ ${indexSpec.name}`);
        } catch (error: any) {
          if (error.code === 85 || error.code === 86) {
            console.log(`   ℹ️  ${indexSpec.name} (already exists)`);
          } else {
            console.log(`   ⚠️  ${indexSpec.name}: ${error.message}`);
          }
        }
      }
    }

    // Phase 3: Seed Data (Idempotent)
    console.log('\n━'.repeat(60));
    console.log('🌱 Phase 3: Seeding Data (Idempotent)\n');

    // Seed Users
    console.log('👥 Seeding users...');
    const defaultPassword = 'SecurePass123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    for (const userData of SEED_DATA.users) {
      const existingUser = await db.collection('users').findOne({ email: userData.email });
      if (existingUser) {
        console.log(`   ℹ️  User ${userData.email} already exists, skipping`);
        continue;
      }

      const user = {
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').insertOne(user);
      console.log(`   ✅ Created user: ${userData.email}`);
    }

    // Get admin user ID for references
    const adminUser = await db.collection('users').findOne({ email: 'admin@vipcontentai.com' });
    const adminUserId = adminUser?._id || new ObjectId();

    // Seed AI Configurations
    console.log('\n⚙️  Seeding AI configurations...');
    for (const configData of SEED_DATA.ai_configurations) {
      const existing = await db.collection('ai_configurations').findOne({ key: configData.key });
      if (existing) {
        console.log(`   ℹ️  Config ${configData.key} already exists, skipping`);
        continue;
      }

      const config = {
        ...configData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminUserId
      };

      await db.collection('ai_configurations').insertOne(config);
      console.log(`   ✅ Created config: ${configData.key}`);
    }

    // Seed Model Groups
    console.log('\n🤖 Seeding model groups...');
    for (const groupData of SEED_DATA.model_groups) {
      const existing = await db.collection('model_groups').findOne({ name: groupData.name });
      if (existing) {
        console.log(`   ℹ️  Model group ${groupData.name} already exists, skipping`);
        continue;
      }

      const group = {
        ...groupData,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: adminUserId
      };

      await db.collection('model_groups').insertOne(group);
      console.log(`   ✅ Created model group: ${groupData.name}`);
    }

    // Summary
    console.log('\n━'.repeat(60));
    console.log('📊 Setup Summary:\n');

    for (const collectionName of Object.keys(COLLECTIONS)) {
      const collection = db.collection(collectionName);
      const docCount = await collection.countDocuments();
      const indexes = await collection.indexes();
      console.log(`📂 ${collectionName}:`);
      console.log(`   Documents: ${docCount}`);
      console.log(`   Indexes: ${indexes.length}`);
    }

    console.log('\n━'.repeat(60));
    console.log('✅ Database setup completed successfully!\n');
    console.log('🔑 Default Login Credentials:');
    console.log('   Admin: admin@vipcontentai.com / SecurePass123!');
    console.log('   Demo:  demo@vipcontentai.com / SecurePass123!');
    console.log('   User:  user@vipcontentai.com / SecurePass123!');
    console.log('\n📍 Next Steps:');
    console.log('   1. Start Next.js: pnpm dev');
    console.log('   2. Start FastAPI: cd api-service && uvicorn main:app --reload');
    console.log('   3. Visit http://localhost:3000');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Connection closed\n');
  }
}

// Run setup
setupDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });

