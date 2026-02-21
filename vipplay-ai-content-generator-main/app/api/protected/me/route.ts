import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User, UserPublic, JWTPayload } from '@/lib/types/user';
import { updateProfileSchema } from '@/lib/validations/auth';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * GET /api/protected/me
 * Get current user's profile
 * Protected route - requires authentication
 */
async function getHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Get fresh user data from database
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    const userData = await usersCollection.findOne({
      _id: new ObjectId(user.userId),
    });

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Create public user object
    const userPublic: UserPublic = {
      _id: userData._id!.toString(),
      email: userData.email,
      fullName: userData.fullName,
      company: userData.company,
      bio: userData.bio,
      role: userData.role,
      createdAt: userData.createdAt,
      preferences: userData.preferences,
    };

    return NextResponse.json(
      {
        success: true,
        user: userPublic,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user profile error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve user profile',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/protected/me
 * Update current user's profile
 * Protected route - requires authentication
 */
async function patchHandler(request: NextRequest, user: JWTPayload) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = updateProfileSchema.parse(body);

    // Get database connection
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Check if email is being changed and if it's already taken
    if (validatedData.email) {
      const existingUser = await usersCollection.findOne({
        email: validatedData.email.toLowerCase(),
        _id: { $ne: new ObjectId(user.userId) }, // Exclude current user
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email already in use',
          },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Partial<User> = {
      updatedAt: new Date(),
    };

    if (validatedData.fullName) {
      updateData.fullName = validatedData.fullName;
    }

    if (validatedData.email) {
      updateData.email = validatedData.email.toLowerCase();
    }

    if (validatedData.company !== undefined) {
      updateData.company = validatedData.company || undefined;
    }

    if (validatedData.bio !== undefined) {
      updateData.bio = validatedData.bio || undefined;
    }

    if (validatedData.preferences) {
      // Merge with existing preferences
      const currentUser = await usersCollection.findOne({
        _id: new ObjectId(user.userId),
      });

      updateData.preferences = {
        ...currentUser?.preferences,
        ...validatedData.preferences,
      };
    }

    // Update user in database
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(user.userId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Create public user object
    const userPublic: UserPublic = {
      _id: result._id!.toString(),
      email: result.email,
      fullName: result.fullName,
      company: result.company,
      bio: result.bio,
      role: result.role,
      createdAt: result.createdAt,
      preferences: result.preferences,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: userPublic,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);

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
        message: 'Failed to update profile',
      },
      { status: 500 }
    );
  }
}

// Export protected handlers
export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
