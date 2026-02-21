import { NextRequest, NextResponse } from 'next/server';
import { withSuperadmin } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User, UserPublic, JWTPayload } from '@/lib/types/user';
import { ObjectId } from 'mongodb';

/**
 * GET /api/protected/admin/users/[userId]
 * Get specific user details (superadmin only)
 */
async function getHandler(
  request: NextRequest,
  user: JWTPayload,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    const targetUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    const userPublic: UserPublic = {
      _id: targetUser._id!.toString(),
      email: targetUser.email,
      fullName: targetUser.fullName,
      role: targetUser.role,
      createdAt: targetUser.createdAt,
      preferences: targetUser.preferences,
    };

    return NextResponse.json(
      {
        success: true,
        user: userPublic,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve user',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/protected/admin/users/[userId]
 * Delete user (superadmin only)
 */
async function deleteHandler(
  request: NextRequest,
  user: JWTPayload,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Prevent self-deletion
    if (userId === user.userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete your own account',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Check if user exists
    const targetUser = await usersCollection.findOne({
      _id: new ObjectId(userId),
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Delete user
    await usersCollection.deleteOne({
      _id: new ObjectId(userId),
    });

    // TODO: In production, consider:
    // 1. Soft delete (add deletedAt field instead of hard delete)
    // 2. Clean up related data (articles, generated content, etc.)
    // 3. Log the deletion for audit trail

    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully',
        deletedUser: {
          _id: targetUser._id!.toString(),
          email: targetUser.email,
          fullName: targetUser.fullName,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete user',
      },
      { status: 500 }
    );
  }
}

// Export protected handlers (superadmin only)
export const GET = withSuperadmin(getHandler);
export const DELETE = withSuperadmin(deleteHandler);
