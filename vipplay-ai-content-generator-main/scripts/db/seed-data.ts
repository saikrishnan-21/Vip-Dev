/**
 * Database Seed Script
 * Populates MongoDB collections with sample data
 * 
 * Usage: pnpm tsx scripts/db/seed-data.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  config({ path: envPath });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:VipplayPass123@3.105.105.52:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'vipcontentai';

const defaultPassword = 'SecurePass123!';

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🌱 Starting database seeding...\n');
    console.log(`📦 Connecting to: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`📂 Database: ${DB_NAME}\n`);

    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const now = new Date();

    // 1. Seed Users
    console.log('━'.repeat(60));
    console.log('👥 Seeding Users\n');

    const usersData = [
      {
        email: 'admin@vipcontentai.com',
        passwordHash: hashedPassword,
        fullName: 'Super Admin',
        role: 'superadmin' as const,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: new Date(Date.now() - 86400000), // Yesterday
        preferences: {
          theme: 'system' as const,
          emailNotifications: true,
          defaultTone: 'Professional',
          defaultWordCount: 1500
        }
      },
      {
        email: 'demo@vipcontentai.com',
        passwordHash: hashedPassword,
        fullName: 'Demo User',
        role: 'user' as const,
        createdAt: new Date(Date.now() - 7 * 86400000), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 86400000),
        lastLoginAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
        preferences: {
          theme: 'dark' as const,
          emailNotifications: true,
          defaultTone: 'Casual',
          defaultWordCount: 1000
        }
      },
      {
        email: 'user@vipcontentai.com',
        passwordHash: hashedPassword,
        fullName: 'Test User',
        role: 'user' as const,
        createdAt: new Date(Date.now() - 3 * 86400000), // 3 days ago
        updatedAt: new Date(Date.now() - 1 * 86400000), // Yesterday
        preferences: {
          theme: 'light' as const,
          emailNotifications: false,
          defaultTone: 'Professional',
          defaultWordCount: 2000
        }
      }
    ];

    const userIds: Record<string, ObjectId> = {};
    for (const userData of usersData) {
      const existing = await db.collection('users').findOne({ email: userData.email });
      if (existing) {
        userIds[userData.email] = existing._id!;
        console.log(`   ℹ️  User ${userData.email} already exists`);
      } else {
        const result = await db.collection('users').insertOne(userData);
        userIds[userData.email] = result.insertedId;
        console.log(`   ✅ Created user: ${userData.email}`);
      }
    }

    const adminId = userIds['admin@vipcontentai.com'];
    const demoId = userIds['demo@vipcontentai.com'];
    const userId = userIds['user@vipcontentai.com'];

    // 2. Seed Sources
    console.log('\n━'.repeat(60));
    console.log('📰 Seeding Sources\n');

    const sourcesData = [
      {
        userId: demoId,
        type: 'rss' as const,
        name: 'TechCrunch RSS Feed',
        description: 'Latest technology news and startup coverage',
        status: 'active' as const,
        feedUrl: 'https://techcrunch.com/feed/',
        lastFetchedAt: new Date(Date.now() - 3600000), // 1 hour ago
        fetchFrequency: 60, // minutes
        articlesCount: 5,
        createdAt: new Date(Date.now() - 10 * 86400000),
        updatedAt: new Date(Date.now() - 3600000)
      },
      {
        userId: demoId,
        type: 'website' as const,
        name: 'ESPN Fantasy Football',
        description: 'Fantasy football news and analysis',
        status: 'active' as const,
        websiteUrl: 'https://www.espn.com/fantasy/football',
        crawlDepth: 2,
        articlesCount: 3,
        createdAt: new Date(Date.now() - 8 * 86400000),
        updatedAt: new Date(Date.now() - 7200000)
      },
      {
        userId: userId,
        type: 'topic' as const,
        name: 'Fantasy Football Strategies',
        description: 'Content about fantasy football draft strategies',
        status: 'active' as const,
        topicKeywords: ['fantasy football', 'draft strategy', 'waiver wire', 'lineup optimization'],
        articlesCount: 2,
        createdAt: new Date(Date.now() - 5 * 86400000),
        updatedAt: new Date(Date.now() - 86400000)
      },
      {
        userId: demoId,
        type: 'trends' as const,
        name: 'US Sports Trends',
        description: 'Trending sports topics in the US',
        status: 'active' as const,
        trendRegion: 'US',
        trendCategory: 'Sports',
        articlesCount: 4,
        createdAt: new Date(Date.now() - 6 * 86400000),
        updatedAt: new Date(Date.now() - 1800000)
      }
    ];

    const sourceIds: ObjectId[] = [];
    for (const sourceData of sourcesData) {
      const existing = await db.collection('sources').findOne({ 
        userId: sourceData.userId, 
        name: sourceData.name 
      });
      if (existing) {
        sourceIds.push(existing._id!);
        console.log(`   ℹ️  Source "${sourceData.name}" already exists`);
      } else {
        const result = await db.collection('sources').insertOne(sourceData);
        sourceIds.push(result.insertedId);
        console.log(`   ✅ Created source: ${sourceData.name}`);
      }
    }

    // 3. Seed Articles
    console.log('\n━'.repeat(60));
    console.log('📄 Seeding Articles\n');

    const articlesData = [
      {
        sourceId: sourceIds[0],
        userId: demoId,
        title: 'Top 10 Fantasy Football Draft Strategies for 2024',
        content: `Fantasy football season is upon us, and having the right draft strategy can make all the difference. Here are the top 10 strategies that will help you dominate your league.

1. **Zero RB Strategy**: Focus on wide receivers and tight ends early, then load up on running backs in later rounds.

2. **Hero RB Approach**: Draft one elite running back early, then focus on wide receivers.

3. **Late Round QB**: Wait on quarterback and stream based on matchups.

4. **Handcuff Your Studs**: Always draft the backup to your top running backs.

5. **Target High-Volume Receivers**: Prioritize targets over touchdowns.

6. **Stream Defenses**: Don't draft a defense early; stream based on matchups.

7. **Kicker Last**: Always draft your kicker in the final round.

8. **Monitor Injury Reports**: Stay updated on player injuries before draft day.

9. **Auction Draft Strategy**: Nominate players you don't want early to drain opponent budgets.

10. **Best Ball Approach**: Draft for ceiling, not floor, in best ball formats.`,
        summary: 'Comprehensive guide to fantasy football draft strategies for the 2024 season',
        url: 'https://example.com/fantasy-football-strategies',
        guid: 'article-001',
        author: 'John Smith',
        publishedAt: new Date(Date.now() - 2 * 86400000),
        fetchedAt: new Date(Date.now() - 2 * 86400000),
        imageUrl: 'https://example.com/images/fantasy-football.jpg',
        tags: ['fantasy football', 'draft strategy', '2024 season'],
        hasEmbedding: false,
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        sourceId: sourceIds[1],
        userId: demoId,
        title: 'Waiver Wire Pickups: Week 5 Recommendations',
        content: `Week 5 of the NFL season brings new opportunities on the waiver wire. Here are the top players to target:

**Running Backs:**
- Player A: Coming off a breakout game with 150+ yards
- Player B: Starter injured, now the lead back

**Wide Receivers:**
- Player C: Increased target share in recent weeks
- Player D: Favorable schedule ahead

**Tight Ends:**
- Player E: Emerging as red zone target

Make sure to prioritize based on your team needs and available FAAB budget.`,
        summary: 'Top waiver wire targets for Week 5 of the NFL season',
        url: 'https://example.com/waiver-wire-week5',
        guid: 'article-002',
        author: 'Jane Doe',
        publishedAt: new Date(Date.now() - 86400000),
        fetchedAt: new Date(Date.now() - 86400000),
        tags: ['waiver wire', 'week 5', 'pickups'],
        hasEmbedding: false,
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        sourceId: sourceIds[2],
        userId: userId,
        title: 'Understanding PPR vs Standard Scoring',
        content: `Point Per Reception (PPR) leagues have become increasingly popular. Here's what you need to know:

**Standard Scoring:**
- Rushing/Receiving Yards: 0.1 points per yard
- Touchdowns: 6 points
- Receptions: 0 points

**PPR Scoring:**
- Rushing/Receiving Yards: 0.1 points per yard
- Touchdowns: 6 points
- Receptions: 1 point each

This changes player values significantly. Slot receivers and pass-catching running backs become much more valuable in PPR formats.`,
        summary: 'Guide to understanding the differences between PPR and standard scoring',
        url: 'https://example.com/ppr-vs-standard',
        guid: 'article-003',
        author: 'Mike Johnson',
        publishedAt: new Date(Date.now() - 3 * 86400000),
        fetchedAt: new Date(Date.now() - 3 * 86400000),
        tags: ['PPR', 'scoring', 'fantasy football basics'],
        hasEmbedding: false,
        createdAt: new Date(Date.now() - 3 * 86400000)
      }
    ];

    const articleIds: ObjectId[] = [];
    for (const articleData of articlesData) {
      const existing = await db.collection('articles').findOne({ guid: articleData.guid });
      if (existing) {
        articleIds.push(existing._id!);
        console.log(`   ℹ️  Article "${articleData.title}" already exists`);
      } else {
        const result = await db.collection('articles').insertOne(articleData);
        articleIds.push(result.insertedId);
        console.log(`   ✅ Created article: ${articleData.title.substring(0, 50)}...`);
      }
    }

    // 4. Seed Generated Content
    console.log('\n━'.repeat(60));
    console.log('✍️  Seeding Generated Content\n');

    const contentData = [
      {
        userId: demoId,
        title: 'Complete Guide to Fantasy Football Draft Day',
        content: `# Complete Guide to Fantasy Football Draft Day

Fantasy football draft day is one of the most exciting days of the year for fantasy managers. This comprehensive guide will help you prepare and execute a winning draft strategy.

## Pre-Draft Preparation

Before draft day, you need to:
1. Research player rankings and ADP (Average Draft Position)
2. Mock draft extensively
3. Understand your league's scoring system
4. Identify sleepers and breakout candidates
5. Monitor injury reports and training camp news

## Draft Strategy

Your draft strategy should adapt based on:
- Your draft position
- League scoring format (PPR, Standard, etc.)
- League size and roster requirements
- Your risk tolerance

## Key Positions

**Quarterback**: Wait until later rounds unless you can get a top-3 option.

**Running Back**: Still the most valuable position, but depth is key.

**Wide Receiver**: Deep position with many viable options.

**Tight End**: Consider early if you can get Kelce or Andrews, otherwise wait.

## Post-Draft

After your draft:
- Review your roster for balance
- Identify potential waiver wire targets
- Set your Week 1 lineup early
- Monitor news and updates`,
        summary: 'A comprehensive guide to preparing for and executing a successful fantasy football draft',
        status: 'approved' as const,
        version: 1,
        sourceType: 'topic' as const,
        sourceData: {
          topic: 'Fantasy Football Draft Strategies',
          keywords: ['draft', 'fantasy football', 'strategy']
        },
        seoScore: 85,
        readabilityScore: 72,
        keywords: ['fantasy football', 'draft strategy', 'fantasy draft', 'draft day'],
        metaDescription: 'Complete guide to fantasy football draft day with strategies, tips, and best practices for winning your league',
        createdAt: new Date(Date.now() - 5 * 86400000),
        updatedAt: new Date(Date.now() - 4 * 86400000),
        createdBy: demoId,
        lastEditedBy: demoId
      },
      {
        userId: userId,
        title: 'Week 5 Waiver Wire Targets',
        content: `# Week 5 Waiver Wire Targets

The NFL season is in full swing, and Week 5 brings new opportunities on the waiver wire. Here are the top targets to consider:

## Running Backs

**Player A** - With the starter injured, Player A is now the lead back and should see 15+ touches per game.

**Player B** - Coming off a breakout performance, Player B has earned more playing time.

## Wide Receivers

**Player C** - Increased target share makes Player C a viable flex option.

**Player D** - Favorable schedule ahead and emerging chemistry with quarterback.

## Tight Ends

**Player E** - Becoming a red zone favorite and seeing increased targets.

## Priority Order

1. Player A (if starter is out long-term)
2. Player C (consistent targets)
3. Player B (high upside)
4. Player D (schedule play)
5. Player E (streaming option)`,
        summary: 'Top waiver wire targets for Week 5 of the NFL season',
        status: 'draft' as const,
        version: 1,
        sourceType: 'trends' as const,
        sourceData: {
          trend: 'Week 5 Waiver Wire',
          region: 'US'
        },
        seoScore: 78,
        readabilityScore: 68,
        keywords: ['waiver wire', 'week 5', 'fantasy football', 'pickups'],
        createdAt: new Date(Date.now() - 2 * 86400000),
        updatedAt: new Date(Date.now() - 2 * 86400000),
        createdBy: userId,
        lastEditedBy: userId
      }
    ];

    const contentIds: ObjectId[] = [];
    for (const content of contentData) {
      const existing = await db.collection('generated_content').findOne({ 
        userId: content.userId, 
        title: content.title 
      });
      if (existing) {
        contentIds.push(existing._id!);
        console.log(`   ℹ️  Content "${content.title}" already exists`);
      } else {
        const result = await db.collection('generated_content').insertOne(content);
        contentIds.push(result.insertedId);
        console.log(`   ✅ Created content: ${content.title.substring(0, 50)}...`);
      }
    }

    // 5. Seed Media
    console.log('\n━'.repeat(60));
    console.log('🖼️  Seeding Media\n');

    const mediaData = [
      {
        userId: demoId,
        filename: 'fantasy-football-draft.jpg',
        originalName: 'fantasy-football-draft.jpg',
        mimeType: 'image/jpeg',
        size: 245760,
        type: 'image' as const,
        source: 'upload' as const,
        url: 'https://example.com/media/fantasy-football-draft.jpg',
        thumbnailUrl: 'https://example.com/media/thumbs/fantasy-football-draft.jpg',
        width: 1920,
        height: 1080,
        tags: ['fantasy football', 'draft', 'sports'],
        category: 'sports',
        altText: 'Fantasy football draft strategy illustration',
        caption: 'Visual guide to fantasy football draft strategies',
        usedInContent: [contentIds[0]],
        usageCount: 1,
        createdAt: new Date(Date.now() - 5 * 86400000),
        updatedAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        userId: userId,
        filename: 'waiver-wire-chart.png',
        originalName: 'waiver-wire-chart.png',
        mimeType: 'image/png',
        size: 128432,
        type: 'image' as const,
        source: 'ai_generated' as const,
        url: 'https://example.com/media/waiver-wire-chart.png',
        width: 1200,
        height: 800,
        tags: ['waiver wire', 'chart', 'fantasy football'],
        category: 'sports',
        altText: 'Week 5 waiver wire priority chart',
        generationPrompt: 'Create a chart showing waiver wire priorities for Week 5',
        generationModel: 'dall-e-3',
        usedInContent: [contentIds[1]],
        usageCount: 1,
        createdAt: new Date(Date.now() - 2 * 86400000),
        updatedAt: new Date(Date.now() - 2 * 86400000)
      }
    ];

    const mediaIds: ObjectId[] = [];
    for (const media of mediaData) {
      const existing = await db.collection('media').findOne({ 
        userId: media.userId, 
        filename: media.filename 
      });
      if (existing) {
        mediaIds.push(existing._id!);
        console.log(`   ℹ️  Media "${media.filename}" already exists`);
      } else {
        const result = await db.collection('media').insertOne(media);
        mediaIds.push(result.insertedId);
        console.log(`   ✅ Created media: ${media.filename}`);
      }
    }

    // 6. Seed AI Configurations
    console.log('\n━'.repeat(60));
    console.log('⚙️  Seeding AI Configurations\n');

    const aiConfigs = [
      {
        key: 'default_generation_model',
        value: 'llama3.1:8b',
        description: 'Default model for content generation',
        category: 'models' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      },
      {
        key: 'default_embedding_model',
        value: 'nomic-embed-text',
        description: 'Default model for generating embeddings',
        category: 'models' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      },
      {
        key: 'quality_generation_model',
        value: 'llama3.1:70b',
        description: 'High-quality model for premium content generation',
        category: 'models' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      },
      {
        key: 'max_generation_tokens',
        value: 4096,
        description: 'Maximum tokens for content generation',
        category: 'limits' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      },
      {
        key: 'generation_temperature',
        value: 0.7,
        description: 'Default temperature for content generation',
        category: 'performance' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      },
      {
        key: 'max_concurrent_jobs',
        value: 5,
        description: 'Maximum concurrent generation jobs per user',
        category: 'limits' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      }
    ];

    for (const config of aiConfigs) {
      const existing = await db.collection('ai_configurations').findOne({ key: config.key });
      if (existing) {
        console.log(`   ℹ️  Config "${config.key}" already exists`);
      } else {
        await db.collection('ai_configurations').insertOne(config);
        console.log(`   ✅ Created config: ${config.key}`);
      }
    }

    // 7. Seed Model Groups
    console.log('\n━'.repeat(60));
    console.log('🤖 Seeding Model Groups\n');

    const modelGroups = [
      {
        name: 'default_generation',
        description: 'Default model group for content generation',
        models: ['llama3.1:8b'],
        routingStrategy: 'round-robin' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      },
      {
        name: 'quality_generation',
        description: 'High-quality model group for premium content',
        models: ['llama3.1:70b', 'llama3.1:8b'],
        routingStrategy: 'priority' as const,
        priority: [1, 2],
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      },
      {
        name: 'fast_generation',
        description: 'Fast model group for quick content generation',
        models: ['llama3.1:8b'],
        routingStrategy: 'least-load' as const,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        createdBy: adminId
      }
    ];

    for (const group of modelGroups) {
      const existing = await db.collection('model_groups').findOne({ name: group.name });
      if (existing) {
        console.log(`   ℹ️  Model group "${group.name}" already exists`);
      } else {
        await db.collection('model_groups').insertOne(group);
        console.log(`   ✅ Created model group: ${group.name}`);
      }
    }

    // 8. Seed Generation Jobs
    console.log('\n━'.repeat(60));
    console.log('⚡ Seeding Generation Jobs\n');

    const generationJobs = [
      {
        userId: demoId,
        status: 'completed' as const,
        type: 'single' as const,
        settings: {
          topic: 'Fantasy Football Draft Strategies',
          wordCount: 1500,
          tone: 'Professional'
        },
        progress: 100,
        results: [contentIds[0]],
        createdAt: new Date(Date.now() - 5 * 86400000),
        startedAt: new Date(Date.now() - 5 * 86400000 + 1000),
        completedAt: new Date(Date.now() - 5 * 86400000 + 30000)
      },
      {
        userId: userId,
        status: 'processing' as const,
        type: 'single' as const,
        settings: {
          topic: 'Week 6 Waiver Wire',
          wordCount: 1000,
          tone: 'Casual'
        },
        progress: 65,
        createdAt: new Date(Date.now() - 3600000),
        startedAt: new Date(Date.now() - 3000000)
      }
    ];

    for (const job of generationJobs) {
      const existing = await db.collection('generation_jobs').findOne({ 
        userId: job.userId, 
        createdAt: job.createdAt 
      });
      if (existing) {
        console.log(`   ℹ️  Generation job already exists`);
      } else {
        await db.collection('generation_jobs').insertOne(job);
        console.log(`   ✅ Created generation job: ${job.status}`);
      }
    }

    // 9. Seed Export Jobs
    console.log('\n━'.repeat(60));
    console.log('📤 Seeding Export Jobs\n');

    const exportJobs = [
      {
        userId: demoId,
        contentId: contentIds[0],
        format: 'markdown' as const,
        status: 'completed' as const,
        fileUrl: 'https://example.com/exports/content-001.md',
        filename: 'fantasy-football-draft-guide.md',
        fileSize: 45678,
        createdAt: new Date(Date.now() - 4 * 86400000),
        completedAt: new Date(Date.now() - 4 * 86400000 + 5000)
      },
      {
        userId: userId,
        contentId: contentIds[1],
        format: 'pdf' as const,
        status: 'processing' as const,
        createdAt: new Date(Date.now() - 1800000)
      }
    ];

    for (const job of exportJobs) {
      const existing = await db.collection('export_jobs').findOne({ 
        userId: job.userId, 
        contentId: job.contentId,
        format: job.format
      });
      if (existing) {
        console.log(`   ℹ️  Export job already exists`);
      } else {
        await db.collection('export_jobs').insertOne(job);
        console.log(`   ✅ Created export job: ${job.format} (${job.status})`);
      }
    }

    // 10. Seed Notification Settings
    console.log('\n━'.repeat(60));
    console.log('🔔 Seeding Notification Settings\n');

    const notificationSettings = [
      {
        userId: demoId,
        email: 'demo@vipcontentai.com',
        emailVerified: true,
        preferences: {
          contentGenerated: true,
          contentApproved: true,
          contentPublished: true,
          exportCompleted: true,
          weeklyDigest: true
        },
        createdAt: new Date(Date.now() - 7 * 86400000),
        updatedAt: new Date(Date.now() - 1 * 86400000)
      },
      {
        userId: userId,
        email: 'user@vipcontentai.com',
        emailVerified: false,
        preferences: {
          contentGenerated: true,
          contentApproved: false,
          contentPublished: false,
          exportCompleted: true,
          weeklyDigest: false
        },
        createdAt: new Date(Date.now() - 3 * 86400000),
        updatedAt: new Date(Date.now() - 3 * 86400000)
      }
    ];

    for (const settings of notificationSettings) {
      const existing = await db.collection('notification_settings').findOne({ 
        userId: settings.userId 
      });
      if (existing) {
        console.log(`   ℹ️  Notification settings for user already exist`);
      } else {
        await db.collection('notification_settings').insertOne(settings);
        console.log(`   ✅ Created notification settings for ${settings.email}`);
      }
    }

    // 11. Seed Notifications
    console.log('\n━'.repeat(60));
    console.log('📬 Seeding Notifications\n');

    const notifications = [
      {
        userId: demoId,
        type: 'success' as const,
        title: 'Content Generated Successfully',
        message: 'Your article "Complete Guide to Fantasy Football Draft Day" has been generated.',
        read: false,
        link: `/content/${contentIds[0]}`,
        createdAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        userId: demoId,
        type: 'info' as const,
        title: 'Export Completed',
        message: 'Your markdown export is ready for download.',
        read: true,
        link: '/exports',
        createdAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        userId: userId,
        type: 'warning' as const,
        title: 'Content Generation In Progress',
        message: 'Your content generation job is 65% complete.',
        read: false,
        link: '/jobs',
        createdAt: new Date(Date.now() - 3600000)
      }
    ];

    for (const notification of notifications) {
      const existing = await db.collection('notifications').findOne({ 
        userId: notification.userId, 
        message: notification.message 
      });
      if (existing) {
        console.log(`   ℹ️  Notification already exists`);
      } else {
        await db.collection('notifications').insertOne(notification);
        console.log(`   ✅ Created notification: ${notification.title}`);
      }
    }

    // 12. Seed Email Notifications
    console.log('\n━'.repeat(60));
    console.log('📧 Seeding Email Notifications\n');

    const emailNotifications = [
      {
        userId: demoId,
        email: 'demo@vipcontentai.com',
        subject: 'Your content has been generated',
        template: 'content_generated',
        data: {
          contentTitle: 'Complete Guide to Fantasy Football Draft Day',
          contentId: contentIds[0].toString()
        },
        status: 'sent' as const,
        sentAt: new Date(Date.now() - 5 * 86400000),
        createdAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        userId: userId,
        email: 'user@vipcontentai.com',
        subject: 'Content generation in progress',
        template: 'generation_progress',
        data: {
          progress: 65,
          jobId: 'job-123'
        },
        status: 'pending' as const,
        createdAt: new Date(Date.now() - 1800000)
      }
    ];

    for (const email of emailNotifications) {
      const existing = await db.collection('email_notifications').findOne({ 
        userId: email.userId, 
        subject: email.subject,
        createdAt: email.createdAt
      });
      if (existing) {
        console.log(`   ℹ️  Email notification already exists`);
      } else {
        await db.collection('email_notifications').insertOne(email);
        console.log(`   ✅ Created email notification: ${email.subject}`);
      }
    }

    // 13. Seed Content Versions
    console.log('\n━'.repeat(60));
    console.log('📝 Seeding Content Versions\n');

    const contentVersions = [
      {
        contentId: contentIds[0],
        versionNumber: 1,
        content: contentData[0].content,
        editedBy: demoId,
        editedAt: new Date(Date.now() - 4 * 86400000),
        changes: 'Initial version created'
      }
    ];

    for (const version of contentVersions) {
      const existing = await db.collection('content_versions').findOne({ 
        contentId: version.contentId, 
        versionNumber: version.versionNumber 
      });
      if (existing) {
        console.log(`   ℹ️  Content version already exists`);
      } else {
        await db.collection('content_versions').insertOne(version);
        console.log(`   ✅ Created content version: v${version.versionNumber}`);
      }
    }

    // Summary
    console.log('\n━'.repeat(60));
    console.log('📊 Seeding Summary:\n');

    const collections = [
      'users', 'sources', 'articles', 'generated_content', 'media',
      'ai_configurations', 'model_groups', 'generation_jobs', 'export_jobs',
      'notification_settings', 'notifications', 'email_notifications', 'content_versions'
    ];

    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`📂 ${collectionName}: ${count} documents`);
    }

    console.log('\n━'.repeat(60));
    console.log('✅ Database seeding completed successfully!\n');
    console.log('🔑 Default Login Credentials:');
    console.log('   Admin: admin@vipcontentai.com / SecurePass123!');
    console.log('   Demo:  demo@vipcontentai.com / SecurePass123!');
    console.log('   User:  user@vipcontentai.com / SecurePass123!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
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

// Run seeding
seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

