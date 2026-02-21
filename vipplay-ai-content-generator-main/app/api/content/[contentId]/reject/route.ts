/**
 * Content Rejection API Route
 * VIP-10305: Reject Content with Notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';

/**
 * POST /api/content/[contentId]/reject - Reject content with notes
 * Body: { notes: "string (10-500 chars)" }
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
    const { notes } = body;

    // Validate notes if provided (optional)
    let trimmedNotes = '';
    if (notes) {
      if (typeof notes !== 'string') {
      return NextResponse.json(
          { error: 'Rejection notes must be a string' },
        { status: 400 }
      );
    }

      trimmedNotes = notes.trim();
    if (trimmedNotes.length > 500) {
      return NextResponse.json(
        { error: 'Rejection notes must not exceed 500 characters' },
        { status: 400 }
      );
      }
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>('generated_content');

    // Get current content with user isolation
    const content = await collection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId),
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found or access denied' }, { status: 404 });
    }

    // Validate status - can only reject pending, approved, or completed content
    if (content.status !== 'draft' && content.status !== 'review' && content.status !== 'approved' && content.status !== 'completed') {
      return NextResponse.json(
        { error: `Cannot reject content in ${content.status} status. Only draft, review, approved, or completed content can be rejected.` },
        { status: 400 }
      );
    }

    // Update content status to rejected
    const updateData: any = {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: new ObjectId(payload.userId),
          updatedAt: new Date(),
          lastEditedBy: new ObjectId(payload.userId),
    };
    if (trimmedNotes) {
      updateData.rejectionReason = trimmedNotes;
      }
    const result = await collection.updateOne(
      { _id: new ObjectId(contentId), userId: new ObjectId(payload.userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to reject content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content rejected successfully',
      contentId,
      status: 'rejected',
    });
  } catch (error) {
    console.error('Content rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to process rejection' },
      { status: 500 }
    );
  }
}
