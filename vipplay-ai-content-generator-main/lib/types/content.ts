import { ObjectId } from 'mongodb';

export type ContentStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'rejected'
  | 'pending'
  | 'completed';

export interface GeneratedContent {
  _id?: ObjectId;
  userId: ObjectId;
  title: string;
  content: string;
  summary?: string;
  status: ContentStatus;
  version: number;
  sourceType: 'topic' | 'keywords' | 'trends' | 'spin';
  sourceData?: Record<string, any>;

  // SEO
  seoScore?: number;
  readabilityScore?: number;
  keywords?: string[];
  metaDescription?: string;

  // Publishing
  publishedAt?: Date;
  scheduledFor?: Date;

  // Rejection (VIP-10305)
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: ObjectId;

  // Versioning (VIP-10303)
  previousVersionId?: ObjectId;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  lastEditedBy: ObjectId;
}

export interface ContentPublic {
  _id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  status: ContentStatus;
  version: number;
  sourceType: string;
  seoScore?: number;
  readabilityScore?: number;
  keywords?: string[];
  publishedAt?: Date;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentVersion {
  contentId: ObjectId;
  versionNumber: number;
  content: string;
  editedBy: ObjectId;
  editedAt: Date;
  changes: string;
}
