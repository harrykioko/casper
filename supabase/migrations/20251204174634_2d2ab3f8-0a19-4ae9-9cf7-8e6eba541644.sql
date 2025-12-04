-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- RLS: Users can upload logos
CREATE POLICY "Users can upload company logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'company-logos' 
    AND auth.uid() IS NOT NULL
  );

-- RLS: Anyone can view logos (public bucket)
CREATE POLICY "Public can view company logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'company-logos');

-- RLS: Users can update their uploads
CREATE POLICY "Users can update their logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'company-logos' 
    AND auth.uid() IS NOT NULL
  );

-- RLS: Users can delete their logos  
CREATE POLICY "Users can delete their logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'company-logos'
    AND auth.uid() IS NOT NULL
  );