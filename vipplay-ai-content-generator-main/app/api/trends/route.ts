import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getTrendingTopics } from '@/lib/services/google-trends';

/**
 * GET /api/trends
 * Get trending topics from Google Trends
 * Query params: region (default: US), category (default: all), type (daily|realtime, default: daily)
 */
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'US';
    const category = searchParams.get('category') || 'all';
    const type = (searchParams.get('type') || 'daily') as 'daily' | 'realtime';

    // Fetch trending topics from Google Trends
    const result = await getTrendingTopics(region, category, type);

    if (!result.success || !result.trends) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch trending topics',
        },
        { status: 500 }
      );
    }

    // Format trends for the UI (show all available trends)
    // Include all available data from Google Trends for agent context
    const formattedTrends = result.trends.map((trend, index) => ({
      keyword: trend.title,
      volume: trend.traffic || 'N/A',
      trend: '+0%', // Google Trends RSS doesn't provide trend percentage, use placeholder
      rank: index + 1,
      // Additional context for AI agent
      url: trend.url || null,
      description: trend.description || null,
      newsSource: trend.newsSource || null,
      relatedQueries: trend.relatedQueries || [],
    }));

    return NextResponse.json({
      success: true,
      data: {
        trends: formattedTrends,
        region,
        category,
        type,
      },
    });
  } catch (error: any) {
    console.error('[Get Trends Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch trending topics',
      },
      { status: 500 }
    );
  }
});

