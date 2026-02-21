import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message: string }> = {};

  // Check MongoDB URI
  checks.mongodb_uri = {
    status: process.env.MONGODB_URI ? 'ok' : 'error',
    message: process.env.MONGODB_URI 
      ? 'MongoDB URI is set' 
      : 'MongoDB URI is missing'
  };

  // Check JWT Secret
  checks.jwt_secret = {
    status: process.env.JWT_SECRET ? 'ok' : 'error',
    message: process.env.JWT_SECRET 
      ? 'JWT Secret is set' 
      : 'JWT Secret is missing'
  };

  // Check MongoDB Connection
  try {
    const db = await getDatabase();
    await db.admin().ping();
    checks.mongodb_connection = {
      status: 'ok',
      message: 'MongoDB connection successful'
    };

    // Check if users collection exists
    const collections = await db.listCollections({ name: 'users' }).toArray();
    checks.users_collection = {
      status: collections.length > 0 ? 'ok' : 'error',
      message: collections.length > 0 
        ? 'Users collection exists' 
        : 'Users collection does not exist'
    };

    // Check if there are any users
    const userCount = await db.collection('users').countDocuments();
    checks.users_data = {
      status: userCount > 0 ? 'ok' : 'error',
      message: `Found ${userCount} user(s) in database`
    };

  } catch (error) {
    checks.mongodb_connection = {
      status: 'error',
      message: error instanceof Error ? error.message : 'MongoDB connection failed'
    };
  }

  const allOk = Object.values(checks).every(check => check.status === 'ok');

  return NextResponse.json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  }, { 
    status: allOk ? 200 : 503 
  });
}

