
-- Create the media storage bucket (public for easy image display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: anyone can read public bucket files (bucket is public)
CREATE POLICY "Public read access for media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- RLS: users can update their own files
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: users can delete their own files
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
