import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle).startsWith('@') ? decodeURIComponent(rawHandle) : `@${decodeURIComponent(rawHandle)}`;

  const user = await db.user.findUnique({
    where: { handle },
    select: { name: true, handle: true, bio: true, avatarUrl: true },
  });

  if (!user) return { title: 'User Not Found' };

  return {
    title: `${user.name} (${user.handle}) - SportSphere`,
    description: user.bio || `Check out ${user.name}'s profile on SportSphere.`,
    openGraph: {
      title: `${user.name} on SportSphere`,
      description: user.bio || `Join the community and follow ${user.name}.`,
      images: user.avatarUrl ? [{ url: user.avatarUrl }] : [],
    },
    twitter: {
      card: 'summary',
      title: `${user.name} on SportSphere`,
      description: user.bio || `Join the community and follow ${user.name}.`,
      images: user.avatarUrl ? [user.avatarUrl] : [],
    },
  };
}

export default async function UserPage({ params }: PageProps) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle).startsWith('@') ? decodeURIComponent(rawHandle) : `@${decodeURIComponent(rawHandle)}`;

  const user = await db.user.findUnique({
    where: { handle },
    select: { id: true },
  });

  if (!user) notFound();

  // Redirect to the main app profile view
  redirect(`/?user=${user.id}`);
}
