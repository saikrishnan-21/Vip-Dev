/**
 * Media Library API Route
 * VIP-10401: Upload Media Assets
 * VIP-10403: List & Search Media
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { MediaAsset, MediaType } from '@/lib/types/media';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * GET /api/media - List and search media assets
 * Query params: type, tags, category, search, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as MediaType | null;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();
    const collection = db.collection<MediaAsset>(Collections.MEDIA);

    // Build filter query
    const filter: any = { userId: new ObjectId(payload.userId) };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (search) {
      filter.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { altText: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await collection.countDocuments(filter);

    // Fetch media with pagination
    const media = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    const mediaWithStringIds = media.map((item: any) => ({
      ...item,
      _id: item._id.toString(),
      userId: item.userId.toString(),
      usedInContent: item.usedInContent?.map((id: any) => id.toString()) || []
    }));

    return NextResponse.json({
      success: true,
      media: mediaWithStringIds,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Media list error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch media',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/media - Upload media asset
 * Body: multipart/form-data with file and metadata
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tags = formData.get('tags') as string;
    const category = formData.get('category') as string;
    const altText = formData.get('altText') as string;
    const caption = formData.get('caption') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Determine media type
    let mediaType: MediaType;
    if (file.type.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.type.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.type.startsWith('audio/')) {
      mediaType = 'audio';
    } else {
      mediaType = 'document';
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.name);
    const filename = `${timestamp}-${randomString}${ext}`;

    // Save file to disk (in production, use cloud storage like S3)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    // Get image dimensions if it's an image
    let width: number | undefined;
    let height: number | undefined;

    if (mediaType === 'image') {
      // In production, use sharp or similar library to get dimensions
      // For now, we'll leave them undefined
    }

    const db = await getDatabase();
    const collection = db.collection<MediaAsset>(Collections.MEDIA);

    const now = new Date();
    const userId = new ObjectId(payload.userId);

    const newMedia: MediaAsset = {
      userId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      type: mediaType,
      source: 'upload',
      url,
      width,
      height,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      category: category || undefined,
      altText: altText || undefined,
      caption: caption || undefined,
      usedInContent: [],
      usageCount: 0,
      createdAt: now,
      updatedAt: now
    } as any; // Type assertion to allow status field
    
    // Add status field (required by database schema)
    (newMedia as any).status = 'active';

    const result = await collection.insertOne(newMedia);

    return NextResponse.json({
      message: 'Media uploaded successfully',
      mediaId: result.insertedId,
      media: { ...newMedia, _id: result.insertedId }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload media',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
