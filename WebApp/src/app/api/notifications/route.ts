import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isMissingTable } from '@/lib/supabase-safe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    const { data, error } = await supabaseAdmin
      .from('ss_notification')
      .select('id,type,title,body,read,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      if (isMissingTable(error)) return NextResponse.json([]);
      console.error('notifications', error);
      return NextResponse.json([]);
    }
    return NextResponse.json(
      (data || []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.created_at,
      })),
    );
  } catch (e) {
    console.error('notifications', e);
    return NextResponse.json([]);
  }
}
