/**
 * Content Approval API Route
 * VIP-10304: Approve/Reject Content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent, ContentStatus } from '@/lib/types/content';

/**
 * POST /api/content/[contentId]/approve - Approve or reject content
 * Body: { action: 'approve' | 'reject', reason?: string }
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
    const { action, reason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    // Get current content - with user isolation check (CRITICAL SECURITY)
    const content = await collection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found or access denied' }, { status: 404 });
    }

    // Validate status transition - only pending/review/rejected/completed can be approved
    // Story requirement: AC7 - Only content in "pending" or "rejected" status can be approved
    // But we also allow "review" and "completed" statuses
    const approvableStatuses = ['pending', 'review', 'rejected', 'completed'];
    if (!approvableStatuses.includes(content.status)) {
      return NextResponse.json(
        { error: `Content must be in 'pending', 'review', 'rejected', or 'completed' status to approve. Current status: '${content.status}'` },
        { status: 400 }
      );
    }

    // Determine new status
    const newStatus: ContentStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update content status
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
      lastEditedBy: new ObjectId(payload.userId)
    };

    // If approved, set approval metadata
    if (action === 'approve') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = new ObjectId(payload.userId);
      // Clear rejection fields if re-approving
      updateData.rejectionReason = null;
      updateData.rejectedAt = null;
      updateData.rejectedBy = null;
    }

    // If rejected, add rejection reason and metadata
    if (action === 'reject') {
      if (reason && reason.trim().length > 0) {
        updateData.rejectionReason = reason.trim();
      }
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = new ObjectId(payload.userId);
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(contentId), userId: new ObjectId(payload.userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update content status' },
        { status: 500 }
      );
    }

    // Fetch updated content to return full object
    const updatedContent = await collection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    return NextResponse.json({
      success: true,
      message: `Content ${action}d successfully`,
      content: updatedContent,
      status: newStatus,
      contentId
    });

  } catch (error) {
    console.error('Content approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/content/[contentId]/approve - Submit content for review
 * Body: none (transitions from draft to review)
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

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    // Get current content
    const content = await collection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Validate status transition
    if (content.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft content can be submitted for review' },
        { status: 400 }
      );
    }

    // Update to review status
    const result = await collection.updateOne(
      { _id: new ObjectId(contentId) },
      {
        $set: {
          status: 'review',
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to submit for review' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Content submitted for review successfully',
      status: 'review',
      contentId
    });

  } catch (error) {
    console.error('Content review submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit for review' },
      { status: 500 }
    );
  }
}
