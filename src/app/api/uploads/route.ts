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
  // Note: no ACL: 'public-read' — use pre-signed URLs or bucket policy instead
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

export async function POST(request: NextRequest) {
  // ── Auth check — must be signed in ──────────────────────────
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    // ── Validate MIME type (from declared type; magic-byte check would need a library) ──
    const contentType = file.type || '';
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: 'File type not allowed.' }, { status: 400 });
    }

    // ── Validate file size ───────────────────────────────────
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

    // Local filesystem fallback — write to public/uploads/
    // In standalone mode, .next/standalone/public must point to the real public/
    // (the deploy script creates this symlink, but we self-heal if it's missing).
    const realPublicDir = path.join(process.cwd(), 'public', 'uploads');
    const standalonePublicDir = path.join(process.cwd(), '.next', 'standalone', 'public', 'uploads');

    // Ensure the real public/uploads/ directory exists
    await fs.mkdir(realPublicDir, { recursive: true });

    // Self-heal: create symlink .next/standalone/public → ../../public if missing
    // This ensures the standalone server can serve uploaded files.
    const standalonePublic = path.join(process.cwd(), '.next', 'standalone', 'public');
    const standalonePublicExists = await fs.access(standalonePublic).then(() => true).catch(() => false);
    if (!standalonePublicExists) {
      await fs.mkdir(standalonePublic, { recursive: true });
      try {
        await fs.symlink(path.resolve(process.cwd(), 'public'), standalonePublic, 'junction');
      } catch (symlinkErr: unknown) {
        // If symlink already exists (race) or other OS error, try copy as last resort
        const code = (symlinkErr as NodeJS.ErrnoException)?.code;
        if (code !== 'EEXIST') {
          console.warn('Could not create standalone public symlink, falling back to copy:', symlinkErr);
          const { execSync } = await import('child_process');
          try { execSync('cp -rn public/* .next/standalone/public/ 2>/dev/null || true'); } catch {}
        }
      }
    }

    const filePath = path.join(realPublicDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Also ensure the file exists in standalone path (in case symlink failed)
    await fs.mkdir(standalonePublicDir, { recursive: true }).catch(() => {});
    await fs.copyFile(filePath, path.join(standalonePublicDir, fileName)).catch(() => {});

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return NextResponse.json({ url: `${basePath}/uploads/${fileName}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
