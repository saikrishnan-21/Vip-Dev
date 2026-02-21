import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateToken } from '@/lib/auth/jwt';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User, UserPublic, LoginResponse } from '@/lib/types/user';
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
        } as LoginResponse,
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify existing token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired token',
        } as LoginResponse,
        { status: 401 }
      );
    }

    // Get user from database
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
        } as LoginResponse,
        { status: 404 }
      );
    }

    // Generate new token with fresh expiration
    const newToken = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
    });

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
        message: 'Token refreshed successfully',
        user: userPublic,
        token: newToken,
      } as LoginResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Token refresh error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Token refresh failed',
      } as LoginResponse,
      { status: 500 }
    );
  }
}
