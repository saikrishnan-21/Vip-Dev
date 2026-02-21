import { MongoClient, Db } from 'mongodb';

// Lazy initialization - only check env var when actually connecting
// This prevents build-time errors when env vars aren't available
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please add your MongoDB URI to .env.local or .env.production');
  }
  return uri;
}

const options = {
  serverSelectionTimeoutMS: 30000, // How long to try selecting a server (increased for better reliability)
  socketTimeoutMS: 45000, // How long to wait for a response
  connectTimeoutMS: 30000, // How long to wait for initial connection (increased for better reliability)
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50', 10), // Increased from 10 to 50 for multi-user support, configurable via env
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '10', 10), // Increased from 2 to 10 for multi-user support, configurable via env
  maxIdleTimeMS: 30000, // Close idle connections after 30s
  retryWrites: true, // Enable retry writes for better reliability
  retryReads: true, // Enable retry reads for better reliability
};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  // Return existing promise if already initialized
  if (clientPromise) {
    return clientPromise;
  }

  const uri = getMongoUri();

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable to preserve the value
    // across module reloads caused by HMR (Hot Module Replacement)
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}

// Export a module-scoped MongoClient promise (lazy initialization)
// This will only be called when actually used, not during module evaluation
export default getClientPromise;

// Helper function to get the database
export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB_NAME || 'vipcontentai';
  return client.db(dbName);
}

// Collection names as constants
export const Collections = {
  USERS: 'users',
  SOURCES: 'sources',
  ARTICLES: 'articles',
  GENERATED_CONTENT: 'generated_content',
  MEDIA: 'media',
  GENERATION_JOBS: 'generation_jobs',
  MODEL_GROUPS: 'model_groups',
} as const;
