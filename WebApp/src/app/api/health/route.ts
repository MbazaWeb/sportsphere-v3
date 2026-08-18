import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await supabaseAdmin.from('ss_user').select('id').limit(1);
  return NextResponse.json({
    ok: !error,
    db: error ? error.message : 'supabase',
    time: new Date().toISOString(),
  }, { status: error ? 503 : 200 });
}
