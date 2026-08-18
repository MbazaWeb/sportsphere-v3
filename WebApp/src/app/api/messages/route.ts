import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const { data, error } = await supabaseAdmin
      .from('ss_message')
      .select('id,sender_id,recipient_id,body,created_at,read')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(80);
    if (error && isMissingTable(error)) return NextResponse.json([]);
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const { recipientId, body } = await request.json();
    if (!recipientId || !body) return NextResponse.json({ error: 'recipientId and body required.' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('ss_message').insert({
      sender_id: userId, recipient_id: recipientId, body: String(body), read: false,
    }).select('*').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error('message', e);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
