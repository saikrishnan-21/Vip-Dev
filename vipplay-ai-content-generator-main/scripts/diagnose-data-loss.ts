/**
 * Diagnostic Script for Data Loss Issue
 * 
 * This script checks for potential causes of images and articles disappearing:
 * 1. Database connection issues
 * 2. userId mismatches
 * 3. Database name mismatches
 * 4. TTL indexes
 * 5. Data actually in database vs what's being queried
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:VipplayPass123@52.202.212.166:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'vipcontentai';

async function diagnose() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Check which database we're connected to
    const adminDb = client.db().admin();
    const serverStatus = await adminDb.serverStatus();
    console.log('\n📊 Server Info:');
    console.log(`   Host: ${serverStatus.host}`);
    console.log(`   Version: ${serverStatus.version}`);
    
    // Get database
    const db = client.db(DB_NAME);
    console.log(`\n📁 Using database: ${DB_NAME}`);
    
    // List all databases
    const dbList = await adminDb.listDatabases();
    console.log('\n📚 Available databases:');
    dbList.databases.forEach((dbInfo: any) => {
      console.log(`   - ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📦 Collections in ${DB_NAME}:`);
    collections.forEach((col: any) => {
      console.log(`   - ${col.name}`);
    });
    
    // Check for TTL indexes
    console.log('\n⏰ Checking for TTL indexes (expiration):');
    for (const col of collections) {
      const collection = db.collection(col.name);
      const indexes = await collection.indexes();
      const ttlIndexes = indexes.filter((idx: any) => idx.expireAfterSeconds);
      if (ttlIndexes.length > 0) {
        console.log(`   ⚠️  ${col.name} has TTL indexes:`);
        ttlIndexes.forEach((idx: any) => {
          console.log(`      - ${JSON.stringify(idx.key)} expires after ${idx.expireAfterSeconds} seconds`);
        });
      }
    }
    
    // Check media collection
    console.log('\n🖼️  Media Collection Analysis:');
    const mediaCollection = db.collection('media');
    const mediaCount = await mediaCollection.countDocuments();
    console.log(`   Total media items: ${mediaCount}`);
    
    if (mediaCount > 0) {
      // Get sample media items
      const sampleMedia = await mediaCollection.find({}).limit(5).toArray();
      console.log('\n   Sample media items:');
      sampleMedia.forEach((item: any) => {
        console.log(`   - ID: ${item._id}`);
        console.log(`     UserId: ${item.userId}`);
        console.log(`     Filename: ${item.filename}`);
        console.log(`     Created: ${item.createdAt}`);
        console.log(`     Source: ${item.source}`);
        console.log('');
      });
      
      // Check for userId patterns
      const userIds = await mediaCollection.distinct('userId');
      console.log(`   Unique userIds in media: ${userIds.length}`);
      userIds.slice(0, 5).forEach((uid: any) => {
        console.log(`   - ${uid}`);
      });
    }
    
    // Check generated_content collection
    console.log('\n📝 Generated Content Collection Analysis:');
    const contentCollection = db.collection('generated_content');
    const contentCount = await contentCollection.countDocuments();
    console.log(`   Total content items: ${contentCount}`);
    
    if (contentCount > 0) {
      // Get sample content
      const sampleContent = await contentCollection.find({}).limit(5).toArray();
      console.log('\n   Sample content items:');
      sampleContent.forEach((item: any) => {
        console.log(`   - ID: ${item._id}`);
        console.log(`     UserId: ${item.userId}`);
        console.log(`     Title: ${item.title?.substring(0, 50)}...`);
        console.log(`     Status: ${item.status}`);
        console.log(`     Created: ${item.createdAt}`);
        console.log('');
      });
      
      // Check for userId patterns
      const userIds = await contentCollection.distinct('userId');
      console.log(`   Unique userIds in content: ${userIds.length}`);
      userIds.slice(0, 5).forEach((uid: any) => {
        console.log(`   - ${uid}`);
      });
    }
    
    // Check users collection
    console.log('\n👥 Users Collection Analysis:');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log(`   Total users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await usersCollection.find({}).limit(5).toArray();
      console.log('\n   Sample users:');
      users.forEach((user: any) => {
        console.log(`   - ID: ${user._id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Role: ${user.role}`);
        console.log('');
      });
    }
    
    // Check if URI includes database name
    console.log('\n🔍 Connection String Analysis:');
    if (MONGODB_URI.includes('/' + DB_NAME) || MONGODB_URI.includes('/' + DB_NAME + '?')) {
      console.log('   ✅ URI includes database name');
    } else {
      console.log('   ⚠️  URI does NOT include database name');
      console.log('   ⚠️  This could cause connection to wrong database!');
      console.log(`   ⚠️  Current URI: ${MONGODB_URI}`);
      console.log(`   ⚠️  Should be: ${MONGODB_URI}/${DB_NAME}`);
    }
    
    // Check for orphaned data (data without valid userId)
    console.log('\n🔗 Checking for data integrity issues:');
    const allUserIds = await usersCollection.distinct('_id');
    const mediaWithInvalidUserId = await mediaCollection.countDocuments({
      userId: { $nin: allUserIds }
    });
    const contentWithInvalidUserId = await contentCollection.countDocuments({
      userId: { $nin: allUserIds }
    });
    
    console.log(`   Media with invalid userId: ${mediaWithInvalidUserId}`);
    console.log(`   Content with invalid userId: ${contentWithInvalidUserId}`);
    
    // Check recent activity
    console.log('\n📅 Recent Activity (last 24 hours):');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMedia = await mediaCollection.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });
    const recentContent = await contentCollection.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });
    console.log(`   Media created in last 24h: ${recentMedia}`);
    console.log(`   Content created in last 24h: ${recentContent}`);
    
    console.log('\n✅ Diagnosis complete!');
    
  } catch (error: any) {
    console.error('❌ Error during diagnosis:', error);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

diagnose().catch(console.error);

