// One-time script to promote a user to superadmin role
// Run with: node scripts/promote-superadmin.js

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://admin:VipplayPass123@3.105.105.52:27017/vipcontentai';
const EMAIL_TO_PROMOTE = 'admin@vipcontentai.com';

async function promoteSuperadmin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('vipcontentai');
    const usersCollection = db.collection('users');

    // Update the user's role to superadmin
    const result = await usersCollection.updateOne(
      { email: EMAIL_TO_PROMOTE },
      {
        $set: {
          role: 'superadmin',
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      console.error(`User with email ${EMAIL_TO_PROMOTE} not found`);
      return;
    }

    console.log(`✅ Successfully promoted ${EMAIL_TO_PROMOTE} to superadmin`);
    console.log(`Modified ${result.modifiedCount} document(s)`);

    // Verify the update
    const updatedUser = await usersCollection.findOne(
      { email: EMAIL_TO_PROMOTE },
      { projection: { email: 1, role: 1, fullName: 1 } }
    );

    console.log('\nUpdated user:', updatedUser);
  } catch (error) {
    console.error('Error promoting user:', error);
  } finally {
    await client.close();
  }
}

promoteSuperadmin();
