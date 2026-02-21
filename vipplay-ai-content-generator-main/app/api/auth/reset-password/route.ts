import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase, Collections } from '@/lib/mongodb';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { User, ResetPasswordResponse } from '@/lib/types/user';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Find user with valid reset token
    const user = await usersCollection.findOne({
      resetPasswordToken: validatedData.token,
      resetPasswordExpires: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.',
        } as ResetPasswordResponse,
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Update password and clear reset token fields
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          resetPasswordToken: '',
          resetPasswordExpires: '',
        },
      }
    );

    console.log('==============================================');
    console.log('PASSWORD RESET SUCCESSFUL');
    console.log('==============================================');
    console.log(`Email: ${user.email}`);
    console.log(`Reset at: ${new Date().toLocaleString()}`);
    console.log('==============================================');

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      } as ResetPasswordResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    
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
        message: 'An error occurred while resetting your password',
      } as ResetPasswordResponse,
      { status: 500 }
    );
  }
}

