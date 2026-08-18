import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('ss_user')
      .select('id,name,handle,role,avatar_url,avatar_initials,is_verified')
      .not('role','in','(ADMINISTRATOR,admin,administrator)').limit(12);
    if (error && isMissingTable(error)) return NextResponse.json([]);
    return NextResponse.json((data || []).map((u) => ({
      id: u.id, name: u.name, handle: u.handle, role: u.role,
      avatarUrl: u.avatar_url, avatarInitials: u.avatar_initials, isVerified: !!u.is_verified,
    })));
  } catch {
    return NextResponse.json([]);
  }
}
