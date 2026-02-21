import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User, UserPreferences, JWTPayload } from '@/lib/types/user';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
  defaultTone: z.string().optional(),
  defaultWordCount: z.number().min(100).max(5000).optional(),
});

/**
 * GET /api/protected/preferences
 * Get current user's preferences
 */
async function getHandler(request: NextRequest, user: JWTPayload) {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    const userData = await usersCollection.findOne(
      { _id: new ObjectId(user.userId) },
      { projection: { preferences: 1 } }
    );

    if (!userData) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        preferences: userData.preferences || {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get preferences error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve preferences',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/protected/preferences
 * Update user preferences (merge with existing)
 */
async function patchHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);

    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Get current preferences
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

    // Merge with existing preferences
    const updatedPreferences: UserPreferences = {
      ...currentUser.preferences,
      ...validatedData,
    };

    // Update in database
    await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $set: {
          preferences: updatedPreferences,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences updated successfully',
        preferences: updatedPreferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update preferences error:', error);

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
        message: 'Failed to update preferences',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/protected/preferences
 * Replace all preferences (not merge)
 */
async function putHandler(request: NextRequest, user: JWTPayload) {
  try {
    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);

    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Replace all preferences (don't merge)
    const newPreferences: UserPreferences = {
      theme: validatedData.theme || 'system',
      emailNotifications: validatedData.emailNotifications ?? true,
      defaultTone: validatedData.defaultTone || 'Professional',
      defaultWordCount: validatedData.defaultWordCount || 1500,
    };

    await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $set: {
          preferences: newPreferences,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences replaced successfully',
        preferences: newPreferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Replace preferences error:', error);

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
        message: 'Failed to replace preferences',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/protected/preferences
 * Reset preferences to defaults
 */
async function deleteHandler(request: NextRequest, user: JWTPayload) {
  try {
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    const defaultPreferences: UserPreferences = {
      theme: 'system',
      emailNotifications: true,
      defaultTone: 'Professional',
      defaultWordCount: 1500,
    };

    await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $set: {
          preferences: defaultPreferences,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Preferences reset to defaults',
        preferences: defaultPreferences,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset preferences error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reset preferences',
      },
      { status: 500 }
    );
  }
}

// Export protected handlers
export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
