/**
 * GET /api/media/[mediaId]/image
 * Redirect to S3 image URL or serve image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { MediaAsset } from '@/lib/types/media';

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

    // Get media record
    const media = await collection.findOne({
      _id: new ObjectId(mediaId),
      userId: new ObjectId(payload.userId),
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Images are now stored in S3, so redirect to S3 URL
    if (media.url && media.url.startsWith('http')) {
      // Redirect to S3 public URL
      return NextResponse.redirect(media.url, 302);
    }

    // Fallback: if no URL, return error
    return NextResponse.json(
      { error: 'Image URL not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Image serve error:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}

