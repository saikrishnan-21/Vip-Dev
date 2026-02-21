import { NextRequest, NextResponse } from 'next/server';
import { withSuperadmin } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User, UserRole, JWTPayload } from '@/lib/types/user';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['user', 'superadmin']),
});

/**
 * PATCH /api/protected/admin/users/[userId]/role
 * Update user's role (superadmin only)
 * Protected route - requires superadmin role
 */
async function handler(
  request: NextRequest,
  user: JWTPayload,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Parse request body
    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    // Prevent self-demotion
    if (userId === user.userId && validatedData.role === 'user') {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot demote yourself from superadmin',
        },
        { status: 400 }
      );
    }

    // Get database connection
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Check if target user exists
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

    // Update user role
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: validatedData.role,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: `User role updated to ${validatedData.role}`,
        user: {
          _id: targetUser._id!.toString(),
          email: targetUser.email,
          fullName: targetUser.fullName,
          role: validatedData.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user role error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update user role',
      },
      { status: 500 }
    );
  }
}

// Export protected handler (superadmin only)
export const PATCH = withSuperadmin(handler);
