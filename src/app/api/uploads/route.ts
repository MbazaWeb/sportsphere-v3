import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import fsSync, { Readable } from 'fs';
import path from 'path';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Up to 2 min for large video uploads on serverless

// Allowed MIME types for uploads
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp',
]);

// Also allow by extension for mobile browsers that send empty MIME
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'mp4', 'webm', 'mov', '3gp']);

// Max file size: 100 MB
const MAX_BYTES = 100 * 1024 * 1024;

async function uploadToS3(fileName: string, buffer: Buffer, contentType: string) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) throw new Error('S3 not configured');
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) throw new Error('S3 credentials not configured');
  const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: fileName, Body: buffer, ContentType: contentType }));
  return `https://${bucket}.s3.${region}.amazonaws.com/${fileName}`;
}

async function uploadToGCS(fileName: string, buffer: Buffer, contentType: string) {
  const { Storage } = await import('@google-cloud/storage');
  const bucketName = process.env.GCS_BUCKET;
  if (!bucketName) throw new Error('GCS not configured');
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  await file.save(buffer, { contentType, public: true });
  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}

/** Resolve the public/uploads directory */
function resolveUploadDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  const srcDir = path.resolve(__dirname, '..', '..', '..', '..');
  return path.join(srcDir, 'public', 'uploads');
}

/** Stream file to disk using Node.js write stream (avoids OOM on large videos) */
function streamFileToDisk(file: File, filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    fsSync.mkdirSync(dir, { recursive: true });

    const writeStream = fsSync.createWriteStream(filePath);
    const webStream = file.stream();
    const nodeStream = Readable.fromWeb(webStream as any);

    let totalBytes = 0;

    nodeStream.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BYTES) {
        nodeStream.destroy();
        writeStream.destroy();
        fsSync.unlinkSync(filePath);
        reject(new Error(`File exceeds ${MAX_BYTES / 1024 / 1024} MB limit`));
      }
    });

    nodeStream.pipe(writeStream);

    writeStream.on('finish', () => resolve(totalBytes));
    writeStream.on('error', reject);
    nodeStream.on('error', (err: Error) => {
      writeStream.destroy();
      try { fsSync.unlinkSync(filePath); } catch {}
      reject(err);
    });
  });
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    // Validate MIME type (allow empty MIME if extension is valid — common on iOS)
    const contentType = file.type || '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (contentType && !ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({
        error: `File type "${contentType}" not allowed. Use MP4, WebM, MOV, JPEG, PNG, or GIF.`
      }, { status: 400 });
    }

    if (!contentType && !ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: 'Cannot determine file type. Please use MP4, WebM, MOV format.' }, { status: 400 });
    }

    // Check size from File metadata (quick reject)
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max is ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 400 });
    }

    // Determine extension from MIME type, falling back to filename
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
      'image/webp': 'webp', 'image/avif': 'avif',
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
      'video/3gpp': '3gp',
    };
    const finalExt = extMap[contentType] || (ALLOWED_EXT.has(ext) ? ext : 'mp4');
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${finalExt}`;
    const finalContentType = contentType || `video/${finalExt === 'mov' ? 'quicktime' : finalExt}`;

    // Try cloud providers first
    if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const url = await uploadToS3(fileName, Buffer.from(arrayBuffer), finalContentType);
        return NextResponse.json({ url });
      } catch (err) {
        console.error('S3 upload failed, falling back to local', err);
      }
    }

    if (process.env.GCS_BUCKET) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const url = await uploadToGCS(fileName, Buffer.from(arrayBuffer), finalContentType);
        return NextResponse.json({ url });
      } catch (err) {
        console.error('GCS upload failed, falling back to local', err);
      }
    }

    // ── Local filesystem: stream to disk ──
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    const bytesWritten = await streamFileToDisk(file, filePath);
    console.log(`[upload] Written ${bytesWritten} bytes to ${filePath} (type: ${finalContentType})`);

    // Also copy to standalone public/uploads
    const standaloneDir = path.join(
      path.resolve(resolveUploadDir(), '..', '..', '.next', 'standalone', 'public', 'uploads')
    );
    await fs.mkdir(standaloneDir, { recursive: true }).catch(() => {});
    await fs.copyFile(filePath, path.join(standaloneDir, fileName)).catch(() => {});

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return NextResponse.json({ url: `${basePath}/uploads/${fileName}` });
  } catch (error: any) {
    console.error('[upload] Error:', error);
    const msg = error?.message || '';
    if (msg.includes('exceeds')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: 'Upload failed. Try a smaller file or check your connection.' }, { status: 500 });
  }
}

/**
 * GET /api/uploads?file=filename — serve uploaded files with range request support
 * for video seeking on mobile browsers.
 */
export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get('file');
  if (!fileName) {
    return NextResponse.json({ error: 'Missing file param' }, { status: 400 });
  }
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', path.basename(fileName));

  try {
    const stat = await fs.stat(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
      '.3gp': 'video/3gpp',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';

    // Handle Range requests (essential for video seeking on mobile)
    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      const fileBuffer = await fs.readFile(filePath);
      const chunk = fileBuffer.slice(start, end + 1);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Full file response
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
