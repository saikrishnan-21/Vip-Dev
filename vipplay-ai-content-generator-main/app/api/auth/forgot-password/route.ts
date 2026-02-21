import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase, Collections } from '@/lib/mongodb';
import { User } from '@/lib/types/user';
import { z } from 'zod';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Find user by email (case-insensitive)
    const user = await usersCollection.findOne({
      email: validatedData.email.toLowerCase(),
    });

    // Always return success message to prevent user enumeration
    // Even if user doesn't exist, we show the same message
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${validatedData.email}`);
      return NextResponse.json(
        {
          success: true,
          message: 'If the email exists, a reset link will be sent to your email address.',
        },
        { status: 200 }
      );
    }

    // Generate reset token (32 random bytes as hex)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpires,
          updatedAt: new Date(),
        },
      }
    );

    // In production, send email here
    // For now, we'll log the reset link
    const resetUrl = `${request.headers.get('origin')}/reset-password?token=${resetToken}`;

    console.log('==============================================');
    console.log('PASSWORD RESET REQUESTED');
    console.log('==============================================');
    console.log(`Email: ${user.email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Expires: ${resetTokenExpires.toLocaleString()}`);
    console.log('==============================================');

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json(
      {
        success: true,
        message: 'If the email exists, a reset link will be sent to your email address.',
        // For development only - remove in production
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);

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
        message: 'An error occurred while processing your request',
      },
      { status: 500 }
    );
  }
}
