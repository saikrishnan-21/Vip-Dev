import { ObjectId } from 'mongodb';

export type MediaType = 'image' | 'video' | 'audio' | 'document';
export type MediaSource = 'upload' | 'ai_generated' | 'url';

export interface MediaAsset {
  _id?: ObjectId;
  userId: ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: MediaType;
  source: MediaSource;

  // Storage
  url: string;
  thumbnailUrl?: string;

  // Metadata
  width?: number;
  height?: number;
  duration?: number; // for video/audio

  // Organization
  tags: string[];
  category?: string;
  altText?: string;
  caption?: string;

  // AI Generation metadata
  generationPrompt?: string;
  generationModel?: string;
  generationParams?: Record<string, any>;

  // Usage tracking
  usedInContent: ObjectId[]; // References to content using this media
  usageCount: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaPublic {
  _id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: MediaType;
  source: MediaSource;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  tags: string[];
  category?: string;
  altText?: string;
  caption?: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaGenerationJob {
  _id?: ObjectId;
  userId: ObjectId;
  prompt: string;
  model: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  params?: {
    width?: number;
    height?: number;
    style?: string;
    negative_prompt?: string;
  };
  resultUrl?: string;
  mediaId?: ObjectId;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
