-- Create storage buckets if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('covers',  'covers',  true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('posts',   'posts',   true, 52428800, ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/mov']),
  ('media',   'media',   true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS policies (drop and recreate cleanly)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "covers_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "covers_auth_upload"  ON storage.objects;
DROP POLICY IF EXISTS "posts_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "posts_auth_upload"   ON storage.objects;
DROP POLICY IF EXISTS "media_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "media_auth_upload"   ON storage.objects;

-- Allow public read on all buckets
CREATE POLICY "public_read_all" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars','covers','posts','media'));

-- Allow service role full access (our server uses service key)
CREATE POLICY "service_role_all" ON storage.objects
  FOR ALL USING (true)
  WITH CHECK (true);
