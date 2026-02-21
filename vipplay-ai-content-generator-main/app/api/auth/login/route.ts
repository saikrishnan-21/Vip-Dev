import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase, Collections } from '@/lib/mongodb';
import { loginSchema } from '@/lib/validations/auth';
import { User, UserPublic, LoginResponse } from '@/lib/types/user';
import { generateToken } from '@/lib/auth/jwt';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Request body parse error:', parseError);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request body. Expected JSON format.',
        } as LoginResponse,
        { status: 400 }
      );
    }

    // Validate input
    let validatedData;
    try {
      validatedData = loginSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            message: 'Validation failed',
            errors: validationError.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Get database connection
    let db;
    try {
      db = await getDatabase();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection failed. Please check your MongoDB configuration.',
        } as LoginResponse,
        { status: 500 }
      );
    }

    const usersCollection = db.collection<User>(Collections.USERS);

    // Find user by email (case-insensitive)
    const user = await usersCollection.findOne({
      email: validatedData.email.toLowerCase(),
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        } as LoginResponse,
        { status: 401 }
      );
    }

    // Verify password (handle both 'password' and 'passwordHash' fields for backward compatibility)
    const passwordHash = (user as any).passwordHash || user.password;
    if (!passwordHash) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        } as LoginResponse,
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(
      validatedData.password,
      passwordHash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        } as LoginResponse,
        { status: 401 }
      );
    }

    // Update last login timestamp
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Generate JWT token
    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      role: user.role,
    });

    // Create public user object (without password)
    const userPublic: UserPublic = {
      _id: user._id!.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      preferences: user.preferences,
    };

    // Return success response with token
    // Token will be stored in localStorage by client (Next.js way - simple)
    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: userPublic,
        token,
      } as LoginResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

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

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid request format',
        } as LoginResponse,
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined,
      } as LoginResponse,
      { status: 500 }
    );
  }
}
