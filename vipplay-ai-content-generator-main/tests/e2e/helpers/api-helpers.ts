/**
 * API Helper Functions for E1 Authentication Tests
 * Provides utilities for API endpoint testing
 */

import { APIRequestContext, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    _id: string;
    email: string;
    fullName: string;
    role: string;
  };
  errors?: Array<{ field: string; message: string }>;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: {
    _id: string;
    email: string;
    fullName: string;
    role: string;
  };
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Login via API with retry logic for connection errors
 */
export async function loginViaAPI(
  request: APIRequestContext,
  email: string,
  password: string,
  retries: number = 3
): Promise<LoginResponse> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: { email, password },
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      // Log for debugging
      if (!data.success) {
        console.error('Login failed:', data);
      }
      
      return data;
    } catch (error: any) {
      lastError = error;
      // Retry on connection errors (common when running tests in parallel)
      const isConnectionError = error.message?.includes('ECONNRESET') || 
                                error.message?.includes('ECONNREFUSED') || 
                                error.code === 'ECONNRESET' ||
                                error.code === 'ECONNREFUSED';
      
      if (isConnectionError && attempt < retries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
  
  throw lastError || new Error('Login failed after retries');
}

/**
 * Register via API
 */
export async function registerViaAPI(
  request: APIRequestContext,
  email: string,
  password: string,
  confirmPassword: string,
  fullName: string
): Promise<RegisterResponse & { status: number }> {
  const response = await request.post(`${BASE_URL}/api/auth/register`, {
    data: { email, password, confirmPassword, fullName },
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  return { ...data, status: response.status() };
}

/**
 * Get current user profile via API
 */
export async function getCurrentUser(
  request: APIRequestContext,
  token: string
) {
  const response = await request.get(`${BASE_URL}/api/protected/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Update user profile via API
 */
export async function updateProfile(
  request: APIRequestContext,
  token: string,
  updates: { fullName?: string; email?: string; preferences?: any }
) {
  const response = await request.patch(`${BASE_URL}/api/protected/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: updates,
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get user preferences via API
 */
export async function getPreferences(
  request: APIRequestContext,
  token: string
) {
  const response = await request.get(`${BASE_URL}/api/protected/preferences`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Update preferences via API (PATCH - merge)
 */
export async function updatePreferences(
  request: APIRequestContext,
  token: string,
  preferences: any
) {
  const response = await request.patch(`${BASE_URL}/api/protected/preferences`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: preferences,
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Replace preferences via API (PUT - replace)
 */
export async function replacePreferences(
  request: APIRequestContext,
  token: string,
  preferences: any
) {
  const response = await request.put(`${BASE_URL}/api/protected/preferences`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: preferences,
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Reset preferences to defaults via API (DELETE)
 */
export async function resetPreferences(
  request: APIRequestContext,
  token: string
) {
  const response = await request.delete(`${BASE_URL}/api/protected/preferences`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Change password via API
 */
export async function changePassword(
  request: APIRequestContext,
  token: string,
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string
) {
  const response = await request.post(`${BASE_URL}/api/protected/change-password`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { currentPassword, newPassword, confirmNewPassword },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Logout via API
 */
export async function logoutViaAPI(
  request: APIRequestContext,
  token: string
) {
  const response = await request.post(`${BASE_URL}/api/auth/logout`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Verify token via API
 */
export async function verifyToken(
  request: APIRequestContext,
  token: string
) {
  const response = await request.post(`${BASE_URL}/api/auth/verify`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Refresh token via API
 */
export async function refreshToken(
  request: APIRequestContext,
  token: string
) {
  const response = await request.post(`${BASE_URL}/api/auth/refresh`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Generate random email for testing
 */
export function generateTestEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@vipcontentai.com`;
}

/**
 * Generate random password that meets validation requirements
 * Must have: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
 */
export function generateTestPassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each required type
  let password = '';
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * List all users (superadmin only)
 */
export async function listUsers(
  request: APIRequestContext,
  token: string,
  page = 1,
  limit = 10
) {
  const response = await request.get(
    `${BASE_URL}/api/protected/admin/users?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get user by ID (superadmin only)
 */
export async function getUserById(
  request: APIRequestContext,
  token: string,
  userId: string
) {
  const response = await request.get(
    `${BASE_URL}/api/protected/admin/users/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Update user role (superadmin only)
 */
export async function updateUserRole(
  request: APIRequestContext,
  token: string,
  userId: string,
  role: 'user' | 'superadmin'
) {
  const response = await request.patch(
    `${BASE_URL}/api/protected/admin/users/${userId}/role`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { role },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Delete user (superadmin only)
 */
export async function deleteUser(
  request: APIRequestContext,
  token: string,
  userId: string
) {
  const response = await request.delete(
    `${BASE_URL}/api/protected/admin/users/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

// ============================================================================
// E2 - Knowledge Base System Helpers
// ============================================================================

/**
 * Create RSS feed source
 */
export async function createRSSSource(
  request: APIRequestContext,
  token: string,
  name: string,
  feedUrl: string,
  description?: string,
  fetchFrequency?: number
) {
  const response = await request.post(`${BASE_URL}/api/sources/rss`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { name, feedUrl, description, fetchFrequency },
  });

  const data = await response.json();

  // Return actual API response - don't mask errors
  // Per VIP-10101 AC3: API returns 400 for duplicates, which is correct behavior
  return {
    status: response.status(),
    data,
  };
}

/**
 * Create website source
 */
export async function createWebsiteSource(
  request: APIRequestContext,
  token: string,
  name: string,
  websiteUrl: string,
  description?: string
) {
  const response = await request.post(`${BASE_URL}/api/sources/website`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { name, websiteUrl, description },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Create topic source
 */
export async function createTopicSource(
  request: APIRequestContext,
  token: string,
  name: string,
  topicKeywords: string[],
  description?: string
) {
  const response = await request.post(`${BASE_URL}/api/sources/topic`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { name, topicKeywords, description },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Create trends source
 */
export async function createTrendsSource(
  request: APIRequestContext,
  token: string,
  name: string,
  trendRegion: string,
  trendCategory: string,
  description?: string
) {
  const response = await request.post(`${BASE_URL}/api/sources/trends`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { name, trendRegion, trendCategory, description },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * List all sources
 */
export async function listSources(
  request: APIRequestContext,
  token: string,
  type?: string
) {
  const url = type 
    ? `${BASE_URL}/api/sources?type=${type}`
    : `${BASE_URL}/api/sources`;
  
  const response = await request.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get or create RSS source - ensures we have a valid source ID
 * Returns source ID even if source already exists
 */
export async function getOrCreateRSSSource(
  request: APIRequestContext,
  token: string,
  name: string,
  feedUrl: string,
  description?: string
): Promise<string> {
  const response = await createRSSSource(request, token, name, feedUrl, description);
  
  // If created successfully
  if (response.status === 201 && response.data.source?._id) {
    return response.data.source._id;
  }
  
  // If duplicate or already exists, find it in the list
  if (response.status === 200 && response.data.source?._id) {
    return response.data.source._id;
  }
  
  // Fallback: search for existing source
  const sourcesList = await listSources(request, token, 'rss');
  const existingSource = sourcesList.data.sources.find((s: any) => 
    s.feedUrl === feedUrl || s.feedUrl?.includes(feedUrl.split('?')[0])
  );
  
  if (existingSource?._id) {
    return existingSource._id;
  }
  
  // If still not found, throw error
  throw new Error(`Failed to get or create RSS source: ${JSON.stringify(response.data)}`);
}

/**
 * Fetch articles from RSS source
 */
export async function fetchRSSArticles(
  request: APIRequestContext,
  token: string,
  sourceId: string
) {
  const response = await request.post(`${BASE_URL}/api/sources/${sourceId}/fetch`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Search articles (full-text search)
 */
export async function searchArticles(
  request: APIRequestContext,
  token: string,
  query?: string,
  sourceId?: string,
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (sourceId) params.append('sourceId', sourceId);
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await request.get(
    `${BASE_URL}/api/articles/search?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Semantic search articles (vector similarity)
 */
export async function semanticSearchArticles(
  request: APIRequestContext,
  token: string,
  query: string,
  limit = 10,
  certainty = 0.7
) {
  const params = new URLSearchParams();
  params.append('q', query);
  params.append('limit', limit.toString());
  params.append('certainty', certainty.toString());

  const response = await request.get(
    `${BASE_URL}/api/articles/semantic-search?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * List articles by source
 */
export async function listArticlesBySource(
  request: APIRequestContext,
  token: string,
  sourceId: string,
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams();
  // API uses offset, not page - convert page to offset
  const offset = (page - 1) * limit;
  params.append('offset', offset.toString());
  params.append('limit', limit.toString());

  const response = await request.get(
    `${BASE_URL}/api/sources/${sourceId}/articles?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

// ============================================================================
// E3 - Content Generation Helpers
// ============================================================================

/**
 * Generate content from topic
 */
export async function generateContentFromTopic(
  request: APIRequestContext,
  token: string,
  topic: string,
  wordCount = 1500,
  tone = 'professional',
  keywords?: string[]
) {
  const response = await request.post(`${BASE_URL}/api/content/generate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      mode: 'topic',
      topic,
      wordCount: wordCount,
      tone,
      keywords,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Generate content from keywords
 */
export async function generateContentFromKeywords(
  request: APIRequestContext,
  token: string,
  keywords: string[],
  wordCount = 1500,
  tone = 'professional'
) {
  const response = await request.post(`${BASE_URL}/api/content/generate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      mode: 'keywords',
      keywords,
      wordCount: wordCount,
      tone,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Generate content from trends
 */
export async function generateContentFromTrends(
  request: APIRequestContext,
  token: string,
  trendTopic: string,
  region = 'US',
  wordCount = 1500,
  tone = 'professional'
) {
  const response = await request.post(`${BASE_URL}/api/content/generate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      mode: 'trends',
      trendTopic,
      region,
      wordCount: wordCount,
      tone,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Spin existing article
 */
export async function spinArticle(
  request: APIRequestContext,
  token: string,
  articleId: string,
  angle?: string,
  wordCount = 1500
) {
  const response = await request.post(`${BASE_URL}/api/content/generate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      mode: 'spin',
      articleId,
      angle,
      wordCount: wordCount,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get generation job status
 */
export async function getGenerationJob(
  request: APIRequestContext,
  token: string,
  jobId: string
) {
  const response = await request.get(`${BASE_URL}/api/content/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * List generation jobs
 */
export async function listGenerationJobs(
  request: APIRequestContext,
  token: string,
  status?: string,
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await request.get(
    `${BASE_URL}/api/content/jobs?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

// ============================================================================
// E4 - Content Management Helpers
// ============================================================================

/**
 * List generated content
 */
export async function listGeneratedContent(
  request: APIRequestContext,
  token: string,
  status?: string,
  search?: string,
  page = 1,
  limit = 20
) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (search) params.append('search', search);
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await request.get(
    `${BASE_URL}/api/content?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get content by ID
 */
export async function getContentById(
  request: APIRequestContext,
  token: string,
  contentId: string
) {
  const response = await request.get(`${BASE_URL}/api/content/${contentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Update content
 */
export async function updateContent(
  request: APIRequestContext,
  token: string,
  contentId: string,
  updates: {
    title?: string;
    content?: string;
    keywords?: string[];
    metaDescription?: string;
  }
) {
  const response = await request.patch(`${BASE_URL}/api/content/${contentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: updates,
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Approve content
 */
export async function approveContent(
  request: APIRequestContext,
  token: string,
  contentId: string
) {
  const response = await request.post(`${BASE_URL}/api/content/${contentId}/approve`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Reject content
 */
export async function rejectContent(
  request: APIRequestContext,
  token: string,
  contentId: string,
  rejectionReason: string
) {
  const response = await request.post(`${BASE_URL}/api/content/${contentId}/reject`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { rejectionReason },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Delete content
 */
export async function deleteContent(
  request: APIRequestContext,
  token: string,
  contentId: string
) {
  const response = await request.delete(`${BASE_URL}/api/content/${contentId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Bulk content operations
 */
export async function bulkContentAction(
  request: APIRequestContext,
  token: string,
  action: 'approve' | 'reject' | 'delete',
  contentIds: string[],
  rejectionNotes?: string
) {
  const response = await request.post(`${BASE_URL}/api/content/bulk-actions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      action,
      contentIds,
      rejectionNotes,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

// ============================================================================
// Additional E2 Helpers
// ============================================================================

/**
 * Initiate website crawl
 */
export async function initiateWebsiteCrawl(
  request: APIRequestContext,
  token: string,
  sourceId: string
) {
  const response = await request.post(`${BASE_URL}/api/sources/${sourceId}/crawl`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get crawl job status
 */
export async function getCrawlStatus(
  request: APIRequestContext,
  token: string,
  sourceId: string
) {
  const response = await request.get(`${BASE_URL}/api/sources/${sourceId}/crawl`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Generate article embedding
 */
export async function generateArticleEmbedding(
  request: APIRequestContext,
  token: string,
  articleId: string
) {
  const response = await request.post(`${BASE_URL}/api/articles/${articleId}/embeddings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

// ============================================================================
// Additional E3 Helpers
// ============================================================================

/**
 * Analyze SEO for content
 */
export async function analyzeSEO(
  request: APIRequestContext,
  token: string,
  content: string,
  title: string,
  keywords: string[]
) {
  // Use Next.js API route instead of FastAPI directly
  const response = await request.post(`${BASE_URL}/api/content/analyze/seo`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      content,
      title,
      keywords,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Analyze readability for content
 */
export async function analyzeReadability(
  request: APIRequestContext,
  token: string,
  content: string
) {
  // Use Next.js API route instead of FastAPI directly
  const response = await request.post(`${BASE_URL}/api/content/analyze/readability`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      content,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get job progress (SSE endpoint - will need special handling)
 */
export async function getJobProgress(
  request: APIRequestContext,
  token: string,
  jobId: string
) {
  // Use Next.js API route instead of FastAPI directly
  const response = await request.get(`${BASE_URL}/api/content/jobs/${jobId}/progress`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Retry failed generation job
 */
export async function retryGenerationJob(
  request: APIRequestContext,
  token: string,
  jobId: string
) {
  const response = await request.post(`${BASE_URL}/api/content/jobs/${jobId}/retry`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Cancel generation job
 */
export async function cancelGenerationJob(
  request: APIRequestContext,
  token: string,
  jobId: string
) {
  const response = await request.post(`${BASE_URL}/api/content/jobs/${jobId}/cancel`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Delete generation job
 */
export async function deleteGenerationJob(
  request: APIRequestContext,
  token: string,
  jobId: string
) {
  const response = await request.delete(`${BASE_URL}/api/content/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

// ============================================================================
// Additional API Helpers for Missing Endpoints
// ============================================================================

/**
 * Get content version history
 */
export async function getContentVersions(
  request: APIRequestContext,
  token: string,
  contentId: string
) {
  const response = await request.get(`${BASE_URL}/api/content/${contentId}/versions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Create new content version
 */
export async function createContentVersion(
  request: APIRequestContext,
  token: string,
  contentId: string,
  content: string,
  changes: string
) {
  const response = await request.post(`${BASE_URL}/api/content/${contentId}/versions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { content, changes },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Find similar articles using vector similarity
 */
export async function findSimilarArticles(
  request: APIRequestContext,
  token: string,
  articleId: string,
  limit: number = 10
) {
  const response = await request.get(
    `${BASE_URL}/api/articles/${articleId}/similar?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Generate embeddings for multiple articles (batch)
 */
export async function batchGenerateEmbeddings(
  request: APIRequestContext,
  token: string,
  limit: number = 100,
  sourceId?: string
) {
  const url = sourceId
    ? `${BASE_URL}/api/articles/embeddings/batch?limit=${limit}&sourceId=${sourceId}`
    : `${BASE_URL}/api/articles/embeddings/batch?limit=${limit}`;
  
  const response = await request.post(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get content schedule
 */
export async function getContentSchedule(
  request: APIRequestContext,
  token: string,
  contentId: string
) {
  const response = await request.get(`${BASE_URL}/api/content/${contentId}/schedule`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Schedule content for publishing
 */
export async function scheduleContent(
  request: APIRequestContext,
  token: string,
  contentId: string,
  scheduledFor: string
) {
  const response = await request.post(`${BASE_URL}/api/content/${contentId}/schedule`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { scheduledFor },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Cancel scheduled content publishing
 */
export async function cancelContentSchedule(
  request: APIRequestContext,
  token: string,
  contentId: string
) {
  const response = await request.delete(`${BASE_URL}/api/content/${contentId}/schedule`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get content analytics
 */
export async function getContentAnalytics(
  request: APIRequestContext,
  token: string,
  userId?: string,
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const url = params.toString()
    ? `${BASE_URL}/api/content/analytics?${params.toString()}`
    : `${BASE_URL}/api/content/analytics`;
  
  const response = await request.get(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

