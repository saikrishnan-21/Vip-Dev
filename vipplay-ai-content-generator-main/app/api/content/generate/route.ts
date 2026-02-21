import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { getDatabase, Collections } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Agent } from 'undici';
import {
  queueArticleGeneration,
  isSQSConfigured,
  type ArticleGenerationPayload,
} from '@/lib/services/sqs';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Create a custom undici agent with extended timeouts for long-running AI generation
// The default headersTimeout of ~60s causes UND_ERR_HEADERS_TIMEOUT for AI tasks
const longRunningAgent = new Agent({
  headersTimeout: 3600000,      // 1 hour timeout for headers (AI generation can take 5-10+ min)
  bodyTimeout: 3600000,         // 1 hour timeout for body
  keepAliveTimeout: 600000,     // 10 minutes keep-alive
  keepAliveMaxTimeout: 3600000, // 1 hour max keep-alive
});

/**
 * POST /api/content/generate
 * Proxy content generation requests to FastAPI service
 * Body: { mode, topic?, keywords?, trendTopic?, articleId?, wordCount, tone, ... }
 */
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { 
      mode, 
      topic, 
      keywords, 
      keywordDensity = 'natural',
      trendTopic, 
      trendUrl,
      trendDescription,
      trendSource,
      trendRelatedQueries,
      articleId, 
      sourceUrl,  // For article spin - URL to fetch content from
      wordCount = 1500, 
      tone = 'Professional', 
      region = 'US', 
      spinAngle, 
      seoOptimization = true,
      contentStructure = 'auto',  // auto, listicle, how-to-guide, analysis
      // Image generation removed - now handled separately via /api/content/[contentId]/generate-images
      includeImages = false,
      imageCount = 0,
      imageStyle = 'auto'  // auto, photo, illustration, infographic (kept for backward compatibility but not used)
    } = body;

    if (!mode) {
      return NextResponse.json(
        { success: false, error: 'Generation mode is required' },
        { status: 400 }
      );
    }

    // Validate word count range (500-3000 per requirements)
    if (wordCount < 500 || wordCount > 3000) {
      return NextResponse.json(
        { success: false, error: 'Word count must be between 500 and 3000' },
        { status: 400 }
      );
    }

    // Check queue limit: Maximum 5 concurrent jobs (queued or processing) per user
    // Count ALL active jobs (content + media) together since limit is per user
    const db = await getDatabase();
    const jobsCollection = db.collection(Collections.GENERATION_JOBS);
    
    // Count all active jobs (queued or processing only) - both content and media
    // Note: We only count 'queued' and 'processing' status, so cancelled/completed/failed are automatically excluded
    const activeJobsCount = await jobsCollection.countDocuments({
      userId: new ObjectId(user.userId),
      status: { $in: ['queued', 'processing'] },
    });

    // Debug logging to help diagnose issues
    console.log(`[Queue Limit Check - Article] User ${user.userId} has ${activeJobsCount} total active jobs (content + media)`);
    
    // Get breakdown for debugging
    const contentJobsCount = await jobsCollection.countDocuments({
      userId: new ObjectId(user.userId),
      status: { $in: ['queued', 'processing'] },
      mode: { $exists: true },
    });
    const mediaJobsCount = await jobsCollection.countDocuments({
      userId: new ObjectId(user.userId),
      status: { $in: ['queued', 'processing'] },
      prompt: { $exists: true },
      mode: { $exists: false },
    });
    console.log(`[Queue Limit Check - Article] Breakdown: ${contentJobsCount} content jobs, ${mediaJobsCount} media jobs`);

    const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS || '10', 10); // Default 10, configurable via env
    if (activeJobsCount >= MAX_CONCURRENT_JOBS) {
      // Get actual job details for better error message
      const activeJobs = await jobsCollection.find({
        userId: new ObjectId(user.userId),
        status: { $in: ['queued', 'processing'] },
      }).limit(10).toArray();
      
      console.log(`[Queue Limit Check - Article] Active jobs details:`, activeJobs.map(j => ({ 
        id: j._id, 
        status: j.status, 
        hasMode: !!j.mode,
        hasPrompt: !!j.prompt,
        createdAt: j.createdAt 
      })));
      
      return NextResponse.json(
        {
          success: false,
          error: `You have ${activeJobsCount} job(s) in queue (${contentJobsCount} articles, ${mediaJobsCount} images). Maximum ${MAX_CONCURRENT_JOBS} concurrent jobs allowed. Please wait for current jobs to complete or cancel them before creating new ones.`,
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    // Image generation validation removed - images are now generated separately via /api/content/[contentId]/generate-images

    let fastapiEndpoint = '';
    let fastapiBody: any = {};
    let originalContent: string | undefined; // For spin mode
    let spinIntensity: string = 'medium'; // For spin mode

    // Route to appropriate FastAPI endpoint based on mode
    switch (mode) {
      case 'topic':
        if (!topic) {
          return NextResponse.json(
            { success: false, error: 'Topic is required for topic-based generation' },
            { status: 400 }
          );
        }
        // Validate topic minimum length (at least 5 characters per requirements)
        if (topic.trim().length < 5) {
          return NextResponse.json(
            { success: false, error: 'Topic must be at least 5 characters long' },
            { status: 400 }
          );
        }
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/topic`;
        fastapiBody = {
          topic,
          word_count: wordCount,
          tone,
          keywords: keywords || [],
          seo_optimization: seoOptimization,
          content_structure: contentStructure,
          // Image generation removed - now handled separately
          include_images: false,
          image_count: 0,
          image_style: 'auto',
        };
        break;

      case 'keywords':
        if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Keywords array is required for keyword-based generation' },
            { status: 400 }
          );
        }
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/keywords`;
        fastapiBody = {
          keywords,
          word_count: wordCount,
          tone,
          seo_optimization: seoOptimization,
          keyword_density: keywordDensity,
          content_structure: contentStructure,
          // Image generation removed - now handled separately
          include_images: false,
          image_count: 0,
          image_style: 'auto',
        };
        break;

      case 'trends':
        if (!trendTopic) {
          return NextResponse.json(
            { success: false, error: 'Trend topic is required for trends-based generation' },
            { status: 400 }
          );
        }
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/trends`;
        fastapiBody = {
          trend_topic: trendTopic,
          trend_url: trendUrl || null,
          trend_description: trendDescription || null,
          trend_source: trendSource || null,
          trend_related_queries: trendRelatedQueries || [],
          region,
          word_count: wordCount,
          tone,
          keywords: keywords || [],
          seo_optimization: seoOptimization,
          content_structure: contentStructure,
          // Image generation removed - now handled separately
          include_images: false,
          image_count: 0,
          image_style: 'auto',
        };
        break;

      case 'spin':
        // Validate input: sourceUrl is required
        if (!sourceUrl) {
          return NextResponse.json(
            { success: false, error: 'Source article URL is required for article spin' },
            { status: 400 }
          );
        }
        
        spinIntensity = 'medium'; // Default to medium
        
        // Map uniqueness level to spin intensity
        if (spinAngle) {
          if (spinAngle.includes('High') || spinAngle.includes('70-80%')) {
            spinIntensity = 'heavy';  // 70-80% unique = heavy spin
          } else if (spinAngle.includes('Medium') || spinAngle.includes('50-70%')) {
            spinIntensity = 'medium'; // 50-70% unique = medium spin
          } else if (spinAngle.includes('Inspired') || spinAngle.includes('30-50%')) {
            spinIntensity = 'light';  // 30-50% unique = light spin
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
        
        if (!originalContent) {
          return NextResponse.json(
            { success: false, error: 'Failed to extract content from the provided URL' },
            { status: 400 }
          );
        }
        
        fastapiEndpoint = `${FASTAPI_URL}/api/generation/spin`;
        fastapiBody = {
          original_content: originalContent,
          spin_angle: spinAngle || 'fresh perspective',
          spin_intensity: spinIntensity,  // light, medium, heavy
          word_count: wordCount,
          tone,
          seo_optimization: seoOptimization,
          content_structure: contentStructure,
          // Image generation removed - now handled separately
          include_images: false,
          image_count: 0,
          image_style: 'auto',
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported generation mode: ${mode}` },
          { status: 400 }
        );
    }

    // Create job in MongoDB first (VIP-10208, VIP-10211)
    // Note: db and jobsCollection are already declared above for queue limit check
    
    // Calculate queue position (FIFO order) - count jobs that are queued or processing
    // This helps users understand their position in the processing queue
    const queuePosition = await jobsCollection.countDocuments({
      userId: new ObjectId(user.userId),
      status: { $in: ['queued', 'processing'] },
      createdAt: { $lt: new Date() }, // Jobs created before this one
    });

    const now = new Date();

    // Generate topic/title for job display (especially for spin mode)
    let jobTopic: string | undefined;
    if (mode === 'spin' && sourceUrl) {
      try {
        const url = new URL(sourceUrl);
        const domain = url.hostname.replace('www.', '');
        jobTopic = `Article Spin: ${domain}`;
      } catch {
        jobTopic = spinAngle ? `Article Spin: ${spinAngle}` : 'Spun Article';
      }
    } else {
      jobTopic = topic || trendTopic || undefined;
    }

    const newJob = {
      userId: new ObjectId(user.userId),
      status: 'queued',
      mode,
      topic: jobTopic,
      keywords: keywords || undefined,
      keywordDensity: keywordDensity || undefined,
      trendTopic: trendTopic || undefined,
      trendUrl: trendUrl || undefined,
      trendDescription: trendDescription || undefined,
      trendSource: trendSource || undefined,
      trendRelatedQueries: trendRelatedQueries || undefined,
      sourceUrl: mode === 'spin' ? sourceUrl : undefined,
      originalContent: mode === 'spin' ? originalContent : undefined,
      wordCount: wordCount,
      tone,
      region: region || undefined,
      spinAngle: spinAngle || undefined,
      spinIntensity: mode === 'spin' ? spinIntensity : undefined,
      seoOptimization: seoOptimization,
      contentStructure: contentStructure,
      includeImages: includeImages,
      imageCount: imageCount,
      imageStyle: imageStyle,
      imagesGenerated: 0,
      progress: 0,
      currentArticle: 0,
      queuePosition: queuePosition + 1, // Position in FIFO queue (1-based)
      message: includeImages 
        ? `Job queued (images enabled), position ${queuePosition + 1} in queue...` 
        : `Job queued, position ${queuePosition + 1} in queue...`,
      createdAt: now,
      updatedAt: now,
    };

    const result = await jobsCollection.insertOne(newJob);
    const jobId = result.insertedId.toString();

    // Use SQS queue if configured, otherwise fall back to direct FastAPI call
    if (isSQSConfigured()) {
      try {
        // Prepare payload for SQS
        const sqsPayload: ArticleGenerationPayload = {
          mode,
          topic,
          keywords,
          keywordDensity,
          trendTopic,
          trendUrl,
          trendDescription,
          trendSource,
          trendRelatedQueries,
          sourceUrl: mode === 'spin' ? sourceUrl : undefined,
          originalContent: mode === 'spin' ? originalContent : undefined,
          wordCount,
          tone,
          region,
          spinAngle,
          spinIntensity: mode === 'spin' ? spinIntensity : undefined,
          seoOptimization,
          contentStructure,
          includeImages,
          imageCount,
          imageStyle,
        };

        // Queue the job in SQS
        console.log(`[Content Generation] Attempting to queue job ${jobId} via SQS...`, {
          queueUrl: process.env.SQS_ARTICLES_QUEUE_URL,
          hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        });
        
        await queueArticleGeneration(jobId, user.userId, sqsPayload);
        
        console.log(`[Content Generation] Job ${jobId} successfully queued via SQS`);

        // Return immediately with jobId (HTTP 202 Accepted for background processing)
        return NextResponse.json(
          {
            success: true,
            jobId: jobId,
            message: 'Content generation job queued successfully via SQS',
            queued: true,
          },
          { status: 202 }
        );
      } catch (sqsError: any) {
        console.error(`[Content Generation] SQS queueing failed for job ${jobId}:`, {
          error: sqsError.message,
          code: sqsError.Code,
          name: sqsError.name,
          stack: sqsError.stack,
        });
        // Fall through to direct FastAPI call if SQS fails
        console.log(`[Content Generation] Falling back to direct FastAPI call for job ${jobId}`);
      }
    }

    // Fallback: Call FastAPI directly (original behavior)
    // This allows the API to return immediately with the jobId
    // Extended timeout for single article: 10 minutes (AI generation takes time)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout for generation
    
    // Use custom agent with extended timeouts to prevent UND_ERR_HEADERS_TIMEOUT
    // The default Node.js fetch timeout is too short for AI generation tasks
    fetch(fastapiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...fastapiBody,
        job_id: jobId,
        user_id: user.userId,
      }),
      signal: controller.signal,
      // @ts-ignore - dispatcher is a valid undici option but not typed in Node.js fetch
      dispatcher: longRunningAgent,
    } as RequestInit)
      .then(async (fastapiResponse) => {
        clearTimeout(timeoutId); // Clear timeout once we get a response
        try {
          // Log response status for debugging
          console.log(`[FastAPI Generation] Job ${jobId} - Response status: ${fastapiResponse.status} ${fastapiResponse.statusText}`);
          
          if (fastapiResponse.ok) {
            let fastapiData;
            try {
              fastapiData = await fastapiResponse.json();
              const imagesMetadata = fastapiData.metadata?.images || [];
              const imagesGenerated = fastapiData.metadata?.images_generated || 0;
              console.log(`[FastAPI Generation] Job ${jobId} - Response data:`, {
                success: fastapiData.success,
                hasContent: !!fastapiData.content,
                contentLength: fastapiData.content?.length || 0,
                message: fastapiData.message,
                imagesGenerated: imagesGenerated,
                imagesCount: imagesMetadata.length,
                images: imagesMetadata.map((img: any) => ({ url: img.url, prompt: img.prompt?.substring(0, 50) }))
              });
            } catch (jsonError) {
              // If JSON parsing fails, try to get text response
              const errorText = await fastapiResponse.text();
              console.error(`[FastAPI Generation] Job ${jobId} - JSON parse error:`, jsonError, 'Response text:', errorText);
              throw new Error(`Invalid JSON response from FastAPI: ${errorText.substring(0, 200)}`);
            }
            
            // Update job status based on FastAPI response
            // FastAPI now returns: { success, content, message, metadata }
            const isCompleted = fastapiData.success === true && fastapiData.content;
            
            console.log(`[FastAPI Generation] Job ${jobId} - isCompleted: ${isCompleted}, success: ${fastapiData.success}, hasContent: ${!!fastapiData.content}`);
            
            await jobsCollection.updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  status: isCompleted ? 'completed' : 'processing',
                  progress: isCompleted ? 100 : 50,
                  message: fastapiData.message || 'Generation in progress',
                  updatedAt: new Date(),
                },
              }
            );

            // If generation completed, store in generated_content collection
            if (isCompleted && fastapiData.content) {
              // Generate appropriate title based on mode
              let contentTitle: string;
              if (mode === 'spin') {
                // For spin mode, create a better title from sourceUrl or spin angle
                if (sourceUrl) {
                  try {
                    const url = new URL(sourceUrl);
                    const domain = url.hostname.replace('www.', '');
                    contentTitle = `Article Spin: ${domain}`;
                  } catch {
                    contentTitle = spinAngle ? `Article Spin: ${spinAngle}` : 'Spun Article';
                  }
                } else {
                  contentTitle = spinAngle ? `Article Spin: ${spinAngle}` : 'Spun Article';
                }
              } else {
                contentTitle = topic || trendTopic || `Generated from ${mode}`;
              }

              // Image generation removed - now handled separately via /api/content/[contentId]/generate-images
              // Set imagesGenerated to 0 for all new articles
              const generatedContent = {
                userId: new ObjectId(user.userId),
                jobId: jobId,
                mode,
                status: 'completed',
                title: contentTitle,
                content: fastapiData.content,
                wordCount: wordCount,
                tone,
                keywords: keywords || [],
                imagesGenerated: 0,
                images: [],
                createdAt: now,
                updatedAt: new Date(),
              };

              try {
                const saveResult = await db.collection(Collections.GENERATED_CONTENT).insertOne(generatedContent);
                console.log(`[FastAPI Generation] Job ${jobId} - Content saved to generated_content collection`, {
                  contentId: saveResult.insertedId.toString(),
                  contentLength: fastapiData.content?.length || 0,
                  imagesGenerated: 0, // Images now generated separately
                });
              } catch (saveError: any) {
                console.error(`[FastAPI Generation] Job ${jobId} - Failed to save content to database:`, saveError);
                // Update job with save error
                await jobsCollection.updateOne(
                  { _id: new ObjectId(jobId) },
                  {
                    $set: {
                      status: 'failed',
                      error: `Failed to save content to database: ${saveError.message}`,
                      message: `Generation completed but save failed: ${saveError.message}`,
                      updatedAt: new Date(),
                    },
                  }
                );
                // Re-throw to be caught by outer catch
                throw new Error(`Database save failed: ${saveError.message}`);
              }
            } else {
              // Content not saved - log reason
              console.warn(`[FastAPI Generation] Job ${jobId} - Content not saved. Reason:`, {
                isCompleted,
                hasSuccess: fastapiData.success,
                hasContent: !!fastapiData.content,
                successValue: fastapiData.success,
                contentLength: fastapiData.content?.length || 0,
                message: fastapiData.message,
              });
              
              if (fastapiData.success === false) {
                // FastAPI returned success: false (but with 200 OK status)
                console.error(`[FastAPI Generation] Job ${jobId} - FastAPI returned success: false`);
                await jobsCollection.updateOne(
                  { _id: new ObjectId(jobId) },
                  {
                    $set: {
                      status: 'failed',
                      message: fastapiData.message || 'Generation failed on FastAPI side',
                      error: fastapiData.message || 'Unknown error from FastAPI',
                      updatedAt: new Date(),
                    },
                  }
                );
              }
            }
          } else {
            // FastAPI returned non-OK status (4xx, 5xx)
            let errorText = '';
            try {
              errorText = await fastapiResponse.text();
            } catch (e) {
              errorText = fastapiResponse.statusText;
            }
            
            console.error(`[FastAPI Generation] Job ${jobId} - Non-OK response: ${fastapiResponse.status} ${fastapiResponse.statusText}`, errorText);
            
            // Update job status to failed
            await jobsCollection.updateOne(
              { _id: new ObjectId(jobId) },
              {
                $set: {
                  status: 'failed',
                  message: `FastAPI error: ${fastapiResponse.status} ${fastapiResponse.statusText}`,
                  error: errorText.substring(0, 500),
                  updatedAt: new Date(),
                },
              }
            );
          }
        } catch (innerError: any) {
          // Catch any errors in the response handling (JSON parse, DB update, etc.)
          console.error(`[FastAPI Generation] Job ${jobId} - Error processing response:`, innerError);
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
        console.error(`[FastAPI Generation Error for job ${jobId}]`, error);
        clearTimeout(timeoutId);
        
        // Update job status to failed if FastAPI is unavailable or times out
        const errorMessage = error.name === 'AbortError' 
          ? 'Generation request timed out'
          : error.message || 'FastAPI service unavailable';
        
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
      });

    // Return immediately with jobId (don't wait for FastAPI)
    // Use 202 Accepted status for background job processing
    return NextResponse.json({
      success: true,
      jobId: jobId,
      message: 'Content generation job queued successfully',
    }, { status: 202 });

  } catch (error: any) {
    console.error('[Content Generation Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Content generation failed',
      },
      { status: 500 }
    );
  }
});

