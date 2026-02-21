import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User } from '@/lib/types/user';

/**
 * POST /api/bootstrap/superadmin
 * One-time bootstrap endpoint to promote a user to superadmin and optionally reset password
 * WARNING: This should be removed or protected in production
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email is required',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Find the user
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Prepare update fields
    const updateFields: any = {
      role: 'superadmin',
      updatedAt: new Date(),
    };

    // If password provided, hash and include it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateFields.password = hashedPassword;
    }

    // Update to superadmin (and optionally password)
    await usersCollection.updateOne({ email }, { $set: updateFields });

    return NextResponse.json(
      {
        success: true,
        message: `User ${email} promoted to superadmin${password ? ' and password reset' : ''}`,
        user: {
          email: user.email,
          fullName: user.fullName,
          role: 'superadmin',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bootstrap superadmin error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to promote user to superadmin',
      },
      { status: 500 }
    );
  }
}
