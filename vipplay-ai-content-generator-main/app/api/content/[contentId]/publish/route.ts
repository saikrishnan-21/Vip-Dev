/**
 * Content Publishing API Route
 * VIP-10305: Publish Content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';

/**
 * POST /api/content/[contentId]/publish - Publish approved content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { contentId: string } }
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

    // Check if user has permission to publish (admin or editor)
    if (payload.role !== 'admin' && payload.role !== 'editor') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins and editors can publish content.' },
        { status: 403 }
      );
    }

    const { contentId } = params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>('generated_content');

    // Get current content
    const content = await collection.findOne({
      _id: new ObjectId(contentId)
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Validate status - content must be approved to publish
    if (content.status !== 'approved') {
      return NextResponse.json(
        { error: 'Content must be approved before publishing' },
        { status: 400 }
      );
    }

    // Check if already scheduled
    if (content.scheduledFor && new Date(content.scheduledFor) > new Date()) {
      return NextResponse.json(
        { error: 'Content is scheduled for future publishing. Cancel schedule first.' },
        { status: 400 }
      );
    }

    // Publish content
    const result = await collection.updateOne(
      { _id: new ObjectId(contentId) },
      {
        $set: {
          status: 'published',
          publishedAt: new Date(),
          updatedAt: new Date(),
          lastEditedBy: new ObjectId(payload.userId)
        },
        $unset: {
          scheduledFor: ''
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to publish content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Content published successfully',
      publishedAt: new Date(),
      contentId
    });

  } catch (error) {
    console.error('Content publish error:', error);
    return NextResponse.json(
      { error: 'Failed to publish content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/[contentId]/publish - Unpublish content (archive)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { contentId: string } }
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

    // Check if user has permission
    if (payload.role !== 'admin' && payload.role !== 'editor') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { contentId } = params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>('generated_content');

    // Get current content
    const content = await collection.findOne({
      _id: new ObjectId(contentId)
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Validate status
    if (content.status !== 'published') {
      return NextResponse.json(
        { error: 'Content is not published' },
        { status: 400 }
      );
    }

    // Archive content
    const result = await collection.updateOne(
      { _id: new ObjectId(contentId) },
      {
        $set: {
          status: 'archived',
          updatedAt: new Date(),
          lastEditedBy: new ObjectId(payload.userId)
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to archive content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Content archived successfully',
      contentId
    });

  } catch (error) {
    console.error('Content archive error:', error);
    return NextResponse.json(
      { error: 'Failed to archive content' },
      { status: 500 }
    );
  }
}
