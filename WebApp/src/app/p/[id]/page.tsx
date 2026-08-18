import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

interface PageProps { params: Promise<{ id: string }>; }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin.from('ss_post').select('content').eq('id', id).limit(1);
  return { title: data?.[0]?.content?.slice(0, 60) || 'Post - SportSphere' };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/sportsphere?post=${encodeURIComponent(id)}`);
}
