import { ObjectId } from 'mongodb';

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format?: string;
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface ModelGroup {
  _id?: ObjectId;
  name: string;
  description: string;
  models: string[]; // Array of model names
  routingStrategy: 'round-robin' | 'least-load' | 'priority' | 'random';
  priority?: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface ModelGroupPublic {
  _id: string;
  name: string;
  description: string;
  models: string[];
  routingStrategy: string;
  priority?: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConfiguration {
  _id?: ObjectId;
  key: string;
  value: any;
  description?: string;
  category: 'models' | 'routing' | 'performance' | 'limits' | 'general';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}

export interface ModelTestResult {
  model: string;
  success: boolean;
  responseTime?: number;
  error?: string;
  response?: string;
  testedAt: Date;
}

export interface ConfigurationExport {
  version: string;
  exportedAt: Date;
  modelGroups: ModelGroup[];
  configurations: AIConfiguration[];
}
