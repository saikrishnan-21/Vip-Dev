import { ObjectId } from 'mongodb';

export type SourceType = 'rss' | 'website' | 'topic' | 'trends';
export type SourceStatus = 'active' | 'paused' | 'error';

export interface Source {
  _id?: ObjectId;
  userId: ObjectId; // Owner of this source
  type: SourceType;
  name: string;
  description?: string;
  status: SourceStatus;

  // RSS specific fields
  feedUrl?: string;
  lastFetchedAt?: Date;
  fetchFrequency?: number; // In minutes

  // Website specific fields
  websiteUrl?: string;
  crawlDepth?: number;
  crawlJobId?: string; // Firecrawl job ID for async crawling

  // Topic specific fields
  topicKeywords?: string[];

  // Trends specific fields
  trendRegion?: string;
  trendCategory?: string;

  // Metadata
  articlesCount?: number; // Cached count
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SourcePublic {
  _id: string;
  userId: string;
  type: SourceType;
  name: string;
  description?: string;
  status: SourceStatus;
  feedUrl?: string;
  websiteUrl?: string;
  topicKeywords?: string[];
  trendRegion?: string;
  trendCategory?: string;
  articlesCount?: number;
  lastFetchedAt?: Date;
  fetchFrequency?: number;
  createdAt: Date;
}

// Create RSS Source Request
export interface CreateRSSSourceRequest {
  name: string;
  description?: string;
  feedUrl: string;
  fetchFrequency?: number; // In minutes, default 60
}

// Create Website Source Request
export interface CreateWebsiteSourceRequest {
  name: string;
  description?: string;
  websiteUrl: string;
  crawlDepth?: number; // Default 1
}

// Create Topic Source Request
export interface CreateTopicSourceRequest {
  name: string;
  description?: string;
  topicKeywords: string[];
}

// Create Trends Source Request
export interface CreateTrendsSourceRequest {
  name: string;
  description?: string;
  trendRegion?: string; // Default 'US'
  trendCategory?: string;
}
