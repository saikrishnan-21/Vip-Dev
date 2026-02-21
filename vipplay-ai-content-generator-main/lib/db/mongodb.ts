/**
 * MongoDB Database Connection Utility
 * Provides connectDB() function for API routes
 * 
 * This is a wrapper around lib/mongodb.ts to maintain compatibility
 * with routes that use the connectDB() function name.
 */

import { getDatabase } from '@/lib/mongodb';
import type { Db } from 'mongodb';

/**
 * Connect to MongoDB and return the database instance
 * @returns Promise<Db> - MongoDB database instance
 */
export async function connectDB(): Promise<Db> {
  return await getDatabase();
}

