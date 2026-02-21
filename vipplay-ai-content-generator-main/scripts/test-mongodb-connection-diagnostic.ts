#!/usr/bin/env tsx
/**
 * MongoDB Connection Diagnostic Script
 * 
 * This script helps diagnose MongoDB connection issues by:
 * 1. Checking environment variables
 * 2. Testing connection with different configurations
 * 3. Providing detailed error messages
 */

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const envFiles = [
  '.env.local',
  '.env.production',
  '.env.staging',
  '.env'
];

let envLoaded = false;
for (const envFile of envFiles) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    console.log(`📄 Loading environment from: ${envFile}`);
    config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  No .env file found. Using process.env only.');
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testConnection(uri: string, options: any = {}) {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    ...options,
  });

  try {
    log('🔄 Attempting to connect...', 'blue');
    await client.connect();
    log('✅ Connection successful!', 'green');
    
    // Test ping
    await client.db().admin().ping();
    log('✅ Ping successful!', 'green');
    
    // Get server info
    const serverStatus = await client.db().admin().serverStatus();
    log(`📊 MongoDB Version: ${serverStatus.version}`, 'blue');
    
    // List databases
    const dbs = await client.db().admin().listDatabases();
    log(`📁 Available databases: ${dbs.databases.map((d: any) => d.name).join(', ')}`, 'blue');
    
    // Check target database
    const dbName = process.env.MONGODB_DB_NAME || 'vipcontentai';
    const targetDb = client.db(dbName);
    const collections = await targetDb.listCollections().toArray();
    log(`📋 Collections in '${dbName}': ${collections.map((c: any) => c.name).join(', ') || 'none'}`, 'blue');
    
    await client.close();
    return { success: true, error: null };
  } catch (error: any) {
    await client.close().catch(() => {});
    
    let errorMessage = error.message || 'Unknown error';
    let errorType = error.name || 'Error';
    
    // Provide helpful error messages
    if (errorMessage.includes('authentication failed')) {
      errorMessage = 'Authentication failed. Check username and password.';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      errorMessage = 'Connection refused. Check if MongoDB is running and the host/port is correct.';
    } else if (errorMessage.includes('ENOTFOUND')) {
      errorMessage = 'Host not found. Check the hostname/IP address.';
    } else if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
      errorMessage = 'Connection timeout. Check network connectivity and firewall settings.';
    } else if (errorMessage.includes('bad auth')) {
      errorMessage = 'Bad authentication. Verify credentials.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      errorType,
      fullError: error
    };
  }
}

async function main() {
  logSection('MongoDB Connection Diagnostic Tool');
  
  // Check environment variables
  logSection('1. Environment Variables Check');
  
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'vipcontentai';
  
  if (!mongoUri) {
    log('❌ MONGODB_URI is not set!', 'red');
    log('\n💡 Solution:', 'yellow');
    log('   Add MONGODB_URI to your .env.local file:', 'yellow');
    log('   MONGODB_URI=mongodb://username:password@host:port/database', 'yellow');
    log('   Example: MONGODB_URI=mongodb://admin:password@localhost:27017/vipcontentai', 'yellow');
    process.exit(1);
  }
  
  log(`✅ MONGODB_URI is set`, 'green');
  log(`   Database name: ${dbName}`, 'blue');
  
  // Mask password in URI for display
  const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
  log(`   URI: ${maskedUri}`, 'blue');
  
  // Parse URI
  logSection('2. URI Analysis');
  
  try {
    const uriMatch = mongoUri.match(/mongodb(\+srv)?:\/\/(?:([^:]+):([^@]+)@)?([^\/:]+)(?::(\d+))?(?:\/([^?]+))?(?:\?(.+))?/);
    
    if (uriMatch) {
      const [, isSrv, username, password, host, port, database, query] = uriMatch;
      
      log(`   Protocol: mongodb${isSrv ? '+srv' : ''}`, 'blue');
      log(`   Username: ${username || 'not specified'}`, 'blue');
      log(`   Password: ${password ? '****' : 'not specified'}`, 'blue');
      log(`   Host: ${host}`, 'blue');
      log(`   Port: ${port || (isSrv ? 'default (SRV)' : '27017')}`, 'blue');
      log(`   Database: ${database || 'not in URI (will use MONGODB_DB_NAME or default)'}`, 'blue');
      log(`   Query params: ${query || 'none'}`, 'blue');
      
      // Check if database is in URI
      if (!database && !mongoUri.includes('/vipcontentai')) {
        log('\n⚠️  Warning: Database name not in URI!', 'yellow');
        log('   The URI should include the database name:', 'yellow');
        log(`   ${maskedUri}/vipcontentai`, 'yellow');
        log('   Or set MONGODB_DB_NAME environment variable.', 'yellow');
      }
    }
  } catch (e) {
    log('⚠️  Could not parse URI format', 'yellow');
  }
  
  // Test connection
  logSection('3. Connection Test');
  
  const result = await testConnection(mongoUri);
  
  if (!result.success) {
    log(`\n❌ Connection failed: ${result.error}`, 'red');
    log(`   Error type: ${result.errorType}`, 'red');
    
    logSection('4. Troubleshooting Steps');
    
    log('1. Verify MongoDB is running:', 'yellow');
    log('   - Local: Check if MongoDB service is running', 'yellow');
    log('   - Remote: Verify host and port are accessible', 'yellow');
    
    log('\n2. Check credentials:', 'yellow');
    log('   - Verify username and password are correct', 'yellow');
    log('   - For MongoDB Atlas: Check database user permissions', 'yellow');
    
    log('\n3. Check network connectivity:', 'yellow');
    log('   - For remote MongoDB: Ensure IP is whitelisted', 'yellow');
    log('   - Check firewall settings', 'yellow');
    log('   - Test connection: telnet <host> <port>', 'yellow');
    
    log('\n4. Verify URI format:', 'yellow');
    log('   - Standard: mongodb://user:pass@host:port/database', 'yellow');
    log('   - Atlas: mongodb+srv://user:pass@cluster.mongodb.net/database', 'yellow');
    log('   - Include database name in URI or set MONGODB_DB_NAME', 'yellow');
    
    log('\n5. Check connection options:', 'yellow');
    log('   - Increase timeouts if network is slow', 'yellow');
    log('   - Add ?serverSelectionTimeoutMS=30000 to URI', 'yellow');
    
    if (result.fullError) {
      log('\n📋 Full error details:', 'blue');
      console.error(result.fullError);
    }
    
    process.exit(1);
  }
  
  logSection('4. Connection Options');
  
  // Test with different timeout options
  log('Testing with extended timeouts...', 'blue');
  const extendedResult = await testConnection(mongoUri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 60000,
  });
  
  if (extendedResult.success) {
    log('✅ Connection works with extended timeouts', 'green');
  }
  
  logSection('5. Summary');
  log('✅ All checks passed! MongoDB connection is working.', 'green');
  log('\n💡 If you still see errors in your application:', 'yellow');
  log('   1. Restart your Next.js server after fixing .env', 'yellow');
  log('   2. Clear Next.js cache: rm -rf .next', 'yellow');
  log('   3. Run database migrations: pnpm db:migrate', 'yellow');
  log('   4. Seed initial data: pnpm db:seed', 'yellow');
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

