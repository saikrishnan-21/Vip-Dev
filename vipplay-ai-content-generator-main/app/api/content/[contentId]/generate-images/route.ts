/**
 * Generate Images for Article API Route
 * Generates and embeds images into an existing article
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

/**
 * POST /api/content/[contentId]/generate-images - Generate images for an article
 * Body: { image_count: number, image_style: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { contentId } = await params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const body = await request.json();
    const { image_count = 2, image_style = 'auto' } = body;

    // Validate image count
    if (image_count < 1 || image_count > 2) {
      return NextResponse.json(
        { error: 'Image count must be between 1 and 2' },
        { status: 400 }
      );
    }

    // Validate image style
    const validStyles = ['auto', 'cartoon', 'realistic'];
    if (!validStyles.includes(image_style)) {
      return NextResponse.json(
        { error: `Image style must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<GeneratedContent>(Collections.GENERATED_CONTENT);

    // Get article with user isolation check
    const article = await collection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found or access denied' }, { status: 404 });
    }

    // Check if article has content
    if (!article.content || article.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Article has no content to generate images for' },
        { status: 400 }
      );
    }

    // Call FastAPI to generate images
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    let fastapiResponse;
    try {
      fastapiResponse = await fetch(`${FASTAPI_URL}/api/generation/generate-images-for-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_content: article.content,
          article_title: article.title,
          image_count: image_count,
          image_style: image_style,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Image generation request timed out' },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    if (!fastapiResponse.ok) {
      const errorData = await fastapiResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.detail || errorData.error || 'Image generation failed' },
        { status: fastapiResponse.status }
      );
    }

    const fastapiData = await fastapiResponse.json();

    if (!fastapiData.success) {
      return NextResponse.json(
        { error: fastapiData.message || 'Image generation failed' },
        { status: 500 }
      );
    }

    // Update article in MongoDB with new content and image metadata
    const imagesMetadata = fastapiData.images || [];
    const imagesGenerated = fastapiData.images_generated || 0;

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(contentId), userId: new ObjectId(payload.userId) },
      {
        $set: {
          content: fastapiData.content,
          imagesGenerated: imagesGenerated,
          images: imagesMetadata,
          updatedAt: new Date(),
          lastEditedBy: new ObjectId(payload.userId),
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update article with images' },
        { status: 500 }
      );
    }

    // Fetch updated article
    const updatedArticle = await collection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!updatedArticle) {
      return NextResponse.json(
        { error: 'Failed to fetch updated article' },
        { status: 500 }
      );
    }

    // Transform response
    const contentAny = updatedArticle as any;
    const transformed: any = {
      _id: updatedArticle._id.toString(),
      title: updatedArticle.title,
      status: updatedArticle.status,
      content: updatedArticle.content,
      summary: updatedArticle.summary,
      keywords: updatedArticle.keywords || [],
      createdAt: updatedArticle.createdAt,
      updatedAt: updatedArticle.updatedAt,
      imagesGenerated: imagesGenerated,
      images: imagesMetadata,
      wordCount: contentAny.metadata?.wordCount || contentAny.wordCount || undefined,
      seoScore: contentAny.seoAnalysis?.score || contentAny.seoScore || undefined,
      readabilityScore: contentAny.seoAnalysis?.readabilityScore || contentAny.readabilityScore || undefined,
      metadata: contentAny.metadata || undefined,
      seoAnalysis: contentAny.seoAnalysis || undefined,
      readabilityAnalysis: contentAny.readabilityAnalysis || undefined,
      sourceType: contentAny.sourceType || undefined,
      sourceData: contentAny.sourceData || undefined,
    };

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${imagesGenerated} image(s)`,
      content: transformed,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate images' },
      { status: 500 }
    );
  }
}

