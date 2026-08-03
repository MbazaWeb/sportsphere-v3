import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const buffer = Buffer.from(data, 'base64');

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'sportsphere/avatars',
          public_id: `${userId}-avatar`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result as { secure_url: string });
        }
      );
      stream.end(buffer);
    });

    const avatarUrl = result.secure_url;

    await db.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar.' }, { status: 500 });
  }
}
