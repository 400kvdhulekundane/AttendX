
-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, employee_id, department, branch_id, role, status, profile_photo_url, id_card_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'employee_id',
    NEW.raw_user_meta_data->>'department',
    (NEW.raw_user_meta_data->>'branch_id')::uuid,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'approved'
      ELSE 'pending'
    END,
    NEW.raw_user_meta_data->>'profile_photo_url',
    NEW.raw_user_meta_data->>'id_card_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-delete live_locations older than 30 days
CREATE OR REPLACE FUNCTION delete_old_live_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM live_locations WHERE timestamp < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage buckets for profile photos and ID cards (created via API in setup)
-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE live_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
