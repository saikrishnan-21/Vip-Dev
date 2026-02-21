import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Agent } from 'undici';

// Support both FASTAPI_URL and FASTAPI_AI_SERVICE_URL for compatibility
const FASTAPI_URL = process.env.FASTAPI_URL || process.env.FASTAPI_AI_SERVICE_URL || 'http://localhost:8000';

// Create a custom undici agent with extended timeouts for long-running AI generation
// The default headersTimeout of ~60s causes UND_ERR_HEADERS_TIMEOUT for AI tasks
const longRunningAgent = new Agent({
  headersTimeout: 3600000,      // 1 hour timeout for headers (AI generation can take 5-10+ min)
  bodyTimeout: 3600000,         // 1 hour timeout for body
  keepAliveTimeout: 600000,     // 10 minutes keep-alive
  keepAliveMaxTimeout: 3600000, // 1 hour max keep-alive
});

/**
 * POST /api/content/bulk-generate
 * Bulk generate multiple articles using parallel processing
 * Body: { topics: string[], articleCount?: number, wordCount, tone, ... }
 */
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { 
      // Bulk mode can work in two ways:
      // 1. Multiple topics provided explicitly
      // 2. Single topic with articleCount to generate variations
      topics: explicitTopics,
      topic: singleTopic,
      articleCount = 1,
      mode = 'topic',
      keywords,
      keywordDensity = 'natural',
      trendTopic,
      trendUrl,
      trendDescription,
      trendSource,
      trendRelatedQueries,
      sourceUrl,  // For spin mode
      spinAngle,  // For spin mode
      region = 'US',
      wordCount = 1500, 
      tone = 'Professional', 
      seoOptimization = true,
      contentStructure = 'auto',
      includeImages = false,
      imageCount = 0,
      imageStyle = 'auto',
      useWebSearch = true
    } = body;

    // Validate article count
    if (articleCount < 1 || articleCount > 50) {
      return NextResponse.json(
        { success: false, error: 'Article count must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Build topics list
    let topicsList: string[] = [];
    let originalContent: string | undefined; // For spin mode
    let spinIntensity = 'medium'; // For spin mode
    
    // Handle spin mode differently - fetch content first
    if (mode === 'spin') {
      if (!sourceUrl) {
        return NextResponse.json(
          { success: false, error: 'Source article URL is required for bulk article spin' },
          { status: 400 }
        );
      }
      
      // Map uniqueness level to spin intensity
      if (spinAngle) {
        if (spinAngle.includes('High') || spinAngle.includes('70-80%')) {
          spinIntensity = 'heavy';
        } else if (spinAngle.includes('Medium') || spinAngle.includes('50-70%')) {
          spinIntensity = 'medium';
        } else if (spinAngle.includes('Inspired') || spinAngle.includes('30-50%')) {
          spinIntensity = 'light';
        }
      }
      
      // Fetch content from URL using Firecrawl
      try {
        const scrapeResponse = await fetch(`${FASTAPI_URL}/crawl/scrape`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: sourceUrl }),
        });
        
        if (!scrapeResponse.ok) {
          const errorData = await scrapeResponse.json().catch(() => ({}));
          return NextResponse.json(
            {
              success: false,
              error: `Failed to fetch article from URL: ${errorData.detail || scrapeResponse.statusText}`,
            },
            { status: 503 }
          );
        }
        
        const scrapeData = await scrapeResponse.json();
        if (!scrapeData.success || !scrapeData.markdown) {
          return NextResponse.json(
            {
              success: false,
              error: `Failed to extract content from URL: ${scrapeData.error || 'No content found'}`,
            },
            { status: 503 }
          );
        }
        
        originalContent = scrapeData.markdown;
      } catch (error: any) {
        return NextResponse.json(
          {
            success: false,
            error: `Error fetching article from URL: ${error.message || 'Unknown error'}`,
          },
          { status: 500 }
        );
      }
      
      // For spin mode, create variation angles (same article, different spins)
      topicsList = Array(articleCount).fill(0).map((_, i) => 
        `Spin Variation ${i + 1}`
      );
    } else if (explicitTopics && Array.isArray(explicitTopics) && explicitTopics.length > 0) {
      // Use explicitly provided topics
      topicsList = explicitTopics;
    } else if (singleTopic && articleCount > 1) {
      // Generate variations of a single topic
      topicsList = generateTopicVariations(singleTopic, articleCount, mode);
    } else if (singleTopic) {
      topicsList = [singleTopic];
    } else if (trendTopic) {
      // For trends mode, create variations
      topicsList = generateTopicVariations(trendTopic, articleCount, 'trends');
    } else if (keywords && keywords.length > 0) {
      // For keywords mode, create variations
      const baseKeyword = keywords.join(', ');
      topicsList = generateTopicVariations(`Article about: ${baseKeyword}`, articleCount, 'keywords');
    } else {
      return NextResponse.json(
        { success: false, error: 'Either topics array, topic, trendTopic, keywords, or sourceUrl (for spin) is required' },
        { status: 400 }
      );
    }

    // Create bulk job in MongoDB
    const db = await getDatabase();
    const jobsCollection = db.collection(Collections.GENERATION_JOBS);
    const now = new Date();

    // Format title like "Top 5 Fantasy Football Sleepers for Week 10 (+4 more)"
    const firstTopic = topicsList[0] || singleTopic || trendTopic || 'Bulk Generation';
    const remainingCount = topicsList.length > 1 ? topicsList.length - 1 : 0;
    const formattedTitle = remainingCount > 0 
      ? `${firstTopic} (+${remainingCount} more)`
      : firstTopic;

    const bulkJob = {
      userId: new ObjectId(user.userId),
      status: 'processing',
      mode: 'bulk',
      originalMode: mode,
      topic: formattedTitle, // Add topic field for display
      topics: topicsList,
      articleCount: topicsList.length,
      completedCount: 0,
      failedCount: 0,
      wordCount,
      tone,
      keywords: keywords || [],
      keywordDensity,
      seoOptimization,
      contentStructure,
      includeImages,
      imageCount,
      imageStyle,
      progress: 0,
      message: `Starting bulk generation of ${topicsList.length} articles...`,
      results: [],
      createdAt: now,
      updatedAt: now,
    };

    const jobResult = await jobsCollection.insertOne(bulkJob);
    const jobId = jobResult.insertedId.toString();

    // Call FastAPI bulk-async endpoint in the background
    const fastapiBody: any = {
      topics: topicsList,
      word_count: wordCount,
      tone,
      keywords: keywords || [],
      keyword_density: keywordDensity,
      seo_optimization: seoOptimization,
      use_web_search: useWebSearch,
      content_structure: contentStructure,
      // Image generation removed - now handled separately via /api/content/[contentId]/generate-images
      include_images: false,
      image_count: 0,
      image_style: 'auto',
      job_id: jobId,
      user_id: user.userId,
    };
    
    // Add spin mode specific fields
    if (mode === 'spin') {
      fastapiBody.mode = 'spin';
      fastapiBody.original_content = originalContent;
      fastapiBody.spin_angle = spinAngle || 'fresh perspective';
      fastapiBody.spin_intensity = spinIntensity;
    }

    // Fire-and-forget call to FastAPI
    // Allow generous timeout: Each article can take 5-10 minutes with AI agents
    // For safety, allow 10 minutes per article + 5 minute buffer
    // Max timeout: 60 minutes to prevent indefinite hanging
    const timeoutPerArticleMs = 10 * 60 * 1000; // 10 minutes per article
    const bufferMs = 5 * 60 * 1000; // 5 minute buffer
    const estimatedTimeMs = Math.min(topicsList.length * timeoutPerArticleMs + bufferMs, 3600000); // Max 60 min
    const estimatedTimeMinutes = Math.floor(estimatedTimeMs / 60000);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), estimatedTimeMs);

    // Use custom agent with extended timeouts to prevent UND_ERR_HEADERS_TIMEOUT
    // The default Node.js fetch timeout is too short for AI generation tasks
    const fastapiEndpoint = `${FASTAPI_URL}/api/generation/bulk-async`;
    console.log(`[FastAPI Bulk Generation] Job ${jobId} - Calling FastAPI at: ${fastapiEndpoint}`);
    
    fetch(fastapiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fastapiBody),
      signal: controller.signal,
      // @ts-expect-error - dispatcher is a valid undici option but not typed in Node.js fetch
      dispatcher: longRunningAgent,
    } as RequestInit)
      .then(async (fastapiResponse) => {
        clearTimeout(timeoutId);
        
        try {
          // Log response status for debugging
          console.log(`[FastAPI Bulk Generation] Job ${jobId} - Response status: ${fastapiResponse.status} ${fastapiResponse.statusText}`);
          
          if (fastapiResponse.ok) {
            let fastapiData;
            try {
              fastapiData = await fastapiResponse.json();
              console.log(`[FastAPI Bulk Generation] Job ${jobId} - Response data:`, {
                success: fastapiData.success,
                total: fastapiData.total,
                completed: fastapiData.completed,
                failed: fastapiData.failed,
                resultsCount: fastapiData.results?.length || 0,
                message: fastapiData.message
              });
            } catch (jsonError) {
              // If JSON parsing fails, try to get text response
              const errorText = await fastapiResponse.text();
              console.error(`[FastAPI Bulk Generation] Job ${jobId} - JSON parse error:`, jsonError, 'Response text:', errorText);
              throw new Error(`Invalid JSON response from FastAPI: ${errorText.substring(0, 200)}`);
            }
            
            // Check if FastAPI returned success: false
            if (fastapiData.success === false) {
              console.error(`[FastAPI Bulk Generation] Job ${jobId} - FastAPI returned success: false`);
              await jobsCollection.updateOne(
                { _id: new ObjectId(jobId) },
                {
                  $set: {
                    status: 'failed',
                    message: fastapiData.message || 'Bulk generation failed on FastAPI side',
                    error: fastapiData.message || 'Unknown error from FastAPI',
                    updatedAt: new Date(),
                  },
                }
              );
              return;
            }
            
            // Store each generated article
            const generatedContentCollection = db.collection(Collections.GENERATED_CONTENT);
            const contentDocs = [];
            
            for (const result of fastapiData.results || []) {
              if (result.success && result.content) {
                contentDocs.push({
                  userId: new ObjectId(user.userId),
                  jobId: jobId,
                  mode,
                  status: 'completed',
                  title: result.topic,
                  content: result.content,
                  wordCount: result.word_count || wordCount,
                  tone,
                  keywords: keywords || [],
                  // Image generation removed - now handled separately
                  imagesGenerated: 0,
                  images: [],
                  createdAt: now,
                  updatedAt: new Date(),
                });
              }
            }
            
            if (contentDocs.length > 0) {
              await generatedContentCollection.insertMany(contentDocs);
              console.log(`[FastAPI Bulk Generation] Job ${jobId} - Saved ${contentDocs.length} articles to generated_content collection`);
            }
            
            // Determine final status based on results
            const completedCount = fastapiData.completed || contentDocs.length;
            const failedCount = fastapiData.failed || 0;
            const totalCount = fastapiData.total || (fastapiData.results?.length || 0);
            
            // If all articles failed, mark as failed; otherwise completed (even if some failed)
            const finalStatus = completedCount === 0 && totalCount > 0 ? 'failed' : 'completed';
            
            console.log(`[FastAPI Bulk Generation] Job ${jobId} - Final status: ${finalStatus}, completed: ${completedCount}, failed: ${failedCount}, total: ${totalCount}`);
            
            // Update job status
            await jobsCollection.updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  status: finalStatus,
                  progress: 100,
                  completedCount: completedCount,
                  failedCount: failedCount,
                  results: fastapiData.results || [],
                  message: fastapiData.message || `Completed ${completedCount} of ${totalCount} articles`,
                  updatedAt: new Date(),
                },
              }
            );
          } else {
            // FastAPI returned non-OK status (4xx, 5xx)
            let errorText = '';
            let errorDetail = '';
            try {
              errorText = await fastapiResponse.text();
              // Try to parse as JSON to get the detail field
              try {
                const errorJson = JSON.parse(errorText);
                errorDetail = errorJson.detail || errorJson.message || errorJson.error || errorText;
              } catch {
                // If not JSON, use the text as-is
                errorDetail = errorText;
              }
            } catch (e) {
              errorText = fastapiResponse.statusText;
              errorDetail = fastapiResponse.statusText;
            }
            
            // Use the detailed error message if available, otherwise use status text
            const errorMessage = errorDetail || fastapiResponse.statusText;
            
            console.error(`[FastAPI Bulk Generation] Job ${jobId} - Non-OK response: ${fastapiResponse.status} ${fastapiResponse.statusText}`, errorText);
            
            // Update job status to failed
            await jobsCollection.updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  status: 'failed',
                  message: `FastAPI error: ${errorMessage.substring(0, 200)}`,
                  error: errorText.substring(0, 500),
                  updatedAt: new Date(),
                },
              }
            );
          }
        } catch (innerError: any) {
          // Catch any errors in the response handling (JSON parse, DB update, etc.)
          console.error(`[FastAPI Bulk Generation] Job ${jobId} - Error processing response:`, innerError);
          await jobsCollection.updateOne(
            { _id: new ObjectId(jobId) },
            {
              $set: {
                status: 'failed',
                message: `Error processing FastAPI response: ${innerError.message}`,
                error: innerError.message,
                updatedAt: new Date(),
              },
            }
          );
        }
      })
      .catch(async (error) => {
        console.error(`[FastAPI Bulk Generation Error for job ${jobId}]`, error);
        clearTimeout(timeoutId);
        
        // Check if job is still processing (might have been updated by FastAPI)
        const currentJob = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
        
        // Only mark as failed if it's still in processing/queued state
        // If it's already completed or failed, don't overwrite
        if (currentJob && (currentJob.status === 'processing' || currentJob.status === 'queued')) {
          // Check if this is a timeout/network error (FastAPI is still processing in background)
          const isTimeoutError = 
            error.name === 'AbortError' || 
            error.code === 'UND_ERR_HEADERS_TIMEOUT' || 
            error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.message?.includes('timeout') ||
            error.message?.includes('fetch failed');

          if (isTimeoutError) {
            // Wait a moment for any in-flight database writes to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if articles were actually saved despite timeout
            // (This can happen if response was partially received or saved before timeout)
            const generatedContentCollection = db.collection(Collections.GENERATED_CONTENT);
            const savedArticles = await generatedContentCollection.find({ jobId: jobId }).toArray();
            
            console.log(`[FastAPI Bulk Generation] Job ${jobId} timeout check: Found ${savedArticles.length} articles in database`);
            
            if (savedArticles.length > 0) {
              // Articles were saved! Mark job as completed
              console.log(`[FastAPI Bulk Generation] ✅ Job ${jobId} timed out but found ${savedArticles.length} saved articles - marking as completed`);
              
              await jobsCollection.updateOne(
                { _id: new ObjectId(jobId) },
                {
                  $set: {
                    status: 'completed',
                    progress: 100,
                    completedCount: savedArticles.length,
                    failedCount: Math.max(0, topicsList.length - savedArticles.length),
                    message: `Successfully generated ${savedArticles.length} of ${topicsList.length} articles`,
                    error: undefined,
                    updatedAt: new Date(),
                  },
                }
              );
            } else {
              // No articles saved - connection timed out before response received
              // The articles were generated by FastAPI but lost due to timeout
              // Mark as failed with clear retry message
              const timeoutMessage = `⚠️ Connection timeout: The AI service completed generating articles, but the connection timed out before results could be saved. Please try generating again with a smaller batch (1-2 articles) for better reliability.`;

              await jobsCollection.updateOne(
                { _id: new ObjectId(jobId) },
                {
                  $set: {
                    status: 'failed',
                    message: timeoutMessage,
                    error: 'Connection timeout - articles generated but not saved',
                    updatedAt: new Date(),
                  },
                }
              );
              
              console.log(`[FastAPI Bulk Generation] ❌ Job ${jobId} timed out - no articles saved (${topicsList.length} articles were generated by FastAPI but lost due to timeout)`);
            }
          } else {
            // Only mark as failed for actual service errors (not timeouts)
            const errorMessage = error.message || 'FastAPI service unavailable';

            await jobsCollection.updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  status: 'failed',
                  message: errorMessage,
                  error: errorMessage,
                  updatedAt: new Date(),
                },
              }
            );
            
            console.error(`[FastAPI Bulk Generation] Job ${jobId} failed with non-timeout error: ${errorMessage}`);
          }
        } else {
          // Job status was already updated (likely completed), just log the error
          console.log(`[FastAPI Bulk Generation] Job ${jobId} status is ${currentJob?.status}, not updating to failed`);
        }
      });

    // Return immediately with jobId
    return NextResponse.json({
      success: true,
      jobId: jobId,
      articleCount: topicsList.length,
      topics: topicsList,
      message: `Bulk generation started for ${topicsList.length} articles`,
    }, { status: 202 });

  } catch (error: any) {
    console.error('[Bulk Content Generation Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Bulk content generation failed',
      },
      { status: 500 }
    );
  }
});


