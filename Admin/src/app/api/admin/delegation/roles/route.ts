import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ssList, jsonData } from '@/lib/admin-ss';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;
  const roles = await ssList('ss_admin_role', (q) => q.eq('is_active', true).order('tier'));
  return jsonData(roles.map((r: any) => ({
    id: r.id, slug: r.slug, name: r.name, tier: r.tier, description: r.description, isActive: r.is_active,
  })));
}
