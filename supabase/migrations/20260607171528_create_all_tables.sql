
-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  latitude float NOT NULL,
  longitude float NOT NULL,
  radius integer NOT NULL DEFAULT 100,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Profiles table (depends on auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  employee_id text UNIQUE,
  department text,
  branch_id uuid REFERENCES branches(id),
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  profile_photo_url text,
  id_card_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Work schedules
CREATE TABLE IF NOT EXISTS work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id),
  employee_id uuid REFERENCES profiles(id),
  check_in_time time NOT NULL DEFAULT '09:00:00',
  check_out_time time NOT NULL DEFAULT '18:00:00',
  late_threshold_minutes integer NOT NULL DEFAULT 15,
  expected_hours_per_day float NOT NULL DEFAULT 8,
  mark_absent_after_minutes integer NOT NULL DEFAULT 120,
  working_days integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

-- Attendance logs
CREATE TABLE IF NOT EXISTS attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id),
  branch_id uuid REFERENCES branches(id),
  date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  duration integer,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
  check_in_type text CHECK (check_in_type IN ('auto', 'manual')),
  check_out_type text CHECK (check_out_type IN ('auto', 'manual')),
  check_in_accuracy float,
  attended boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Geofence requests
CREATE TABLE IF NOT EXISTS geofence_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id),
  branch_id uuid REFERENCES branches(id),
  submitted_latitude float NOT NULL,
  submitted_longitude float NOT NULL,
  submitted_radius integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE geofence_requests ENABLE ROW LEVEL SECURITY;

-- Admin alerts
CREATE TABLE IF NOT EXISTS admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('new_registration', 'geofence_request', 'absent', 'late', 'daily_summary')),
  recipient_ids uuid[],
  message text NOT NULL,
  sent_via text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- Live locations
CREATE TABLE IF NOT EXISTS live_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id),
  latitude float NOT NULL,
  longitude float NOT NULL,
  accuracy float,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;

-- Notifications table (in-app)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Alert settings
CREATE TABLE IF NOT EXISTS alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_emails text[] NOT NULL DEFAULT '{}',
  admin_whatsapp_numbers text[] NOT NULL DEFAULT '{}',
  send_absent_instant boolean NOT NULL DEFAULT true,
  send_late_instant boolean NOT NULL DEFAULT true,
  send_daily_summary boolean NOT NULL DEFAULT true,
  daily_summary_time time NOT NULL DEFAULT '10:00:00',
  notify_new_registration boolean NOT NULL DEFAULT true,
  notify_geofence_request boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

-- Insert default alert settings row
INSERT INTO alert_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