/**
 * Generate topic variations for bulk generation
 * Creates different angles/perspectives on the same topic
 */
function generateTopicVariations(baseTopic: string, count: number, mode: string): string[] {
  if (count === 1) {
    return [baseTopic];
  }

  const angles = [
    '', // Original topic
    'Beginner\'s Guide to',
    'Advanced Strategies for',
    'Top 10 Tips for',
    'Common Mistakes in',
    'Expert Analysis of',
    'The Ultimate Guide to',
    'What You Need to Know About',
    'How to Master',
    'The Complete Breakdown of',
    'Hidden Secrets of',
    'The Future of',
    'Everything About',
    'Insider Tips for',
    'The Truth About',
    'Deep Dive into',
    'Quick Guide to',
    'Pro Tips for',
    'Essential Facts About',
    'The Science Behind',
    'Breaking Down',
    'Understanding',
    'Maximizing Your',
    'Optimizing',
    'The Best Approach to',
    'Strategies That Work for',
    'Winning at',
    'Dominating',
    'Unlocking',
    'Secrets to Success with',
    'What Experts Say About',
    'Trending Analysis:',
    'Latest Updates on',
    'Week in Review:',
    'Hot Takes on',
    'Fantasy Implications of',
    'Sleeper Picks:',
    'Breakout Candidates:',
    'Must-Know Facts:',
    'Value Picks:',
    'Draft Strategy:',
    'Trade Targets:',
    'Waiver Wire:',
    'Matchup Analysis:',
    'Start/Sit:',
    'Injury Impact:',
    'Rookie Watch:',
    'Veteran Spotlight:',
    'Under the Radar:',
    'Game Changers:',
  ];

  const topics: string[] = [];
  
  for (let i = 0; i < count && i < angles.length; i++) {
    const angle = angles[i];
    if (angle === '') {
      topics.push(baseTopic);
    } else {
      // Clean up the topic to avoid redundancy
      const cleanTopic = baseTopic.replace(/^(The |A |An )/i, '');
      topics.push(`${angle} ${cleanTopic}`);
    }
  }

  // If we need more topics than angles, cycle through with numbers
  while (topics.length < count) {
    const index = topics.length % angles.length;
    const angle = angles[index] || 'Part';
    const cleanTopic = baseTopic.replace(/^(The |A |An )/i, '');
    topics.push(`${angle} ${cleanTopic} - Part ${Math.floor(topics.length / angles.length) + 1}`);
  }

  return topics;
}

