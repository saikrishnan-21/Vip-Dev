/**
 * Send Email Notifications API Route
 * VIP-10605: Email Notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { EmailNotification, NotificationSettings } from '@/lib/types/export';

/**
 * POST /api/notifications/send - Send email notification
 * Body: { subject, template, data }
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
    const { subject, template, data } = body;

    if (!subject || !template) {
      return NextResponse.json(
        { error: 'Subject and template are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const settingsCollection = db.collection<NotificationSettings>('notification_settings');
    const notificationsCollection = db.collection<EmailNotification>('email_notifications');

    const userId = new ObjectId(payload.userId);

    // Get user notification settings
    const settings = await settingsCollection.findOne({ userId });

    if (!settings) {
      return NextResponse.json(
        { error: 'Notification settings not found. Please configure notifications first.' },
        { status: 404 }
      );
    }

    // Check if user has verified email
    if (!settings.emailVerified) {
      return NextResponse.json(
        { error: 'Email not verified. Please verify your email address first.' },
        { status: 400 }
      );
    }

    // Create notification record
    const now = new Date();
    const notification: EmailNotification = {
      userId,
      email: settings.email,
      subject,
      template,
      data: data || {},
      status: 'pending',
      createdAt: now
    };

    const result = await notificationsCollection.insertOne(notification);

    // In production, send actual email via service (SendGrid, AWS SES, etc.)
    try {
      await sendEmail(settings.email, subject, template, data);

      // Update notification as sent
      await notificationsCollection.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            status: 'sent',
            sentAt: new Date()
          }
        }
      );

      return NextResponse.json({
        message: 'Email notification sent successfully',
        notificationId: result.insertedId
      });

    } catch (emailError: any) {
      // Update notification as failed
      await notificationsCollection.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            status: 'failed',
            error: emailError.message
          }
        }
      );

      return NextResponse.json(
        { error: 'Failed to send email', details: emailError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/send - Get notification history
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();
    const collection = db.collection<EmailNotification>('email_notifications');

    const filter: any = { userId: new ObjectId(payload.userId) };
    if (status) {
      filter.status = status;
    }

    const total = await collection.countDocuments(filter);

    const notifications = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Notification history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification history', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Send email via email service
 * In production, integrate with SendGrid, AWS SES, or similar
 */
async function sendEmail(
  to: string,
  subject: string,
  template: string,
  data: any
): Promise<void> {
  // Placeholder implementation
  // In production, use actual email service:
  //
  // SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, subject, html: renderTemplate(template, data) });
  //
  // AWS SES:
  // const ses = new AWS.SES();
  // await ses.sendEmail({ ... }).promise();
  //
  // Nodemailer:
  // const transporter = nodemailer.createTransporter({ ... });
  // await transporter.sendMail({ to, subject, html: renderTemplate(template, data) });

  console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Template: ${template}`);

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Success (in production, check actual email service response)
}
