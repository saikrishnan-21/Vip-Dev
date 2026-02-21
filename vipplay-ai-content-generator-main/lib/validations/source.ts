import { z } from 'zod';

export const createRSSSourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  feedUrl: z.string().url('Invalid RSS feed URL'),
  fetchFrequency: z.number().min(15).max(1440).optional(), // 15 min to 24 hours
});

export const createWebsiteSourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  websiteUrl: z.string().url('Invalid website URL'),
  crawlFrequency: z.number().min(60).max(1440).optional(), // 1 hour to 24 hours
});

export const createTopicSourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  topicKeywords: z.array(z.string()).min(1, 'At least one keyword required'),
});

export const createTrendsSourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  trendRegion: z.string().length(2).optional(), // ISO country code
  trendCategory: z.string().optional(),
});

export const updateSourceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'error']).optional(),
  fetchFrequency: z.number().min(15).max(1440).optional(),
  crawlDepth: z.number().min(1).max(5).optional(),
  topicKeywords: z.array(z.string()).optional(),
  trendRegion: z.string().length(2).optional(),
  trendCategory: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export type CreateRSSSourceInput = z.infer<typeof createRSSSourceSchema>;
export type CreateWebsiteSourceInput = z.infer<typeof createWebsiteSourceSchema>;
export type CreateTopicSourceInput = z.infer<typeof createTopicSourceSchema>;
export type CreateTrendsSourceInput = z.infer<typeof createTrendsSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
