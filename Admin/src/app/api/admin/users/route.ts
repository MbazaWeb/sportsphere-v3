import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();
    let query = supabaseAdmin.from('ss_user').select('id,name,email,handle,role,avatar_url,is_verified,is_active,created_at').order('created_at', { ascending: false }).limit(100);
    if (q) query = query.or(`name.ilike."%${q}%",email.ilike."%${q}%",handle.ilike."%${q}%"`);
    const { data, error } = await query;
    if (error && isMissingTable(error)) return NextResponse.json([]);
    return NextResponse.json((data || []).map((u) => ({
      id: u.id, name: u.name, email: u.email, handle: u.handle, role: u.role,
      avatarUrl: u.avatar_url, isVerified: u.is_verified, isActive: u.is_active, createdAt: u.created_at,
    })));
  } catch (e) {
    console.error(e);
    return NextResponse.json([]);
  }
}
