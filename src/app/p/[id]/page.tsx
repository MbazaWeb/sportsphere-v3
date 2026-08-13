import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { safeJsonParse } from '@/lib/json';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const post = await db.post.findUnique({
    where: { id },
    include: { user: { select: { name: true, handle: true } } },
  });

  if (!post) return { title: 'Post Not Found' };

  const mediaUrls = safeJsonParse<string[]>(post.mediaUrls, []);
  const previewImage = mediaUrls.length > 0 ? mediaUrls[0] : '/logo.svg';

  return {
    title: `${post.user.name} on SportSphere: "${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}"`,
    description: post.content || 'Check out this post on SportSphere.',
    openGraph: {
      title: `SportSphere Post by ${post.user.name}`,
      description: post.content || 'Join the conversation on SportSphere.',
      images: [{ url: previewImage }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `SportSphere Post by ${post.user.name}`,
      description: post.content || 'Join the conversation on SportSphere.',
      images: [previewImage],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;

  const post = await db.post.findUnique({
    where: { id },
  });

  if (!post) notFound();

  // Redirect to the main app post view
  redirect(`/?post=${post.id}`);
}
