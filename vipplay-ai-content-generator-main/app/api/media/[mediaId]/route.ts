/**
 * Individual Media Asset API Route
 * VIP-10404: Tag & Categorize Media
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { MediaAsset } from '@/lib/types/media';
import { unlink } from 'fs/promises';
import path from 'path';

/**
 * GET /api/media/[mediaId] - Get single media asset
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
    const collection = db.collection<MediaAsset>(Collections.MEDIA);

    const media = await collection.findOne({
      _id: new ObjectId(mediaId),
      userId: new ObjectId(payload.userId)
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Convert ObjectIds to strings for JSON serialization
    const mediaWithStringIds = {
      ...media,
      _id: media._id.toString(),
      userId: media.userId.toString(),
      usedInContent: media.usedInContent?.map((id: any) => id.toString()) || []
    };

    return NextResponse.json({ media: mediaWithStringIds });

  } catch (error) {
    console.error('Media fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/media/[mediaId] - Update media metadata (tags, category, etc.)
 */
export async function PATCH(
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
    const { tags, category, altText, caption } = body;

    const db = await getDatabase();
    const collection = db.collection<MediaAsset>(Collections.MEDIA);

    // Verify media exists and belongs to user
    const media = await collection.findOne({
      _id: new ObjectId(mediaId),
      userId: new ObjectId(payload.userId)
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Build update object
    const updateFields: any = {
      updatedAt: new Date()
    };

    if (tags !== undefined) {
      updateFields.tags = Array.isArray(tags) ? tags : [];
    }

    if (category !== undefined) {
      updateFields.category = category;
    }

    if (altText !== undefined) {
      updateFields.altText = altText;
    }

    if (caption !== undefined) {
      updateFields.caption = caption;
    }

    // Update media
    const result = await collection.updateOne(
      { _id: new ObjectId(mediaId) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No changes made' },
        { status: 400 }
      );
    }

    // Fetch updated media
    const updatedMedia = await collection.findOne({
      _id: new ObjectId(mediaId)
    });

    if (!updatedMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Convert ObjectIds to strings for JSON serialization
    const mediaWithStringIds = {
      ...updatedMedia,
      _id: updatedMedia._id.toString(),
      userId: updatedMedia.userId.toString(),
      usedInContent: updatedMedia.usedInContent?.map((id: any) => id.toString()) || []
    };

    return NextResponse.json({
      message: 'Media updated successfully',
      media: mediaWithStringIds
    });

  } catch (error) {
    console.error('Media update error:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/[mediaId] - Delete media asset
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

    const db = await getDatabase();
    const collection = db.collection<MediaAsset>(Collections.MEDIA);

    // Get media to check if it's being used
    const media = await collection.findOne({
      _id: new ObjectId(mediaId),
      userId: new ObjectId(payload.userId)
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Check if media is being used in content
    if (media.usedInContent && media.usedInContent.length > 0) {
      return NextResponse.json(
        {
          error: 'Media is being used in content. Remove from content first.',
          usedIn: media.usedInContent
        },
        { status: 400 }
      );
    }

    // Delete file from disk (if uploaded)
    if (media.source === 'upload') {
      try {
        const filepath = path.join(process.cwd(), 'public', media.url);
        await unlink(filepath);
      } catch (fileError) {
        console.error('File deletion error:', fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    const result = await collection.deleteOne({
      _id: new ObjectId(mediaId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('Media deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
