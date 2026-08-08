import { NextResponse } from 'next/server';
import { buildClearCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', buildClearCookie());
  return response;
}
