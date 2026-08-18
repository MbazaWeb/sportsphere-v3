import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function make(url: string, key: string, extra?: object): SupabaseClient {
  if (!url || !key) {
    return createClient('https://invalid.supabase.co', 'public-anon-placeholder', extra as any);
  }
  return createClient(url, key, extra as any);
}

export const supabaseAdmin = make(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false, storageKey: 'ss-admin-auth' },
});

export const supabase = make(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, storageKey: 'ss-web-auth' },
});


export default supabaseAdmin;
