/**
 * Bulk Content Actions API Route
 * VIP-10306: Bulk Operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';

/**
 * POST /api/content/bulk-actions - Perform bulk operations on multiple content items
 * Body: { action: "approve|reject|delete", contentIds: string[], rejectionNotes?: string }
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
    const { action, contentIds, rejectionNotes } = body;

    // Validate inputs
    if (!action || !['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve, reject, or delete' },
        { status: 400 }
      );
    }

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: 'ContentIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate max 100 items
    if (contentIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 items per bulk operation' },
        { status: 400 }
      );
    }

    // Validate all IDs are valid ObjectIds
    const validIds = contentIds.map((id: string) => {
      if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid content ID: ${id}`);
      }
      return new ObjectId(id);
    });

    // Validate rejection notes if provided (optional)
    let trimmedNotes = '';
    if (action === 'reject' && rejectionNotes) {
      if (typeof rejectionNotes !== 'string') {
        return NextResponse.json(
          { error: 'Rejection notes must be a string' },
          { status: 400 }
        );
      }

      trimmedNotes = rejectionNotes.trim();
      if (trimmedNotes.length > 500) {
        return NextResponse.json(
          { error: 'Rejection notes must not exceed 500 characters' },
          { status: 400 }
        );
      }
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>('generated_content');
    const userId = new ObjectId(payload.userId);

    // Verify all items belong to user
    const items = await collection
      .find({
        _id: { $in: validIds },
        userId: userId,
      })
      .toArray();

    if (items.length !== contentIds.length) {
      return NextResponse.json(
        { error: 'Some content items not found or access denied' },
        { status: 404 }
      );
    }

    const results = [];
    let processed = 0;
    let failed = 0;
    const errors = [];

    // Process each item
    for (const item of items) {
      try {
        if (action === 'approve') {
          // Update to approved
          await collection.updateOne(
            { _id: item._id, userId: userId },
            {
              $set: {
                status: 'approved',
                updatedAt: new Date(),
                lastEditedBy: userId,
              },
            }
          );
          results.push({
            contentId: item._id.toString(),
            status: 'success',
            message: 'Approved successfully',
          });
          processed++;
        } else if (action === 'reject') {
          // Update to rejected with optional notes
          const updateData: any = {
                status: 'rejected',
                rejectedAt: new Date(),
                rejectedBy: userId,
                updatedAt: new Date(),
                lastEditedBy: userId,
          };
          if (trimmedNotes) {
            updateData.rejectionReason = trimmedNotes;
            }
          await collection.updateOne(
            { _id: item._id, userId: userId },
            { $set: updateData }
          );
          results.push({
            contentId: item._id.toString(),
            status: 'success',
            message: 'Rejected successfully',
          });
          processed++;
        } else if (action === 'delete') {
          // Delete the item
          await collection.deleteOne({ _id: item._id, userId: userId });
          results.push({
            contentId: item._id.toString(),
            status: 'success',
            message: 'Deleted successfully',
          });
          processed++;
        }
      } catch (err) {
        failed++;
        errors.push({
          contentId: item._id.toString(),
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        results.push({
          contentId: item._id.toString(),
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to process',
        });
      }
    }

    return NextResponse.json({
      success: true,
      action,
      processed,
      failed,
      total: contentIds.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk action' },
      { status: 500 }
    );
  }
}
