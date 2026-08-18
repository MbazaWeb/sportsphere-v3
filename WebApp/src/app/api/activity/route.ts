import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json([]);
    const { data, error } = await supabaseAdmin.from('ss_activity').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    if (error && isMissingTable(error)) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch { return NextResponse.json([]); }
}
