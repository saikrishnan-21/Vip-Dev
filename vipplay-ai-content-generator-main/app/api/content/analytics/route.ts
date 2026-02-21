/**
 * Content Analytics API Route
 * VIP-10308: Content Analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';

/**
 * GET /api/content/analytics - Get content analytics and statistics
 * Query params: userId (optional for admin), startDate, endDate
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
    const requestedUserId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Determine which userId to query
    let targetUserId = payload.userId;

    // If requesting another user's analytics, check permissions
    if (requestedUserId && requestedUserId !== payload.userId) {
      if (payload.role !== 'admin') {
        return NextResponse.json(
          { error: 'Insufficient permissions to view other users analytics' },
          { status: 403 }
        );
      }
      targetUserId = requestedUserId;
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const baseFilter: any = { userId: new ObjectId(targetUserId) };
    if (Object.keys(dateFilter).length > 0) {
      baseFilter.createdAt = dateFilter;
    }

    // Get overall statistics
    const totalContent = await collection.countDocuments(baseFilter);

    // Count by status
    const statusCounts = await collection.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    const statusBreakdown: Record<string, number> = {
      draft: 0,
      review: 0,
      approved: 0,
      published: 0,
      archived: 0,
      rejected: 0
    };

    statusCounts.forEach(item => {
      statusBreakdown[item._id] = item.count;
    });

    // Count by source type
    const sourceTypeCounts = await collection.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$sourceType', count: { $sum: 1 } } }
    ]).toArray();

    const sourceTypeBreakdown: Record<string, number> = {};
    sourceTypeCounts.forEach(item => {
      sourceTypeBreakdown[item._id] = item.count;
    });

    // Average SEO and readability scores
    const scoreAverages = await collection.aggregate([
      {
        $match: {
          ...baseFilter,
          seoScore: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgSeoScore: { $avg: '$seoScore' },
          avgReadabilityScore: { $avg: '$readabilityScore' },
          totalWithScores: { $sum: 1 }
        }
      }
    ]).toArray();

    const avgScores = scoreAverages[0] || {
      avgSeoScore: null,
      avgReadabilityScore: null,
      totalWithScores: 0
    };

    // Content creation over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const contentOverTime = await collection.aggregate([
      {
        $match: {
          userId: new ObjectId(targetUserId),
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    const timeline = contentOverTime.map(item => ({
      date: item._id,
      count: item.count
    }));

    // Recent published content
    const recentPublished = await collection
      .find({
        userId: new ObjectId(targetUserId),
        status: 'published'
      })
      .sort({ publishedAt: -1 })
      .limit(5)
      .project({ title: 1, publishedAt: 1, seoScore: 1, readabilityScore: 1 })
      .toArray();

    // Top performing content (by SEO score)
    const topPerforming = await collection
      .find({
        userId: new ObjectId(targetUserId),
        seoScore: { $exists: true }
      })
      .sort({ seoScore: -1 })
      .limit(5)
      .project({ title: 1, seoScore: 1, readabilityScore: 1, status: 1 })
      .toArray();

    return NextResponse.json({
      summary: {
        totalContent,
        statusBreakdown,
        sourceTypeBreakdown,
        avgSeoScore: avgScores.avgSeoScore
          ? Math.round(avgScores.avgSeoScore * 10) / 10
          : null,
        avgReadabilityScore: avgScores.avgReadabilityScore
          ? Math.round(avgScores.avgReadabilityScore * 10) / 10
          : null
      },
      statusBreakdown, // Also include at root level for backward compatibility
      timeline,
      recentPublished,
      topPerforming
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
