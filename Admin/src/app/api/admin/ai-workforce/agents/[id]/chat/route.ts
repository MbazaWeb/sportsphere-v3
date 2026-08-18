import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-ss';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const { message } = await request.json().catch(() => ({}));
  return NextResponse.json({ data: { reply: 'AI chat is not wired yet.', echo: message || '' } });
}
