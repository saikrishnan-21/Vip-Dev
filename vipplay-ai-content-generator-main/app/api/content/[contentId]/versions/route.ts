/**
 * Content Version Control API Route
 * VIP-10303: Version Control
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent, ContentVersion } from '@/lib/types/content';

/**
 * GET /api/content/[contentId]/versions - Get version history
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
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const contentCollection = db.collection<GeneratedContent>('generated_content');
    const versionsCollection = db.collection<ContentVersion>('content_versions');

    // Verify content exists and belongs to user
    const content = await contentCollection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Get all versions for this content
    const versions = await versionsCollection
      .find({ contentId: new ObjectId(contentId) })
      .sort({ versionNumber: -1 })
      .toArray();

    return NextResponse.json({
      currentVersion: content.version,
      versions
    });

  } catch (error) {
    console.error('Version fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content/[contentId]/versions - Create new version
 * Body: { content, changes }
 */
export async function POST(
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
    const { content, changes } = body;

    if (!content || !changes) {
      return NextResponse.json(
        { error: 'Missing required fields: content, changes' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const contentCollection = db.collection<GeneratedContent>('generated_content');
    const versionsCollection = db.collection<ContentVersion>('content_versions');

    // Get current content
    const currentContent = await contentCollection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!currentContent) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Save current version to history
    const currentVersion: ContentVersion = {
      contentId: new ObjectId(contentId),
      versionNumber: currentContent.version,
      content: currentContent.content,
      editedBy: new ObjectId(payload.userId),
      editedAt: new Date(),
      changes: changes
    };

    await versionsCollection.insertOne(currentVersion);

    // Update main content with new version
    const newVersion = currentContent.version + 1;
    await contentCollection.updateOne(
      { _id: new ObjectId(contentId) },
      {
        $set: {
          content: content,
          version: newVersion,
          previousVersionId: currentContent._id,
          updatedAt: new Date(),
          lastEditedBy: new ObjectId(payload.userId),
          // Reset status to draft when creating new version
          status: 'draft'
        }
      }
    );

    return NextResponse.json({
      message: 'New version created successfully',
      version: newVersion,
      previousVersion: currentContent.version
    });

  } catch (error) {
    console.error('Version creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
