/**
 * Notifications Management API Route
 * VIP-10605: Email Notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { NotificationSettings, EmailNotification } from '@/lib/types/export';

/**
 * GET /api/notifications - Get user notification settings
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = await getDatabase();
    const collection = db.collection<NotificationSettings>('notification_settings');

    const settings = await collection.findOne({
      userId: new ObjectId(payload.userId)
    });

    if (!settings) {
      // Return default settings
      return NextResponse.json({
        settings: {
          email: payload.email,
          emailVerified: false,
          preferences: {
            contentGenerated: true,
            contentApproved: true,
            contentPublished: true,
            exportCompleted: true,
            weeklyDigest: false
          }
        }
      });
    }

    return NextResponse.json({ settings });

  } catch (error: any) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - Create or update notification settings
 * Body: { email?, preferences? }
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { email, preferences } = body;

    const db = await getDatabase();
    const collection = db.collection<NotificationSettings>('notification_settings');

    const userId = new ObjectId(payload.userId);
    const now = new Date();

    // Check if settings exist
    const existing = await collection.findOne({ userId });

    if (existing) {
      // Update existing settings
      const updateFields: any = {
        updatedAt: now
      };

      if (email !== undefined) {
        updateFields.email = email;
        // Reset verification if email changed
        if (email !== existing.email) {
          updateFields.emailVerified = false;
        }
      }

      if (preferences !== undefined) {
        updateFields.preferences = { ...existing.preferences, ...preferences };
      }

      await collection.updateOne(
        { userId },
        { $set: updateFields }
      );

      const updated = await collection.findOne({ userId });

      return NextResponse.json({
        message: 'Notification settings updated',
        settings: updated
      });

    } else {
      // Create new settings
      const newSettings: NotificationSettings = {
        userId,
        email: email || payload.email,
        emailVerified: false,
        preferences: {
          contentGenerated: true,
          contentApproved: true,
          contentPublished: true,
          exportCompleted: true,
          weeklyDigest: false,
          ...preferences
        },
        createdAt: now,
        updatedAt: now
      };

      const result = await collection.insertOne(newSettings);

      return NextResponse.json({
        message: 'Notification settings created',
        settings: { ...newSettings, _id: result.insertedId }
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('Save notification settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save notification settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications - Update specific preference
 * Body: { preference: string, value: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { preference, value } = body;

    if (!preference || value === undefined) {
      return NextResponse.json(
        { error: 'Preference and value are required' },
        { status: 400 }
      );
    }

    const validPreferences = [
      'contentGenerated',
      'contentApproved',
      'contentPublished',
      'exportCompleted',
      'weeklyDigest'
    ];

    if (!validPreferences.includes(preference)) {
      return NextResponse.json(
        { error: `Invalid preference. Must be one of: ${validPreferences.join(', ')}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<NotificationSettings>('notification_settings');

    const userId = new ObjectId(payload.userId);

    const result = await collection.updateOne(
      { userId },
      {
        $set: {
          [`preferences.${preference}`]: value,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Notification settings not found. Create settings first.' },
        { status: 404 }
      );
    }

    const updated = await collection.findOne({ userId });

    return NextResponse.json({
      message: 'Preference updated successfully',
      settings: updated
    });

  } catch (error: any) {
    console.error('Update preference error:', error);
    return NextResponse.json(
      { error: 'Failed to update preference', details: error.message },
      { status: 500 }
    );
  }
}
