/**
 * Database Cleanup Script for Test Data
 * Removes test users, sources, articles, content, and media created during E2E tests
 * 
 * Usage: node tests/e2e/cleanup-database.js
 * 
 * Test email pattern: {prefix}-{timestamp}-{random}@vipcontentai.com
 * Example: test-1234567890-abc123@vipcontentai.com
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:VipplayPass123@3.105.105.52:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'vipcontentai';

// Test email pattern: prefix-timestamp-random@vipcontentai.com
// Matches: test-*, *test*, or any email with test prefix
const TEST_EMAIL_REGEX = /^[a-z]+-\d+-[a-z0-9]+@vipcontentai\.com$/i;

async function cleanupTestData() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db(DB_NAME);
        let totalDeleted = 0;
        
        // 1. Clean test users (emails matching test pattern)
        console.log('\n📧 Cleaning test users...');
        const usersResult = await db.collection('users').deleteMany({
            email: { $regex: TEST_EMAIL_REGEX }
        });
        console.log(`   Deleted ${usersResult.deletedCount} test users`);
        totalDeleted += usersResult.deletedCount;
        
        // 2. Clean test sources (created by test users)
        console.log('\n📚 Cleaning test sources...');
        // First get test user IDs
        const testUserIds = await db.collection('users').find({
            email: { $regex: TEST_EMAIL_REGEX }
        }).project({ _id: 1 }).toArray();
        
        // Also clean sources with test names
        const sourcesResult = await db.collection('sources').deleteMany({
            $or: [
                { name: { $regex: /^(test|Test|TEST)/ } },
                { userId: { $in: testUserIds.map(u => u._id) } }
            ]
        });
        console.log(`   Deleted ${sourcesResult.deletedCount} test sources`);
        totalDeleted += sourcesResult.deletedCount;
        
        // 3. Clean test articles
        console.log('\n📄 Cleaning test articles...');
        const articlesResult = await db.collection('articles').deleteMany({
            $or: [
                { title: { $regex: /^(test|Test|TEST)/ } },
                { userId: { $in: testUserIds.map(u => u._id) } }
            ]
        });
        console.log(`   Deleted ${articlesResult.deletedCount} test articles`);
        totalDeleted += articlesResult.deletedCount;
        
        // 4. Clean test generated content
        console.log('\n📝 Cleaning test generated content...');
        const contentResult = await db.collection('generated_content').deleteMany({
            $or: [
                { title: { $regex: /^(test|Test|TEST)/ } },
                { userId: { $in: testUserIds.map(u => u._id) } }
            ]
        });
        console.log(`   Deleted ${contentResult.deletedCount} test content`);
        totalDeleted += contentResult.deletedCount;
        
        // 5. Clean test media
        console.log('\n🖼️  Cleaning test media...');
        const mediaResult = await db.collection('media').deleteMany({
            $or: [
                { filename: { $regex: /^(test|Test|TEST)/ } },
                { userId: { $in: testUserIds.map(u => u._id) } }
            ]
        });
        console.log(`   Deleted ${mediaResult.deletedCount} test media`);
        totalDeleted += mediaResult.deletedCount;
        
        // 6. Clean old generation jobs (older than 24 hours)
        console.log('\n⏰ Cleaning old generation jobs...');
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const jobsResult = await db.collection('generation_jobs').deleteMany({
            createdAt: { $lt: oneDayAgo }
        });
        console.log(`   Deleted ${jobsResult.deletedCount} old generation jobs`);
        totalDeleted += jobsResult.deletedCount;
        
        // 7. Clean test notifications
        console.log('\n🔔 Cleaning test notifications...');
        const notificationsResult = await db.collection('notifications').deleteMany({
            userId: { $in: testUserIds.map(u => u._id) }
        });
        console.log(`   Deleted ${notificationsResult.deletedCount} test notifications`);
        totalDeleted += notificationsResult.deletedCount;
        
        console.log('\n✅ Database cleanup completed!');
        console.log(`📊 Total items deleted: ${totalDeleted}`);
        
    } catch (error) {
        console.error('❌ Database cleanup error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run cleanup
cleanupTestData();

