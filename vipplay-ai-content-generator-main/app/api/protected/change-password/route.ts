import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User, JWTPayload } from '@/lib/types/user';
import { changePasswordSchema } from '@/lib/validations/auth';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * POST /api/protected/change-password
 * Change user's password
 * Protected route - requires authentication
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = changePasswordSchema.parse(body);

    // Get database connection
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Get current user
    const currentUser = await usersCollection.findOne({
      _id: new ObjectId(user.userId),
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Verify current password (handle both 'password' and 'passwordHash' fields)
    const passwordHash = (currentUser as any).passwordHash || currentUser.password;
    if (!passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect',
        },
        { status: 401 }
      );
    }
    
    const passwordMatch = await bcrypt.compare(
      validatedData.currentPassword,
      passwordHash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect',
        },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 12);

    // Update password
    await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);

    // Handle Zod validation errors
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
        message: 'Failed to change password',
      },
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAuth(handler);
