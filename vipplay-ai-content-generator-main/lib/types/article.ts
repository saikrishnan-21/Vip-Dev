import { ObjectId } from 'mongodb';

export interface Article {
  _id?: ObjectId;
  sourceId: ObjectId;
  userId: ObjectId;
  title: string;
  content: string; // Full content (markdown or text)
  summary?: string;
  url?: string;
  guid?: string; // RSS GUID for duplicate detection
  author?: string;
  publishedAt?: Date;
  fetchedAt: Date;
  imageUrl?: string;
  tags?: string[];
  hasEmbedding?: boolean; // Whether embedding has been generated
  embeddingModel?: string; // Model used for embedding (e.g., "nomic-embed-text")
  weaviateUuid?: string; // Weaviate object UUID reference
  createdAt: Date;
  updatedAt?: Date;
}

export interface ArticlePublic {
  _id: string;
  sourceId: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  url?: string;
  author?: string;
  publishedAt?: Date;
  fetchedAt: Date;
  imageUrl?: string;
  tags?: string[];
  createdAt: Date;
}

export interface RSSItem {
  title: string;
  link?: string;
  description?: string;
  content?: string;
  pubDate?: string;
  author?: string;
  guid?: string;
  enclosure?: {
    url?: string;
    type?: string;
  };
  categories?: string[];
}

export interface RSSFeed {
  title?: string;
  description?: string;
  link?: string;
  items: RSSItem[];
}
