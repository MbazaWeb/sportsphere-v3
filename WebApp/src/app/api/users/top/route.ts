import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('ss_user')
      .select('id,name,handle,role,avatar_url,avatar_initials,is_verified')
      .eq('is_verified', true)
      .not('role','in','(ADMINISTRATOR,admin,administrator)').limit(10);
    if (error && isMissingTable(error)) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}
