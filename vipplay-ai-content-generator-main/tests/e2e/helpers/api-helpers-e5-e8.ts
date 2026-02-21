/**
 * Additional API Helpers for E5, E6, E7, E8 Epics
 * These functions are imported and used in test files
 */

import { APIRequestContext } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ============================================================================
// E5 - Media Library Helpers
// ============================================================================

/**
 * List and search media assets
 */
export async function listMedia(
  request: APIRequestContext,
  token: string,
  type?: string,
  tags?: string[],
  category?: string,
  search?: string,
  limit: number = 20,
  offset: number = 0
) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (tags && tags.length > 0) params.append('tags', tags.join(','));
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await request.get(`${BASE_URL}/api/media?${params.toString()}`, {
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
 * Get media by ID
 */
export async function getMediaById(
  request: APIRequestContext,
  token: string,
  mediaId: string
) {
  const response = await request.get(`${BASE_URL}/api/media/${mediaId}`, {
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
 * Update media metadata
 */
export async function updateMedia(
  request: APIRequestContext,
  token: string,
  mediaId: string,
  updates: { tags?: string[]; category?: string; altText?: string; caption?: string }
) {
  const response = await request.patch(`${BASE_URL}/api/media/${mediaId}`, {
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
 * Delete media asset
 */
export async function deleteMedia(
  request: APIRequestContext,
  token: string,
  mediaId: string
) {
  const response = await request.delete(`${BASE_URL}/api/media/${mediaId}`, {
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
 * Generate AI image
 */
export async function generateAIImage(
  request: APIRequestContext,
  token: string,
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  style: string = 'realistic',
  negative_prompt?: string
) {
  const response = await request.post(`${BASE_URL}/api/media/generate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      prompt,
      width,
      height,
      style,
      negative_prompt,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * List media generation jobs
 */
export async function listMediaGenerationJobs(
  request: APIRequestContext,
  token: string,
  status?: string,
  limit: number = 20,
  offset: number = 0
) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await request.get(`${BASE_URL}/api/media/generate?${params.toString()}`, {
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
// E6 - AI Configuration (Superadmin) Helpers
// ============================================================================

/**
 * List Ollama models
 */
export async function listOllamaModels(
  request: APIRequestContext,
  token: string
) {
  const response = await request.get(`${BASE_URL}/api/admin/ai/models`, {
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
 * Pull new Ollama model
 */
export async function pullOllamaModel(
  request: APIRequestContext,
  token: string,
  modelName: string
) {
  const response = await request.post(`${BASE_URL}/api/admin/ai/models`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { model: modelName },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Test model connection
 */
export async function testModelConnection(
  request: APIRequestContext,
  token: string,
  modelName: string
) {
  const response = await request.post(`${BASE_URL}/api/admin/ai/models/test`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { model: modelName },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * List model groups
 */
export async function listModelGroups(
  request: APIRequestContext,
  token: string,
  isActive?: boolean
) {
  const params = new URLSearchParams();
  if (isActive !== undefined) params.append('isActive', isActive.toString());

  const response = await request.get(`${BASE_URL}/api/admin/ai/groups?${params.toString()}`, {
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
 * Create model group
 */
export async function createModelGroup(
  request: APIRequestContext,
  token: string,
  name: string,
  description: string,
  models: string[],
  routingStrategy: string,
  priority?: number[],
  isActive: boolean = true
) {
  const response = await request.post(`${BASE_URL}/api/admin/ai/groups`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      name,
      description,
      models,
      routingStrategy,
      priority,
      isActive,
    },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get model group by ID
 */
export async function getModelGroup(
  request: APIRequestContext,
  token: string,
  groupId: string
) {
  const response = await request.get(`${BASE_URL}/api/admin/ai/groups/${groupId}`, {
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
 * Update model group
 */
export async function updateModelGroup(
  request: APIRequestContext,
  token: string,
  groupId: string,
  updates: {
    name?: string;
    description?: string;
    models?: string[];
    routingStrategy?: string;
    priority?: number[];
    isActive?: boolean;
  }
) {
  const response = await request.patch(`${BASE_URL}/api/admin/ai/groups/${groupId}`, {
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
 * List AI configurations
 */
export async function listAIConfigurations(
  request: APIRequestContext,
  token: string,
  category?: string,
  isActive?: boolean
) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (isActive !== undefined) params.append('isActive', isActive.toString());

  const response = await request.get(`${BASE_URL}/api/admin/ai/config?${params.toString()}`, {
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
 * Export AI configuration
 * Uses PUT /api/admin/ai/config to export all configurations
 */
export async function exportAIConfiguration(
  request: APIRequestContext,
  token: string
) {
  const response = await request.put(`${BASE_URL}/api/admin/ai/config`, {
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
 * Import AI configuration
 * Uses PATCH /api/admin/ai/config to import configurations
 */
export async function importAIConfiguration(
  request: APIRequestContext,
  token: string,
  config: any
) {
  const response = await request.patch(`${BASE_URL}/api/admin/ai/config`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: config,
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

// ============================================================================
// E7 - Export and Notifications Helpers
// ============================================================================

/**
 * Export content as Markdown/DOCX/PDF
 */
export async function exportContent(
  request: APIRequestContext,
  token: string,
  contentId: string,
  format: 'markdown' | 'docx' | 'pdf' | 'html',
  options?: any
) {
  const response = await request.post(`${BASE_URL}/api/content/${contentId}/export`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { format, options },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

/**
 * Get export job status
 */
export async function getExportJobStatus(
  request: APIRequestContext,
  token: string,
  contentId: string
) {
  const response = await request.get(`${BASE_URL}/api/content/${contentId}/export`, {
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
 * Bulk export content
 */
export async function bulkExportContent(
  request: APIRequestContext,
  token: string,
  contentIds: string[],
  format: 'markdown' | 'docx' | 'pdf' | 'html',
  options?: any
) {
  const response = await request.post(`${BASE_URL}/api/content/export/bulk`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { contentIds, format, options },
  });

  return {
    status: response.status(),
    data: await response.json(),
  };
}

