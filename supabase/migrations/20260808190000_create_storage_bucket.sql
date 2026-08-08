-- CREATE PUBLIC STORAGE BUCKET FOR IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES FOR STORAGE
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Allow upload for authenticated and anon"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow update/delete for authenticated and anon"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');

CREATE POLICY "Allow delete for authenticated and anon"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');
