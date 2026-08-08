import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
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
    const userId = (request.headers.get('x-user-id') ?? await getUserIdFromRequest(request));

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const type = body.type === 'cover' ? 'cover' : 'avatar';

    const imageBase64 =
      type === 'cover'
        ? body.coverBase64
        : body.avatarBase64;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'No image provided.' },
        { status: 400 }
      );
    }

    const m = imageBase64.match(/^data:(image\/\w+);base64,(.*)$/);

    if (!m) {
      return NextResponse.json(
        { error: 'Invalid image.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(m[2], 'base64');

    const upload = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder:
              type === 'cover'
                ? 'sportsphere/covers'
                : 'sportsphere/avatars',

            public_id:
              type === 'cover'
                ? `${userId}-cover`
                : `${userId}-avatar`,

            overwrite: true,

            resource_type: 'image',

            transformation:
              type === 'cover'
                ? [
                    {
                      width: 1600,
                      height: 600,
                      crop: 'fill'
                    },
                    {
                      quality: 'auto',
                      fetch_format: 'auto'
                    }
                  ]
                : [
                    {
                      width: 400,
                      height: 400,
                      crop: 'fill',
                      gravity: 'face'
                    },
                    {
                      quality: 'auto',
                      fetch_format: 'auto'
                    }
                  ]
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    if (type === 'cover') {
      await db.user.update({
        where: { id: userId },
        data: {
          coverUrl: upload.secure_url
        }
      });

      return NextResponse.json({
        coverUrl: upload.secure_url
      });
    }

    await db.user.update({
      where: { id: userId },
      data: {
        avatarUrl: upload.secure_url
      }
    });

    return NextResponse.json({
      avatarUrl: upload.secure_url
    });

  } catch (e) {
    console.error(e);

    return NextResponse.json(
      { error: 'Upload failed.' },
      { status: 500 }
    );
  }
}
