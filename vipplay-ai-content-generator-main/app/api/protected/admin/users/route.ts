import { NextRequest, NextResponse } from 'next/server';
import { withSuperadmin } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User, UserPublic, JWTPayload } from '@/lib/types/user';

/**
 * GET /api/protected/admin/users
 * List all users (superadmin only)
 * Protected route - requires superadmin role
 */
async function handler(request: NextRequest, user: JWTPayload) {
  try {
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get users from database
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    const [users, total] = await Promise.all([
      usersCollection
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      usersCollection.countDocuments({}),
    ]);

    // Convert to public user objects
    const publicUsers: UserPublic[] = users.map((u) => ({
      _id: u._id!.toString(),
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      createdAt: u.createdAt,
      preferences: u.preferences,
    }));

    return NextResponse.json(
      {
        success: true,
        users: publicUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List users error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve users',
      },
      { status: 500 }
    );
  }
}

// Export protected handler (superadmin only)
export const GET = withSuperadmin(handler);
