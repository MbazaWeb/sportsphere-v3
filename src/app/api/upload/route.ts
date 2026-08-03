import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'image', 'image/png': 'image',
  'image/gif': 'image',  'image/webp': 'image',
  'video/mp4': 'video',  'video/webm': 'video',
  'video/quicktime': 'video',
};

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large. Max 100MB.' }, { status: 400 });

    const resourceType = ALLOWED_TYPES[file.type];
    if (!resourceType) return NextResponse.json({ error: 'File type not allowed.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'sportsphere/' + userId,
          resource_type: resourceType as 'image' | 'video',
          transformation: resourceType === 'image'
            ? [{ quality: 'auto', fetch_format: 'auto' }, { width: 1200, height: 1200, crop: 'limit' }]
            : undefined,
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result as { secure_url: string });
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
