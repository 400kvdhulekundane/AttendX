
-- RLS Policies for profiles
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "admins_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
  );

CREATE POLICY "admins_update_all_profiles" ON profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
  );

-- RLS Policies for branches
CREATE POLICY "admins_insert_branches" ON branches FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admins_update_branches" ON branches FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "admins_delete_branches" ON branches FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "all_read_branches" ON branches FOR SELECT
  TO authenticated USING (true);

-- RLS Policies for attendance_logs
CREATE POLICY "employees_read_own_attendance" ON attendance_logs FOR SELECT
  TO authenticated USING (employee_id = auth.uid());

CREATE POLICY "employees_insert_own_attendance" ON attendance_logs FOR INSERT
  TO authenticated WITH CHECK (employee_id = auth.uid());

CREATE POLICY "employees_update_own_attendance" ON attendance_logs FOR UPDATE
  TO authenticated USING (employee_id = auth.uid()) WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admins_all_attendance" ON attendance_logs FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for geofence_requests
CREATE POLICY "employees_read_own_geofence" ON geofence_requests FOR SELECT
  TO authenticated USING (employee_id = auth.uid());

CREATE POLICY "employees_insert_geofence" ON geofence_requests FOR INSERT
  TO authenticated WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admins_all_geofence" ON geofence_requests FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for work_schedules
CREATE POLICY "employees_read_schedules" ON work_schedules FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "admins_all_schedules" ON work_schedules FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for admin_alerts
CREATE POLICY "admins_all_admin_alerts" ON admin_alerts FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for live_locations
CREATE POLICY "employees_manage_own_location" ON live_locations FOR ALL
  TO authenticated USING (employee_id = auth.uid()) WITH CHECK (employee_id = auth.uid());

CREATE POLICY "admins_read_live_locations" ON live_locations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for notifications
CREATE POLICY "users_read_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins_insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "system_insert_notifications" ON notifications FOR INSERT
  TO service_role WITH CHECK (true);

-- RLS Policies for alert_settings
CREATE POLICY "admins_all_alert_settings" ON alert_settings FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
