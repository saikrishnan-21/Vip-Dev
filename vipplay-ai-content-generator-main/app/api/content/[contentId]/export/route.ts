/**
 * Content Export API Route
 * VIP-10601: Export as Markdown
 * VIP-10602: Export as DOCX
 * VIP-10603: Export as PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, Collections } from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth/jwt';
import { ObjectId } from 'mongodb';
import type { GeneratedContent } from '@/lib/types/content';
import type { ExportJob, ExportFormat } from '@/lib/types/export';

/**
 * POST /api/content/[contentId]/export - Export content in specified format
 * Body: { format: 'markdown' | 'docx' | 'pdf', options? }
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

    // Next.js 15+ requires awaiting params
    const { contentId } = await params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const body = await request.json();
    const { format, options = {} } = body;

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

    const db = await getDatabase();
    const contentCollection = db.collection<GeneratedContent>('generated_content');
    const exportCollection = db.collection<ExportJob>('export_jobs');

    // Verify content exists and belongs to user
    const content = await contentCollection.findOne({
      _id: new ObjectId(contentId),
      userId: new ObjectId(payload.userId)
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Create export job
    const now = new Date();
    const userId = new ObjectId(payload.userId);

    const exportJob: ExportJob = {
      userId,
      contentId: new ObjectId(contentId),
      format,
      status: 'queued',
      options,
      createdAt: now
    };

    const result = await exportCollection.insertOne(exportJob);
    const jobId = result.insertedId;

    // Process export immediately (in production, use queue worker)
    try {
      const exportedData = await processExport(content, format, options);

      // Update job as completed
      await exportCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'completed',
            fileUrl: exportedData.url,
            filename: exportedData.filename,
            fileSize: exportedData.size,
            completedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        message: 'Content exported successfully',
        jobId: jobId.toString(),
        url: exportedData.url,
        filename: exportedData.filename,
        size: exportedData.size,
        export: exportedData
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
        { error: 'Export failed', details: exportError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Content export error:', error);
    return NextResponse.json(
      { error: 'Failed to export content', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/[contentId]/export - Get export history for content
 */
