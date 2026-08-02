import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json();
    const avatarBase64 = body.avatarBase64 as string | undefined;
    if (!avatarBase64) return NextResponse.json({ error: 'No image provided.' }, { status: 400 });

    const m = avatarBase64.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!m) return NextResponse.json({ error: 'Invalid image data.' }, { status: 400 });

    const mime = m[1];
    const data = m[2];
    const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
    const buffer = Buffer.from(data, 'base64');
    const fileName = `${userId}-avatar.${ext}`;

    // Try S3 then GCS, fall back to local filesystem
    let publicUrl = '';
    if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
      try {
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
        const client = new S3Client({ region: process.env.AWS_REGION, credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID || '', secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '' } });
        await client.send(new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: fileName, Body: buffer, ContentType: mime, ACL: 'public-read' }));
        publicUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      } catch (err) {
        console.error('S3 avatar upload failed, falling back', err);
      }
    }

    if (!publicUrl && process.env.GCS_BUCKET) {
      try {
        const { Storage } = await import('@google-cloud/storage');
        const storage = new Storage();
        const bucket = storage.bucket(process.env.GCS_BUCKET);
        const file = bucket.file(fileName);
        await file.save(buffer, { contentType: mime, public: true });
        publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${fileName}`;
      } catch (err) {
        console.error('GCS avatar upload failed, falling back', err);
      }
    }

    if (!publicUrl) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, buffer);
      publicUrl = `/uploads/${fileName}`;
    }

    await db.user.update({ where: { id: userId }, data: { avatarUrl: publicUrl } });

    return NextResponse.json({ avatarUrl: publicUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar.' }, { status: 500 });
  }
}
