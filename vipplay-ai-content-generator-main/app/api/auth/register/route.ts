import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDatabase, Collections } from '@/lib/mongodb';
import { registerSchema } from '@/lib/validations/auth';
import { User, UserPublic, RegisterResponse } from '@/lib/types/user';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Get database connection
    const db = await getDatabase();
    const usersCollection = db.collection<User>(Collections.USERS);

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: validatedData.email.toLowerCase(),
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists',
        } as RegisterResponse,
        { status: 400 }
      );
    }

    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user document
    const now = new Date();
    const newUser: Omit<User, '_id'> = {
      email: validatedData.email.toLowerCase(),
      password: hashedPassword,
      fullName: validatedData.fullName,
      role: 'user', // Default role
      createdAt: now,
      updatedAt: now,
      preferences: {
        theme: 'system',
        emailNotifications: true,
        defaultTone: 'Professional',
        defaultWordCount: 1500,
      },
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser as User);

    // Create public user object (without password)
    const userPublic: UserPublic = {
      _id: result.insertedId.toString(),
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      createdAt: newUser.createdAt,
      preferences: newUser.preferences,
    };

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: userPublic,
      } as RegisterResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

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

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during registration',
      } as RegisterResponse,
      { status: 500 }
    );
  }
}
