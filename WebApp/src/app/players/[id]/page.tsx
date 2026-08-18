import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

interface PageProps { params: Promise<{ id: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin.from('ss_user').select('name,handle').eq('id', id).limit(1);
  const u = data?.[0];
  return { title: u ? `${u.name} - SportSphere` : 'Player - SportSphere' };
}

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/sportsphere?player=${encodeURIComponent(id)}`);
}
