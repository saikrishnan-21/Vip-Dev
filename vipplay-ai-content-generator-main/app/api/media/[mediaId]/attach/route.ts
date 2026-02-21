/**
 * Media Attachment API Route
 * VIP-10405: Attach Media to Content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { MediaAsset } from '@/lib/types/media';
import type { GeneratedContent } from '@/lib/types/content';

/**
 * POST /api/media/[mediaId]/attach - Attach media to content
 * Body: { contentId }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
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

    const { mediaId } = await params;

    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const body = await request.json();
    const { contentId } = body;

    if (!contentId || !ObjectId.isValid(contentId)) {
      return NextResponse.json(
        { error: 'Valid content ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const mediaCollection = db.collection<MediaAsset>(Collections.MEDIA);
    const contentCollection = db.collection<GeneratedContent>('generated_content');

    // Verify media exists and belongs to user
    const media = await mediaCollection.findOne({
      _id: new ObjectId(mediaId),
      userId: new ObjectId(payload.userId)
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Verify content exists and belongs to user
    const content = await contentCollection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const contentObjectId = new ObjectId(contentId);

    // Check if already attached
    const alreadyAttached = media.usedInContent.some(
      id => id.toString() === contentObjectId.toString()
    );

    if (alreadyAttached) {
      return NextResponse.json(
        { error: 'Media already attached to this content' },
        { status: 400 }
      );
    }

    // Attach media to content
    await mediaCollection.updateOne(
      { _id: new ObjectId(mediaId) },
      {
        $push: { usedInContent: contentObjectId },
        $inc: { usageCount: 1 },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      message: 'Media attached to content successfully',
      mediaId,
      contentId
    });

  } catch (error) {
    console.error('Media attach error:', error);
    return NextResponse.json(
      { error: 'Failed to attach media' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/[mediaId]/attach - Detach media from content
 * Query param: contentId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
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

    const { mediaId } = await params;

    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId || !ObjectId.isValid(contentId)) {
      return NextResponse.json(
        { error: 'Valid content ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const mediaCollection = db.collection<MediaAsset>(Collections.MEDIA);

    // Verify media exists and belongs to user
    const media = await mediaCollection.findOne({
      _id: new ObjectId(mediaId),
      userId: new ObjectId(payload.userId)
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const contentObjectId = new ObjectId(contentId);

    // Check if attached
    const isAttached = media.usedInContent.some(
      id => id.toString() === contentObjectId.toString()
    );

    if (!isAttached) {
      return NextResponse.json(
        { error: 'Media is not attached to this content' },
        { status: 400 }
      );
    }

    // Detach media from content
    await mediaCollection.updateOne(
      { _id: new ObjectId(mediaId) },
      {
        $pull: { usedInContent: contentObjectId },
        $inc: { usageCount: -1 },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      message: 'Media detached from content successfully',
      mediaId,
      contentId
    });

  } catch (error) {
    console.error('Media detach error:', error);
    return NextResponse.json(
      { error: 'Failed to detach media' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/[mediaId]/attach - Get all content using this media
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
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

    const { mediaId } = await params;

    if (!ObjectId.isValid(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const mediaCollection = db.collection<MediaAsset>(Collections.MEDIA);
    const contentCollection = db.collection<GeneratedContent>('generated_content');

    // Get media
    const media = await mediaCollection.findOne({
      _id: new ObjectId(mediaId),
      userId: new ObjectId(payload.userId)
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Get all content using this media
    const content = await contentCollection
      .find({
        _id: { $in: media.usedInContent }
      })
      .project({ title: 1, status: 1, createdAt: 1 })
      .toArray();

    // Convert ObjectIds to strings for JSON serialization
    const contentWithStringIds = content.map((item: any) => ({
      ...item,
      _id: item._id.toString()
    }));

    return NextResponse.json({
      mediaId,
      usageCount: media.usageCount,
      content: contentWithStringIds
    });

  } catch (error) {
    console.error('Media usage fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media usage' },
      { status: 500 }
    );
  }
}
