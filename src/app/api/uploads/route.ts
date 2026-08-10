import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Allowed MIME types for uploads
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/quicktime',
]);

// Max file size: 100 MB (videos can be large; S3/GCS recommended)
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

/**
 * Resolve the REAL public/uploads directory.
 * In standalone mode the cwd may vary, so we use an explicit env var
 * (UPLOAD_DIR) or walk up from __dirname to find the project root.
 */
function resolveUploadDir(): string {
  // 1) Explicit env override (most reliable for production)
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;

  // 2) Derive from the source file location:
  //    src/app/api/uploads/route.ts  →  projectRoot/public/uploads
  const srcDir = path.resolve(__dirname, '..', '..', '..', '..');
  const candidate = path.join(srcDir, 'public', 'uploads');
  return candidate;
}

export async function POST(request: NextRequest) {
  // Auth check — must be signed in
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    // Validate MIME type
    const contentType = file.type || '';
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: 'File type not allowed.' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds 100 MB limit.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use extension from the allowed MIME type (not from the filename)
    const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Try cloud providers first, fall back to local filesystem
    if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
      try {
        const url = await uploadToS3(fileName, buffer, contentType);
        return NextResponse.json({ url });
      } catch (err) {
        console.error('S3 upload failed, falling back to local', err);
      }
    }

    if (process.env.GCS_BUCKET) {
      try {
        const url = await uploadToGCS(fileName, buffer, contentType);
        return NextResponse.json({ url });
      } catch (err) {
        console.error('GCS upload failed, falling back to local', err);
      }
    }

    // ── Local filesystem fallback ──────────────────────────────
    // Write to the REAL public/uploads (not the standalone copy).
    const uploadDir = resolveUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);
    console.log(`[upload] Written to ${filePath} (${buffer.length} bytes)`);

    // Also ensure the standalone public/uploads has it (for Next.js static serving)
    const standaloneUploadDir = path.join(
      path.resolve(uploadDir, '..', '..', '.next', 'standalone', 'public', 'uploads')
    );
    await fs.mkdir(standaloneUploadDir, { recursive: true }).catch(() => {});
    await fs.copyFile(filePath, path.join(standaloneUploadDir, fileName)).catch(() => {});

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return NextResponse.json({ url: `${basePath}/uploads/${fileName}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}

/**
 * GET /api/uploads?file=filename  — serve uploaded files as a
 * fallback when nginx can't find them.  This ensures uploads are
 * always accessible even if the nginx alias is misconfigured.
 */
export async function GET(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get('file');
  if (!fileName) {
    return NextResponse.json({ error: 'Missing file param' }, { status: 400 });
  }
  // Prevent path traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
  }

  const uploadDir = resolveUploadDir();
  const filePath = path.join(uploadDir, fileName);

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    };
    const contentType = mimeMap[ext] || 'application/octet-stream';
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
