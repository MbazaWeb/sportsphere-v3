import { supabaseAdmin } from '@/lib/supabase';

export function isMissingTable(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = String(error.code || '');
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST116' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache')
  );
}

export async function safeSelect<T = any>(
  table: string,
  build?: (q: any) => any,
): Promise<{ data: T[]; error: string | null; missing: boolean }> {
  try {
    let q = supabaseAdmin.from(table).select('*');
    if (build) q = build(q);
    const { data, error } = await q;
    if (error) {
      if (isMissingTable(error)) {
        console.warn(`[supabase] missing table ${table}:`, error.message);
        return { data: [], error: null, missing: true };
      }
      return { data: [], error: error.message, missing: false };
    }
    return { data: (data as T[]) || [], error: null, missing: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isMissingTable({ message: msg })) {
      return { data: [], error: null, missing: true };
    }
    return { data: [], error: msg, missing: false };
  }
}
