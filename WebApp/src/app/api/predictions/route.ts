import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('ss_post').select('*').eq('post_type', 'prediction').order('created_at', { ascending: false }).limit(30);
    if (error && isMissingTable(error)) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch { return NextResponse.json([]); }
}
