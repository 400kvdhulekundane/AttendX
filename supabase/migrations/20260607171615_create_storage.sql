
-- Storage: create buckets for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('id-cards', 'id-cards', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-photos (public read)
CREATE POLICY "public_read_profile_photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "auth_upload_profile_photos" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "auth_update_profile_photos" ON storage.objects FOR UPDATE
  TO authenticated USING (
    bucket_id = 'profile-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for id-cards (private)
CREATE POLICY "owner_read_id_cards" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'id-cards' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "auth_upload_id_cards" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'id-cards' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
