import { supabaseAdmin } from '@/lib/supabase';

export async function uploadPublic(
  bucket: 'avatars' | 'covers' | 'posts',
  path: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
