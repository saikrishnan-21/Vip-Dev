import { ObjectId } from 'mongodb';

export type ExportFormat = 'markdown' | 'docx' | 'pdf' | 'html';
export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExportJob {
  _id?: ObjectId;
  userId: ObjectId;
  contentId: ObjectId;
  format: ExportFormat;
  status: ExportStatus;
  options?: {
    includeMetadata?: boolean;
    includeImages?: boolean;
    template?: string;
    pageSize?: 'A4' | 'Letter';
    margins?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  };
  fileUrl?: string;
  filename?: string;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface BulkExportJob {
  _id?: ObjectId;
  userId: ObjectId;
  contentIds: ObjectId[];
  format: ExportFormat;
  status: ExportStatus;
  zipUrl?: string;
  filename?: string;
  fileSize?: number;
  totalFiles?: number;
  completedFiles?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface NotificationSettings {
  _id?: ObjectId;
  userId: ObjectId;
  email: string;
  emailVerified: boolean;
  preferences: {
    contentGenerated?: boolean;
    contentApproved?: boolean;
    contentPublished?: boolean;
    exportCompleted?: boolean;
    weeklyDigest?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailNotification {
  _id?: ObjectId;
  userId: ObjectId;
  email: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}
