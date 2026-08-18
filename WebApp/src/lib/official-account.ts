import { supabaseAdmin } from '@/lib/supabase';

export const OFFICIAL_HANDLE = '@sportsphere';
export const OFFICIAL_NAME = 'SportSphere';
export const OFFICIAL_AVATAR =
  process.env.NEXT_PUBLIC_OFFICIAL_AVATAR_URL ||
  `${process.env.NEXT_PUBLIC_BASE_PATH || '/sportsphere'}/logo.svg`;

const ADMIN_ROLES = new Set(['administrator', 'admin', 'super-admin', 'super_admin']);

export function isAdminRole(role?: string | null) {
  return ADMIN_ROLES.has(String(role || '').toLowerCase());
}

export function publicUserView(u: any) {
  if (!u) return u;
  if (isAdminRole(u.role)) {
    return {
      ...u,
      name: OFFICIAL_NAME,
      handle: OFFICIAL_HANDLE,
      avatarUrl: u.avatar_url || u.avatarUrl || OFFICIAL_AVATAR,
      avatar_url: OFFICIAL_AVATAR,
      avatarInitials: 'SS',
      role: 'official',
      isVerified: true,
      badge: 'admin',
    };
  }
  return u;
}

export async function getOfficialUserId(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('ss_user')
    .select('id')
    .eq('handle', OFFICIAL_HANDLE)
    .limit(1);
  if (data?.[0]?.id) return data[0].id;

  const id = 'ss-official-sportsphere';
  await supabaseAdmin.from('ss_user').upsert({
    id,
    name: OFFICIAL_NAME,
    handle: OFFICIAL_HANDLE,
    email: 'official@sportsphere.com',
    role: 'official',
    avatar_url: OFFICIAL_AVATAR,
    avatar_initials: 'SS',
    is_verified: true,
    is_active: true,
    bio: 'Official SportSphere account',
  }, { onConflict: 'id' });
  return id;
}
