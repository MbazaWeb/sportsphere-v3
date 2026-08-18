import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, jsonData } from '@/lib/admin-ss';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const q = request.nextUrl.searchParams.get('q') || '';
  let query = supabaseAdmin.from('ss_user').select('id,name,email,handle,role').limit(20);
  if (q) query = query.or(`name.ilike."%${q}%",email.ilike."%${q}%",handle.ilike."%${q}%"`);
  const { data } = await query;
  return jsonData(data || []);
}
