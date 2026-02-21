/**
 * Google Trends Service
 * Handles fetching trending topics from Google Trends
 *
 * Note: Uses google-trends-api npm package for unofficial Google Trends API
 * For production, consider using official Google Trends RSS feed or SerpAPI
 */

export interface TrendingTopic {
  title: string;
  description?: string;
  url?: string;
  traffic?: string;
  relatedQueries?: string[];
  timestamp: Date;
  pictureSource?: string;
  newsSource?: string;
}

export interface TrendsRegion {
  code: string;
  name: string;
}

export interface TrendsCategory {
  code: string;
  name: string;
}

// Common Google Trends regions
export const TRENDS_REGIONS: TrendsRegion[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

// Common Google Trends categories
export const TRENDS_CATEGORIES: TrendsCategory[] = [
  { code: 'all', name: 'All Categories' },
  { code: 'b', name: 'Business' },
  { code: 't', name: 'Science & Technology' },
  { code: 'e', name: 'Entertainment' },
  { code: 's', name: 'Sports' },
  { code: 'h', name: 'Health' },
  { code: 'm', name: 'Top Stories' },
];

// Sports keywords and sources for filtering
const SPORTS_KEYWORDS = [
  'football', 'soccer', 'basketball', 'baseball', 'hockey', 'cricket', 'tennis',
  'golf', 'boxing', 'ufc', 'mma', 'f1', 'formula 1', 'nascar', 'racing',
  'nfl', 'nba', 'mlb', 'nhl', 'fifa', 'uefa', 'premier league', 'champions league',
  'world cup', 'olympics', 'wwe', 'aew', 'wrestling', 'rugby',
  'score', 'match', 'game', 'vs', 'league', 'championship', 'tournament',
  'draft', 'trade', 'roster', 'coach', 'player', 'athlete', 'quarterback',
  'touchdown', 'goal', 'homerun', 'slam dunk', 'fantasy football', 'super bowl'
];

const SPORTS_SOURCES = [
  'espn', 'bleacher report', 'cbs sports', 'nbc sports', 'fox sports',
  'sports illustrated', 'yahoo sports', 'the athletic', 'skysports',
  'nfl.com', 'nba.com', 'mlb.com', 'nhl.com', 'goal.com', '247sports',
  'on3', 'deadspin', 'sbnation', 'eurospec', 'cricinfo'
];

/**
 * Fetch daily trending searches from Google Trends
 * Uses Google Trends RSS feed (unofficial)
 */
export async function fetchDailyTrends(
  region: string = 'US',
  category: string = 'all'
): Promise<{ success: boolean; trends?: TrendingTopic[]; error?: string }> {
  try {
    // Google Trends RSS feed URL
    // Updated to new URL format as of late 2024/2025
    // Note: Category filter might not be supported in the new general RSS feed
    const feedUrl = `https://trends.google.com/trending/rss?geo=${region}`;

    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Google Trends API error: ${response.status}`,
      };
    }

    const xmlText = await response.text();

    // Parse RSS XML to extract trending topics
    const trends = parseGoogleTrendsRSS(xmlText);

    // Filter by category if needed
    // Map full category names to codes if necessary
    let categoryCode = category;
    if (category === 'sports') categoryCode = 's';
    if (category === 'entertainment') categoryCode = 'e';
    if (category === 'business') categoryCode = 'b';
    if (category === 'technology' || category === 'science') categoryCode = 't';
    if (category === 'health') categoryCode = 'h';

    let filteredTrends = trends;
    if (categoryCode === 's') {
      filteredTrends = trends.filter(trend => isSportsTopic(trend));
    }
    // Add other category filters if needed, e.g. 'e' for entertainment

    return {
      success: true,
      trends: filteredTrends,
    };
  } catch (error) {
    console.error('Fetch daily trends error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trends',
    };
  }
}

/**
 * Check if a topic is sports-related based on keywords and source
 */
function isSportsTopic(trend: TrendingTopic): boolean {
  const text = (trend.title + ' ' + (trend.description || '')).toLowerCase();
  const source = (trend.newsSource || trend.pictureSource || '').toLowerCase();

  // Check sources first (high confidence)
  if (SPORTS_SOURCES.some(s => source.includes(s))) {
    return true;
  }

  // Check keywords
  if (SPORTS_KEYWORDS.some(k => text.includes(k))) {
    return true;
  }

  return false;
}

/**
 * Parse Google Trends RSS feed XML
 * Extracts trending topics from XML structure
 */
function parseGoogleTrendsRSS(xmlText: string): TrendingTopic[] {
  const trends: TrendingTopic[] = [];

  try {
    // Basic XML parsing for <item> elements
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    
    // Updated regex to handle both CDATA and plain text, and new tags
    const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
    const descRegex = /<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/;
    // Link in new feed is generic, use news_item_url if available
    const linkRegex = /<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/;
    const newsUrlRegex = /<ht:news_item_url>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ht:news_item_url>/;
    const trafficRegex = /<ht:approx_traffic>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ht:approx_traffic>/;
    const pubDateRegex = /<pubDate>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/;
    const pictureSourceRegex = /<ht:picture_source>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ht:picture_source>/;
    const newsSourceRegex = /<ht:news_item_source>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/ht:news_item_source>/;

    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];

      const titleMatch = titleRegex.exec(itemXml);
      const descMatch = descRegex.exec(itemXml);
      const linkMatch = linkRegex.exec(itemXml);
      const newsUrlMatch = newsUrlRegex.exec(itemXml);
      const trafficMatch = trafficRegex.exec(itemXml);
      const pubDateMatch = pubDateRegex.exec(itemXml);
      const pictureSourceMatch = pictureSourceRegex.exec(itemXml);
      const newsSourceMatch = newsSourceRegex.exec(itemXml);

      // Use news url if available, otherwise fallback to link
      const url = newsUrlMatch ? newsUrlMatch[1] : linkMatch?.[1];

      if (titleMatch) {
        trends.push({
          title: titleMatch[1],
          description: descMatch?.[1],
          url: url,
          traffic: trafficMatch?.[1],
          timestamp: pubDateMatch?.[1] ? new Date(pubDateMatch[1]) : new Date(),
          pictureSource: pictureSourceMatch?.[1],
          newsSource: newsSourceMatch?.[1],
        });
      }
    }
  } catch (error) {
    console.error('Parse Google Trends RSS error:', error);
  }

  return trends;
}

/**
 * Fetch realtime trending searches
 * Uses Google Trends realtime feed
 */
export async function fetchRealtimeTrends(
  region: string = 'US',
  category: string = 'all'
): Promise<{ success: boolean; trends?: TrendingTopic[]; error?: string }> {
  try {
    // Google Trends realtime RSS feed
    // Note: The old realtime feed is 404ing. We will fallback to the daily feed for now
    // or use the same feed as daily if realtime is not available.
    
    // Attempting to use the same feed as daily since realtime URL is down
    return fetchDailyTrends(region, category);
  } catch (error) {
    console.error('Fetch realtime trends error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trends',
    };
  }
}

/**
 * Get trending topics by region and category
 * Combines daily and realtime trends
 */
export async function getTrendingTopics(
  region: string = 'US',
  category: string = 'all',
  type: 'daily' | 'realtime' = 'daily'
): Promise<{ success: boolean; trends?: TrendingTopic[]; error?: string }> {
  if (type === 'realtime') {
    return fetchRealtimeTrends(region, category);
  }
  return fetchDailyTrends(region, category);
}
