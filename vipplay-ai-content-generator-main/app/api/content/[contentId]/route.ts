/**
 * Individual Content Management API Route
 * VIP-10302: Edit Content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';

/**
 * GET /api/content/[contentId] - Get single content by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { contentId } = await params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    const content = await collection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Transform content to match frontend expectations
    // Map nested fields: metadata.wordCount -> wordCount, seoAnalysis.score -> seoScore
    const contentAny = content as any;
    const transformed: any = {
      _id: content._id.toString(),
      title: content.title,
      status: content.status,
      content: content.content,
      summary: content.summary,
      keywords: content.keywords || [],
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
      generatedAt: content.createdAt, // Use createdAt as generatedAt if not present
      // Map nested fields to flat structure for frontend
      wordCount: contentAny.metadata?.wordCount || contentAny.wordCount || undefined,
      seoScore: contentAny.seoAnalysis?.score || contentAny.seoScore || undefined,
      readabilityScore: contentAny.seoAnalysis?.readabilityScore || contentAny.readabilityScore || undefined,
      // Include images metadata
      imagesGenerated: contentAny.imagesGenerated || contentAny.metadata?.images_generated || 0,
      images: contentAny.images || contentAny.metadata?.images || [],
      // Include full nested objects for detailed view
      metadata: contentAny.metadata || undefined,
      seoAnalysis: contentAny.seoAnalysis || undefined,
      readabilityAnalysis: contentAny.readabilityAnalysis || undefined,
      sourceType: contentAny.sourceType || undefined,
      sourceData: contentAny.sourceData || undefined,
    };
    
    // Debug logging for images
    if (transformed.imagesGenerated > 0 || transformed.images?.length > 0) {
      console.log(`[Content API] Article ${content._id} has images:`, {
        imagesGenerated: transformed.imagesGenerated,
        imagesCount: transformed.images?.length || 0,
        imageUrls: transformed.images?.map((img: any) => img.url).filter(Boolean) || []
      });
    }

    return NextResponse.json({ content: transformed });

  } catch (error) {
    console.error('Content fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/content/[contentId] - Edit content
 * Creates new version when significant changes are made
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { contentId } = await params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, content, summary, keywords, metaDescription } = body;

    // Validation
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title is required and must be a non-empty string' },
          { status: 400 }
        );
      }
      if (title.length > 500) {
        return NextResponse.json(
          { error: 'Title must be 500 characters or less' },
          { status: 400 }
        );
      }
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Content is required and must be a non-empty string' },
          { status: 400 }
        );
      }
      if (content.length < 50) {
        return NextResponse.json(
          { error: 'Content must be at least 50 characters' },
          { status: 400 }
        );
      }
      if (content.length > 50000) {
        return NextResponse.json(
          { error: 'Content must be 50,000 characters or less' },
          { status: 400 }
        );
      }
    }

    if (keywords !== undefined) {
      if (!Array.isArray(keywords)) {
        return NextResponse.json(
          { error: 'Keywords must be an array' },
          { status: 400 }
        );
      }
      if (keywords.length > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 keywords allowed' },
          { status: 400 }
        );
      }
      // Validate each keyword
      for (const keyword of keywords) {
        if (typeof keyword !== 'string' || keyword.trim().length === 0) {
          return NextResponse.json(
            { error: 'Each keyword must be a non-empty string' },
            { status: 400 }
          );
        }
        if (keyword.length > 50) {
          return NextResponse.json(
            { error: 'Each keyword must be 50 characters or less' },
            { status: 400 }
          );
        }
      }
    }

    if (metaDescription !== undefined && metaDescription !== null) {
      if (typeof metaDescription !== 'string') {
        return NextResponse.json(
          { error: 'Meta description must be a string' },
          { status: 400 }
        );
      }
      if (metaDescription.length > 160) {
        return NextResponse.json(
          { error: 'Meta description must be 160 characters or less' },
          { status: 400 }
        );
      }
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    // Get current content
    const currentContent = await collection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!currentContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Check if content is editable (exclude published/archived)
    const editableStatuses = ['pending', 'review', 'approved', 'draft', 'completed', 'rejected'];
    if (!editableStatuses.includes(currentContent.status)) {
      return NextResponse.json(
        {
          error: `Cannot edit content with status '${currentContent.status}'. Allowed statuses: ${editableStatuses.join(
            ', '
          )}.`,
        },
        { status: 400 }
      );
    }

    // Build update object
    const updateFields: any = {
      updatedAt: new Date(),
      lastEditedBy: new ObjectId(payload.userId)
    };

    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (summary !== undefined) updateFields.summary = summary;
    if (keywords !== undefined) updateFields.keywords = keywords;
    if (metaDescription !== undefined) updateFields.metaDescription = metaDescription;

    // Update the content
    const result = await collection.updateOne(
      { _id: new ObjectId(contentId) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes made' },
        { status: 400 }
      );
    }

    // Fetch updated content
    const updatedContent = await collection.findOne({
      _id: new ObjectId(contentId)
    });

    return NextResponse.json({
      message: 'Content updated successfully',
      content: updatedContent
    });

  } catch (error) {
    console.error('Content update error:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/[contentId] - Delete content
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { contentId } = await params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    const result = await collection.deleteOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Content deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
