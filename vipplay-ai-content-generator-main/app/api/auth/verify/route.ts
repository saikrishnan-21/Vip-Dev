import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User, UserPublic } from '@/lib/types/user';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'No token provided',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }

    // Get user from database to ensure they still exist
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    const user = await usersCollection.findOne({
      _id: new ObjectId(payload.userId),
    });

    if (!user) {
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
      _id: user._id!.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      preferences: user.preferences,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Token is valid',
        user: userPublic,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token verification error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Token verification failed',
      },
      { status: 500 }
    );
  }
}
