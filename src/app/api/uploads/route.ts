import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

async function uploadToS3(fileName: string, buffer: Buffer, contentType: string) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) throw new Error('S3 not configured');
  const client = new S3Client({ region, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || '', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '' } });
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: fileName, Body: buffer, ContentType: contentType, ACL: 'public-read' }));
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
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const contentType = file.type || 'application/octet-stream';
    const ext = contentType.split('/')[1] || 'bin';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;

    // Try cloud providers first (S3 then GCS), fall back to local filesystem
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

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