export async function GET(
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

    // Next.js 15+ requires awaiting params
    const { contentId } = await params;

    if (!ObjectId.isValid(contentId)) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection<ExportJob>('export_jobs');

    const exports = await collection
      .find({
        contentId: new ObjectId(contentId),
        userId: new ObjectId(payload.userId)
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      exports,
      count: exports.length
    });

  } catch (error: any) {
    console.error('Export history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export history', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Process export based on format
 */
async function processExport(
  content: GeneratedContent,
  format: ExportFormat,
  options: any
): Promise<{ url: string; filename: string; size: number }> {
  const timestamp = Date.now();
  const safeTitle = content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  switch (format) {
    case 'markdown':
      return exportMarkdown(content, safeTitle, timestamp, options);
    case 'docx':
      return exportDocx(content, safeTitle, timestamp, options);
    case 'pdf':
      return exportPdf(content, safeTitle, timestamp, options);
    case 'html':
      return exportHtml(content, safeTitle, timestamp, options);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Export as Markdown (VIP-10601)
 */
function exportMarkdown(
  content: GeneratedContent,
  safeTitle: string,
  timestamp: number,
  options: any
): { url: string; filename: string; size: number } {
  let markdown = `# ${content.title}\n\n`;

  if (options.includeMetadata) {
    const createdAt = content.createdAt instanceof Date 
      ? content.createdAt.toISOString() 
      : new Date(content.createdAt).toISOString();
    markdown += `**Created**: ${createdAt}\n`;
    markdown += `**Status**: ${content.status}\n`;
    markdown += `**Version**: ${content.version || 1}\n`;
    if (content.keywords && Array.isArray(content.keywords)) {
      markdown += `**Keywords**: ${content.keywords.join(', ')}\n`;
    }
    markdown += `\n---\n\n`;
  }

  if (content.summary) {
    markdown += `## Summary\n\n${content.summary}\n\n`;
  }

  markdown += content.content;

  const filename = `${safeTitle}_${timestamp}.md`;
  const size = Buffer.byteLength(markdown, 'utf8');

  // In production, save to file storage (S3, etc.)
  // For now, return as data URL
  const dataUrl = `data:text/markdown;base64,${Buffer.from(markdown).toString('base64')}`;

  return { url: dataUrl, filename, size };
}

/**
 * Export as DOCX (VIP-10602)
 * In production, use a library like docx or mammoth
 */
function exportDocx(
  content: GeneratedContent,
  safeTitle: string,
  timestamp: number,
  options: any
): { url: string; filename: string; size: number } {
  // Placeholder implementation
  // In production, use: npm install docx
  // Create actual DOCX file with proper formatting

  const docxContent = `${content.title}\n\n${content.content}`;
  const filename = `${safeTitle}_${timestamp}.docx`;
  const size = Buffer.byteLength(docxContent, 'utf8');

  // Placeholder data URL
  const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${Buffer.from(docxContent).toString('base64')}`;

  return { url: dataUrl, filename, size };
}

/**
 * Export as PDF (VIP-10603)
 * Generates a minimal valid PDF structure with proper formatting
 */
function exportPdf(
  content: GeneratedContent,
  safeTitle: string,
  timestamp: number,
  options: any
): { url: string; filename: string; size: number } {
  const title = content.title || 'Untitled';
  let text = content.content || '';
  
  // Clean content - remove metadata strings and formatting artifacts
  let cleanText = text
    // Remove metadata patterns like "&&---&SEO_TITLE:"
    .replace(/&&---&[A-Z_]+:\s*/g, '')
    .replace(/&{2,}/g, '')
    // Remove markdown metadata blocks
    .replace(/^---[\s\S]*?---\n/gm, '')
    // Clean up excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Escape special characters for PDF strings
  // FIX: Added more escape characters to prevent PDF corruption
  const escapePdfString = (str: string): string => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\$/g, '\\$')
      .replace(/\n/g, ' ')  // Replace newlines with spaces in PDF strings
      .replace(/\r/g, ' ')  // Replace carriage returns
      .replace(/\t/g, ' ')  // Replace tabs
      .replace(/[\x00-\x1F]/g, '');  // Remove control characters
  };

  // Parse markdown and convert to structured content
  interface ContentBlock {
    type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'list' | 'blank';
    text: string;
    items?: string[];
  }

  const parseMarkdown = (text: string): ContentBlock[] => {
    const blocks: ContentBlock[] = [];
    const lines = text.split('\n');
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (line === '') {
        blocks.push({ type: 'blank', text: '' });
        i++;
        continue;
      }
      
      // Headers
      if (line.startsWith('# ')) {
        blocks.push({ type: 'h1', text: line.substring(2).trim() });
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push({ type: 'h2', text: line.substring(3).trim() });
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        blocks.push({ type: 'h3', text: line.substring(4).trim() });
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        blocks.push({ type: 'h4', text: line.substring(5).trim() });
        i++;
        continue;
      }
      
      // Lists
      if (line.match(/^[-*+]\s+/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].trim().match(/^[-*+]\s+/)) {
          const item = lines[i].trim().replace(/^[-*+]\s+/, '').trim();
          // Remove markdown formatting from list items
          const cleanItem = item
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
          listItems.push(cleanItem);
          i++;
        }
        blocks.push({ type: 'list', text: '', items: listItems });
        continue;
      }
      
      // Numbered lists
      if (line.match(/^\d+\.\s+/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
          const item = lines[i].trim().replace(/^\d+\.\s+/, '').trim();
          const cleanItem = item
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
          listItems.push(cleanItem);
          i++;
        }
        blocks.push({ type: 'list', text: '', items: listItems });
        continue;
      }
      
      // Paragraphs
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '' && 
             !lines[i].trim().startsWith('#') && 
             !lines[i].trim().match(/^[-*+]\s+/) &&
             !lines[i].trim().match(/^\d+\.\s+/)) {
        paraLines.push(lines[i]);
        i++;
      }
      
      if (paraLines.length > 0) {
        let paraText = paraLines.join(' ').trim();
        // Remove markdown formatting but keep text
        paraText = paraText
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/`([^`]+)`/g, '$1');
        
        if (paraText) {
          blocks.push({ type: 'paragraph', text: paraText });
        }
      }
    }
    
    return blocks;
  };

  // Wrap text to fit page width
  const wrapText = (text: string, maxWidth: number = 70): string[] => {
    const lines: string[] = [];
    const words = text.split(/\s+/);
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (testLine.length > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  };

  const blocks = parseMarkdown(cleanText);
  
  // A4 Paper dimensions (in points at 72 DPI)
  // A4: 210mm × 297mm = 595.276pt × 841.890pt (rounded to 595 × 842)
  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;
  const LEFT_MARGIN = 72; // 1 inch = 72 points
  const RIGHT_MARGIN = 72;
  const TOP_MARGIN = 72;
  const BOTTOM_MARGIN = 72;
  const CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN; // ~451 points
  
  // Build PDF content stream with proper formatting
  let streamContent = '';
  let yPos = PAGE_HEIGHT - TOP_MARGIN; // Start from top margin
  const leftMargin = LEFT_MARGIN;
  
  // Add title (centered, larger font)
  const titleEscaped = escapePdfString(title);
  const titleWidth = title.length * 6; // Approximate character width for 20pt font
  const titleX = Math.max(leftMargin, (PAGE_WIDTH - titleWidth) / 2); // Center on A4 page
  streamContent += `BT\n/F1 20 Tf\n${titleX} ${yPos} Td\n(${titleEscaped}) Tj\nET\n`;
  yPos -= 40;
  
  // Add content blocks with proper formatting
  blocks.forEach(block => {
    // Check if we need a new page (leave space for bottom margin)
    if (yPos < BOTTOM_MARGIN + 40) {
      // Start new page (simplified - would need proper page handling)
      yPos = PAGE_HEIGHT - TOP_MARGIN;
    }
    
    switch (block.type) {
      case 'h1':
        yPos -= 12; // Extra space before heading
        const h1Lines = wrapText(block.text, Math.floor(CONTENT_WIDTH / 7)); // ~64 chars for 11pt font
        h1Lines.forEach(line => {
          streamContent += `BT\n/F1 16 Tf\n${leftMargin} ${yPos} Td\n(${escapePdfString(line)}) Tj\nET\n`;
          yPos -= 22;
        });
        yPos -= 6; // Space after heading
        break;
        
      case 'h2':
        yPos -= 10;
        const h2Lines = wrapText(block.text, Math.floor(CONTENT_WIDTH / 7));
        h2Lines.forEach(line => {
          streamContent += `BT\n/F1 14 Tf\n${leftMargin} ${yPos} Td\n(${escapePdfString(line)}) Tj\nET\n`;
          yPos -= 20;
        });
        yPos -= 4;
        break;
        
      case 'h3':
        yPos -= 8;
        const h3Lines = wrapText(block.text, Math.floor(CONTENT_WIDTH / 7));
        h3Lines.forEach(line => {
          streamContent += `BT\n/F1 13 Tf\n${leftMargin} ${yPos} Td\n(${escapePdfString(line)}) Tj\nET\n`;
          yPos -= 19;
        });
        yPos -= 3;
        break;
        
      case 'h4':
        yPos -= 6;
        const h4Lines = wrapText(block.text, Math.floor(CONTENT_WIDTH / 7));
        h4Lines.forEach(line => {
          streamContent += `BT\n/F1 12 Tf\n${leftMargin + 5} ${yPos} Td\n(${escapePdfString(line)}) Tj\nET\n`;
          yPos -= 18;
        });
        yPos -= 3;
        break;
        
      case 'paragraph':
        const paraLines = wrapText(block.text, Math.floor(CONTENT_WIDTH / 6.5)); // ~69 chars for 11pt font
        paraLines.forEach(line => {
          streamContent += `BT\n/F1 11 Tf\n${leftMargin} ${yPos} Td\n(${escapePdfString(line)}) Tj\nET\n`;
          yPos -= 15;
        });
        yPos -= 5; // Space after paragraph
        break;
        
      case 'list':
        if (block.items) {
          block.items.forEach(item => {
            const itemLines = wrapText(item, Math.floor((CONTENT_WIDTH - 20) / 6.5)); // Account for bullet and indent
            itemLines.forEach((line, idx) => {
              const bulletX = idx === 0 ? leftMargin : leftMargin + 15;
              const textX = idx === 0 ? leftMargin + 12 : leftMargin + 27;
              if (idx === 0) {
                streamContent += `BT\n/F1 11 Tf\n${bulletX} ${yPos} Td\n(•) Tj\nET\n`;
              }
              streamContent += `BT\n/F1 11 Tf\n${textX} ${yPos} Td\n(${escapePdfString(line)}) Tj\nET\n`;
              yPos -= 15;
            });
            yPos -= 3; // Space between list items
          });
          yPos -= 5; // Space after list
        }
        break;
        
      case 'blank':
        yPos -= 10; // Space for blank line
        break;
    }
  });

  const contentLength = Buffer.byteLength(streamContent, 'utf8');
  
  // Build PDF with proper offset tracking
  // FIX: Use a single consistent method to build PDF and calculate offsets
  const pdfParts: string[] = [];
  const offsets: number[] = [];
  
  const appendPart = (str: string): void => {
    const offset = pdfParts.length > 0 
      ? offsets[offsets.length - 1] + Buffer.byteLength(pdfParts[pdfParts.length - 1] + '\n', 'utf8')
      : 0;
    offsets.push(offset);
    pdfParts.push(str);
  };
  
  // PDF header
  appendPart('%PDF-1.4\n%âãÏÓ');
  
  // Object 1: Catalog
  appendPart('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  
  // Object 2: Pages
  appendPart('2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj');
  
  // Object 3: Page (A4 size: 595 × 842 points)
  appendPart('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /ProcSet [/PDF /Text] /Font << /F1 5 0 R >> >> >>\nendobj');
  
  // Object 4: Content Stream
  const contentObj = `4 0 obj\n<< /Length ${contentLength} >>\nstream\n${streamContent}\nendstream\nendobj`;
  appendPart(contentObj);
  
  // Object 5: Font
  appendPart('5 0 obj\n<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica /Encoding /MacRomanEncoding >>\nendobj');
  
  // Build xref table (references objects 1-5, not the xref table itself)
  let xrefTable = 'xref\n';
  xrefTable += '0 6\n';
  xrefTable += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    xrefTable += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  
  // Append xref table
  appendPart(xrefTable);
  
  // Calculate xref start position (position where xref table starts)
  const xrefStart = offsets[offsets.length - 1];
  
  // Append trailer and startxref
  appendPart('trailer\n<< /Size 6 /Root 1 0 R >>');
  appendPart(`startxref\n${xrefStart}\n%%EOF`);
  
  // Build final PDF from parts (this ensures offsets are correct)
  const finalPdf = pdfParts.join('\n');
  const pdfBuffer = Buffer.from(finalPdf, 'utf8');
  const filename = `${safeTitle}_${timestamp}.pdf`;
  const size = pdfBuffer.byteLength;
  const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

  return { url: dataUrl, filename, size };
}

/**
 * Export as HTML
 */
function exportHtml(
  content: GeneratedContent,
  safeTitle: string,
  timestamp: number,
  options: any
): { url: string; filename: string; size: number } {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .metadata { color: #666; font-size: 0.9em; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${content.title}</h1>`;

  if (options.includeMetadata) {
    const createdAt = content.createdAt instanceof Date 
      ? content.createdAt.toISOString() 
      : new Date(content.createdAt).toISOString();
    html += `
  <div class="metadata">
    <p><strong>Created:</strong> ${createdAt}</p>
    <p><strong>Status:</strong> ${content.status}</p>
    <p><strong>Version:</strong> ${content.version || 1}</p>
  </div>`;
  }

  html += `
  <div class="content">
    ${content.content.replace(/\n/g, '<br>')}
  </div>
</body>
</html>`;

  const filename = `${safeTitle}_${timestamp}.html`;
  const size = Buffer.byteLength(html, 'utf8');

  const dataUrl = `data:text/html;base64,${Buffer.from(html).toString('base64')}`;

  return { url: dataUrl, filename, size };
}
