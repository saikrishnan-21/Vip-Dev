/**
 * Content Management API Route
 * VIP-10301: Review Generated Content
 * VIP-10307: Content List/Filter
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent, ContentStatus } from '@/lib/types/content';

/**
 * GET /api/content - List and filter content
 * Query params: status, sourceType, limit, offset, search
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
    const status = searchParams.get('status') as ContentStatus | null;
    const sourceType = searchParams.get('sourceType');
    
    // Validate and parse limit
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be a positive integer' },
        { status: 400 }
      );
    }
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100 items per request' },
        { status: 400 }
      );
    }
    
    // Validate and parse offset or page
    const offsetParam = searchParams.get('offset');
    const pageParam = searchParams.get('page');
    let offset = 0;
    
    if (offsetParam) {
      offset = parseInt(offsetParam, 10);
      if (isNaN(offset) || offset < 0) {
        return NextResponse.json(
          { error: 'Invalid offset parameter. Must be a non-negative integer' },
          { status: 400 }
        );
      }
    } else if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (isNaN(page) || page < 1) {
        return NextResponse.json(
          { error: 'Invalid page parameter. Must be a positive integer' },
          { status: 400 }
        );
      }
      offset = (page - 1) * limit;
    }
    
    const search = searchParams.get('search');
    
    // Validate status if provided
    // Note: Accept "pending" as alias for "review" for backward compatibility
    const validStatuses: ContentStatus[] = [
      'draft',
      'review',
      'approved',
      'published',
      'archived',
      'rejected',
      'completed',
    ];
    let normalizedStatus: ContentStatus | null = status;
    
    if (status) {
      // Map "pending" to "review" for backward compatibility
      if (status === 'pending') {
        normalizedStatus = 'review';
      } else if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}, or 'pending' (alias for 'review')` },
          { status: 400 }
        );
      }
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    // Build filter query
    const filter: any = { userId: new ObjectId(payload.userId) };

    if (normalizedStatus) {
      // Support both "review" and "pending" status values in database
      filter.status = { $in: normalizedStatus === 'review' ? ['review', 'pending'] : [normalizedStatus] };
    }

    if (sourceType) {
      filter.sourceType = sourceType;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await collection.countDocuments(filter);

    // Fetch content with pagination
    const content = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Transform content to match frontend expectations
    // Map nested fields: metadata.wordCount -> wordCount, seoAnalysis.score -> seoScore
    const transformedContent = content.map((item: any) => {
      const transformed: any = {
        _id: item._id.toString(),
        title: item.title,
        status: item.status,
        content: item.content,
        summary: item.summary,
        keywords: item.keywords || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        // Map nested fields to flat structure for frontend
        wordCount: item.metadata?.wordCount || item.wordCount || undefined,
        seoScore: item.seoAnalysis?.score || item.seoScore || undefined,
        readabilityScore: item.seoAnalysis?.readabilityScore || item.readabilityScore || undefined,
      };
      return transformed;
    });

    return NextResponse.json({
      success: true,
      content: transformedContent,
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Content list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content - Create new content
 * Body: { title, content, summary?, sourceType, sourceData?, keywords? }
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

    const body = await request.json();
    const { title, content, summary, sourceType, sourceData, keywords } = body;

    // Validation
    if (!title || !content || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, sourceType' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    const now = new Date();
    const userId = new ObjectId(payload.userId);

    const newContent: GeneratedContent = {
      userId,
      title,
      content,
      summary,
      status: 'draft',
      version: 1,
      sourceType,
      sourceData,
      keywords,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      lastEditedBy: userId
    };

    const result = await collection.insertOne(newContent);

    return NextResponse.json({
      message: 'Content created successfully',
      contentId: result.insertedId,
      content: { ...newContent, _id: result.insertedId }
    }, { status: 201 });

  } catch (error) {
    console.error('Content creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
