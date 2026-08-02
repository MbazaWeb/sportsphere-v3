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

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const fileName = `${userId}-avatar.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    await db.user.update({ where: { id: userId }, data: { avatarUrl: publicUrl } });

    return NextResponse.json({ avatarUrl: publicUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar.' }, { status: 500 });
  }
}
