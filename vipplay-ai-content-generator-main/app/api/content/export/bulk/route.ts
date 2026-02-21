/**
 * Bulk Content Export API Route
 * VIP-10604: Bulk Export
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';
import type { BulkExportJob, ExportFormat } from '@/lib/types/export';

/**
 * POST /api/content/export/bulk - Bulk export multiple content items
 * Body: { contentIds: string[], format: 'markdown' | 'docx' | 'pdf' | 'html', options? }
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
    const { contentIds, format, options = {} } = body;

    // Validation
    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: 'contentIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!format) {
      return NextResponse.json(
        { error: 'Format is required' },
        { status: 400 }
      );
    }

    const validFormats: ExportFormat[] = ['markdown', 'docx', 'pdf', 'html'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate max content items (e.g., 100)
    if (contentIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 content items can be exported at once' },
        { status: 400 }
      );
    }

    // Validate all IDs
    const validIds = contentIds.filter(id => ObjectId.isValid(id));
    if (validIds.length !== contentIds.length) {
      return NextResponse.json(
        { error: 'Invalid content IDs found' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const contentCollection = db.collection<GeneratedContent>('generated_content');
    const exportCollection = db.collection<BulkExportJob>('bulk_export_jobs');

    // Verify all content exists and belongs to user
    const contentObjectIds = validIds.map(id => new ObjectId(id));
    const contents = await contentCollection
      .find({
        _id: { $in: contentObjectIds },
        userId: new ObjectId(payload.userId)
      })
      .toArray();

    if (contents.length === 0) {
      return NextResponse.json(
        { error: 'No valid content found' },
        { status: 404 }
      );
    }

    if (contents.length !== contentIds.length) {
      return NextResponse.json(
        { error: `Only ${contents.length} of ${contentIds.length} content items found` },
        { status: 404 }
      );
    }

    // Create bulk export job
    const now = new Date();
    const userId = new ObjectId(payload.userId);

    const bulkJob: BulkExportJob = {
      userId,
      contentIds: contentObjectIds,
      format,
      status: 'queued',
      totalFiles: contents.length,
      completedFiles: 0,
      createdAt: now
    };

    const result = await exportCollection.insertOne(bulkJob);
    const jobId = result.insertedId;

    // Process bulk export immediately (in production, use queue worker)
    try {
      const exportedData = await processBulkExport(contents, format, options);

      // Update job as completed
      await exportCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'completed',
            zipUrl: exportedData.url,
            filename: exportedData.filename,
            fileSize: exportedData.size,
            completedFiles: contents.length,
            completedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        message: 'Bulk export completed successfully',
        jobId: jobId.toString(),
        url: exportedData.url,
        filename: exportedData.filename,
        size: exportedData.size,
        export: exportedData,
        totalFiles: contents.length
      });

    } catch (exportError: any) {
      // Update job as failed
      await exportCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'failed',
            error: exportError.message,
            completedAt: new Date()
          }
        }
      );

      return NextResponse.json(
        { error: 'Bulk export failed', details: exportError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Bulk export error:', error);
    return NextResponse.json(
      { error: 'Failed to start bulk export', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/export/bulk - List bulk export jobs
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
    const collection = db.collection<BulkExportJob>('bulk_export_jobs');

    const filter: any = { userId: new ObjectId(payload.userId) };
    if (status) {
      filter.status = status;
    }

    const total = await collection.countDocuments(filter);

    const jobs = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      jobs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Bulk export list error:', error);
    return NextResponse.json(
      { error: 'Failed to list bulk export jobs', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process bulk export - create ZIP file with all exports
 */
async function processBulkExport(
  contents: GeneratedContent[],
  format: ExportFormat,
  options: any
): Promise<{ url: string; filename: string; size: number }> {
  // In production, use a library like archiver to create ZIP files
  // For now, create a simple manifest

  const timestamp = Date.now();
  const exports: any[] = [];

  for (const content of contents) {
    const safeTitle = content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}.${format}`;

    exports.push({
      contentId: content._id,
      title: content.title,
      filename,
      format
    });
  }

  // In production: create actual ZIP file with all exported files
  const manifest = JSON.stringify(exports, null, 2);
  const zipFilename = `bulk_export_${timestamp}.zip`;
  const size = Buffer.byteLength(manifest, 'utf8');

  // Placeholder data URL (in production, this would be actual ZIP file URL)
  const dataUrl = `data:application/zip;base64,${Buffer.from(manifest).toString('base64')}`;

  return { url: dataUrl, filename: zipFilename, size };
}
