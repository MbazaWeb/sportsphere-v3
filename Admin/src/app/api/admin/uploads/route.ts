import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminGuard';
import { uploadPublic } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return auth.response;
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `admin/${auth.user.sub}/${Date.now()}.${ext}`;
    const url = await uploadPublic('posts', path, buf, file.type || 'application/octet-stream');
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error('admin upload', e);
    return NextResponse.json({ error: e?.message || 'Upload failed.' }, { status: 500 });
  }
}
