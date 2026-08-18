import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

interface PageProps { params: Promise<{ handle: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle: raw } = await params;
  const handle = decodeURIComponent(raw).startsWith('@') ? decodeURIComponent(raw) : `@${decodeURIComponent(raw)}`;
  const { data } = await supabaseAdmin.from('ss_user').select('name,handle,bio').eq('handle', handle).limit(1);
  const user = data?.[0];
  if (!user) return { title: 'User Not Found' };
  return { title: `${user.name} (${user.handle}) - SportSphere`, description: user.bio || '' };
}

export default async function UserPage({ params }: PageProps) {
  const { handle: raw } = await params;
  redirect(`/sportsphere?u=${encodeURIComponent(raw)}`);
}
