import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = await Promise.resolve(ctx.params as any);
    const { data, error } = await supabaseAdmin
      .from('ss_user')
      .select('id,name,handle,role,avatar_url,avatar_initials,bio,is_verified')
      .eq('id', id)
      .limit(1);
    if (error && isMissingTable(error)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const u = data?.[0];
    if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      id: u.id, name: u.name, handle: u.handle, role: u.role,
      avatarUrl: u.avatar_url, avatarInitials: u.avatar_initials, bio: u.bio, isVerified: !!u.is_verified,
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
