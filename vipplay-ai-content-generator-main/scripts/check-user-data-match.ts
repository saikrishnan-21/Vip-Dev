/**
 * Check if current user's data matches what's in database
 * This helps identify if userId mismatch is causing data to "disappear"
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:VipplayPass123@52.202.212.166:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'vipcontentai';

// Get userId from command line or use a test userId
const testUserId = process.argv[2] || '69281051cf543742ff22eb12';

async function checkUserData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(DB_NAME);
    const userId = new ObjectId(testUserId);
    
    console.log(`🔍 Checking data for userId: ${testUserId}\n`);
    
    // Check media
    const mediaCollection = db.collection('media');
    const userMedia = await mediaCollection.find({ userId }).toArray();
    const allMedia = await mediaCollection.countDocuments({});
    const totalUserMedia = await mediaCollection.countDocuments({ userId });
    
    console.log('📊 Media Analysis:');
    console.log(`   Total media in database: ${allMedia}`);
    console.log(`   Media for this userId: ${totalUserMedia}`);
    console.log(`   Media found with exact match: ${userMedia.length}`);
    
    if (userMedia.length > 0) {
      console.log('\n   Recent media for this user:');
      userMedia.slice(0, 5).forEach((item: any) => {
        console.log(`   - ${item.filename} (created: ${item.createdAt})`);
      });
    } else {
      console.log('   ⚠️  No media found for this userId!');
      
      // Check if there's media with similar but different userId
      const allMediaItems = await mediaCollection.find({}).limit(10).toArray();
      console.log('\n   Sample media userIds in database:');
      allMediaItems.forEach((item: any) => {
        console.log(`   - Media: ${item.filename}, UserId: ${item.userId}`);
      });
    }
    
    // Check content
    const contentCollection = db.collection('generated_content');
    const userContent = await contentCollection.find({ userId }).toArray();
    const allContent = await contentCollection.countDocuments({});
    const totalUserContent = await contentCollection.countDocuments({ userId });
    
    console.log('\n📊 Content Analysis:');
    console.log(`   Total content in database: ${allContent}`);
    console.log(`   Content for this userId: ${totalUserContent}`);
    console.log(`   Content found with exact match: ${userContent.length}`);
    
    if (userContent.length > 0) {
      console.log('\n   Recent content for this user:');
      userContent.slice(0, 5).forEach((item: any) => {
        console.log(`   - ${item.title?.substring(0, 50)}... (status: ${item.status}, created: ${item.createdAt})`);
      });
    } else {
      console.log('   ⚠️  No content found for this userId!');
      
      // Check if there's content with similar but different userId
      const allContentItems = await contentCollection.find({}).limit(10).toArray();
      console.log('\n   Sample content userIds in database:');
      allContentItems.forEach((item: any) => {
        console.log(`   - Content: ${item.title?.substring(0, 30)}..., UserId: ${item.userId}`);
      });
    }
    
    // Check user
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: userId });
    
    console.log('\n👤 User Info:');
    if (user) {
      console.log(`   Email: ${(user as any).email}`);
      console.log(`   Role: ${(user as any).role}`);
      console.log(`   UserId matches: ✅`);
    } else {
      console.log(`   ⚠️  User not found with this userId!`);
      console.log(`   This userId might be invalid or from a different database.`);
    }
    
    // Check for potential issues
    console.log('\n🔍 Potential Issues:');
    
    // Check if userId is stored as string vs ObjectId
    const mediaWithStringUserId = await mediaCollection.countDocuments({
      userId: testUserId // Try as string
    });
    const contentWithStringUserId = await contentCollection.countDocuments({
      userId: testUserId // Try as string
    });
    
    if (mediaWithStringUserId > 0 || contentWithStringUserId > 0) {
      console.log('   ⚠️  Found data with userId stored as STRING instead of ObjectId!');
      console.log(`   Media with string userId: ${mediaWithStringUserId}`);
      console.log(`   Content with string userId: ${contentWithStringUserId}`);
      console.log('   This is a CRITICAL issue - userId should be ObjectId, not string!');
    }
    
    // Check recent activity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMedia = await mediaCollection.countDocuments({
      userId,
      createdAt: { $gte: oneDayAgo }
    });
    const recentContent = await contentCollection.countDocuments({
      userId,
      createdAt: { $gte: oneDayAgo }
    });
    
    console.log(`\n📅 Recent Activity (last 24h) for this user:`);
    console.log(`   Media created: ${recentMedia}`);
    console.log(`   Content created: ${recentContent}`);
    
    console.log('\n✅ Check complete!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ObjectId')) {
      console.error('   ⚠️  Invalid userId format. Must be a valid MongoDB ObjectId.');
      console.error('   Example: 69281051cf543742ff22eb12');
    }
  } finally {
    await client.close();
  }
}

checkUserData().catch(console.error);

