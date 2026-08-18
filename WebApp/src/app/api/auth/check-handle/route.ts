import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const handle = (request.nextUrl.searchParams.get('handle') || '').trim();
  if (!handle) return NextResponse.json({ available: false });
  const h = handle.startsWith('@') ? handle : `@${handle}`;
  const { data } = await supabaseAdmin.from('ss_user').select('id').or(`handle.eq."${h}",handle.ilike."${h}"`).limit(1);
  return NextResponse.json({ available: !data?.length, handle: h });
}
