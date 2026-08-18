import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadPublic } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const type = body.type === 'cover' ? 'cover' : 'avatar';
    const imageBase64 = type === 'cover' ? body.coverBase64 : body.avatarBase64;
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
    }

    const m = String(imageBase64).match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
    if (!m) {
      return NextResponse.json({ error: 'Invalid image.' }, { status: 400 });
    }

    const contentType = m[1];
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const buffer = Buffer.from(m[2], 'base64');
    const bucket = type === 'cover' ? 'covers' : 'avatars';
    const path = `${userId}/${type}.${ext}`;
    const url = await uploadPublic(bucket, path, buffer, contentType);

    if (type === 'cover') {
      await supabaseAdmin.from('ss_user').update({ cover_url: url }).eq('id', userId);
      return NextResponse.json({ coverUrl: url, url });
    }

    await supabaseAdmin.from('ss_user').update({ avatar_url: url }).eq('id', userId);
    return NextResponse.json({ avatarUrl: url, url });
  } catch (e: any) {
    console.error('avatar upload', e);
    return NextResponse.json({ error: e?.message || 'Upload failed.' }, { status: 500 });
  }
}
