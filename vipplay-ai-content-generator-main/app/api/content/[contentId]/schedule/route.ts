/**
 * Content Scheduling API Route
 * VIP-10306: Schedule Publishing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';

/**
 * POST /api/content/[contentId]/schedule - Schedule content for publishing
 * Body: { scheduledFor: ISO date string }
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

    // Check if user has permission to schedule (admin or editor)
    if (payload.role !== 'admin' && payload.role !== 'editor') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins and editors can schedule content.' },
        { status: 403 }
      );
    }

    const { contentId } = await params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const body = await request.json();
    const { scheduledFor } = body;

    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor date is required' },
        { status: 400 }
      );
    }

    // Validate date format
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Ensure scheduled date is in the future
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled date must be in the future' },
        { status: 400 }
      );
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

    // Validate status - content must be approved to schedule
    if (content.status !== 'approved') {
      return NextResponse.json(
        { error: 'Content must be approved before scheduling' },
        { status: 400 }
      );
    }

    // Check if already published
    if (content.status === 'published') {
      return NextResponse.json(
        { error: 'Content is already published' },
        { status: 400 }
      );
    }

    // Schedule content
    const result = await collection.updateOne(
      { _id: new ObjectId(contentId) },
      {
        $set: {
          scheduledFor: scheduledDate,
          updatedAt: new Date(),
          lastEditedBy: new ObjectId(payload.userId)
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to schedule content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Content scheduled successfully',
      scheduledFor: scheduledDate,
      contentId
    });

  } catch (error) {
    console.error('Content schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/[contentId]/schedule - Cancel scheduled publishing
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

    // Check if user has permission
    if (payload.role !== 'admin' && payload.role !== 'editor') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { contentId } = await params;

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

    // Check if content has scheduled date
    if (!content.scheduledFor) {
      return NextResponse.json(
        { error: 'Content is not scheduled' },
        { status: 400 }
      );
    }

    // Cancel schedule
    const result = await collection.updateOne(
      { _id: new ObjectId(contentId) },
      {
        $unset: {
          scheduledFor: ''
        },
        $set: {
          updatedAt: new Date(),
          lastEditedBy: new ObjectId(payload.userId)
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to cancel schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Scheduled publishing cancelled successfully',
      contentId
    });

  } catch (error) {
    console.error('Schedule cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel schedule' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/[contentId]/schedule - Get scheduled publishing details
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
    const collection = db.collection<GeneratedContent>('generated_content');

    const content = await collection.findOne(
      { _id: new ObjectId(contentId) },
      { projection: { scheduledFor: 1, status: 1, title: 1 } }
    );

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({
      contentId,
      title: content.title,
      status: content.status,
      scheduledFor: content.scheduledFor || null,
      isScheduled: !!content.scheduledFor
    });

  } catch (error) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}
