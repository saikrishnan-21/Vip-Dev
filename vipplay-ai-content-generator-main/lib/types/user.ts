import { ObjectId } from 'mongodb';

export type UserRole = 'user' | 'superadmin';

export interface User {
  _id?: ObjectId;
  email: string;
  password?: string; // Hashed with bcrypt (legacy field)
  passwordHash?: string; // Hashed with bcrypt (current field)
  fullName: string;
  company?: string;
  bio?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  defaultTone?: string;
  defaultWordCount?: number;
}

export interface UserPublic {
  _id: string;
  email: string;
  fullName: string;
  company?: string;
  bio?: string;
  role: UserRole;
  createdAt: Date;
  preferences?: UserPreferences;
}

// Registration request payload
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

// Registration response
export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: UserPublic;
}

// Login request payload
export interface LoginRequest {
  email: string;
  password: string;
}

// Login response
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: UserPublic;
  token?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
