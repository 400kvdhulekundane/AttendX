export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          employee_id: string | null;
          department: string | null;
          branch_id: string | null;
          role: "admin" | "employee";
          status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          profile_photo_url: string | null;
          id_card_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at"> & { created_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      branches: {
        Row: {
          id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          radius: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["branches"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
      };
      attendance_logs: {
        Row: {
          id: string;
          employee_id: string;
          branch_id: string | null;
          date: string;
          check_in: string | null;
          check_out: string | null;
          duration: number | null;
          status: "present" | "absent" | "late" | "half-day";
          check_in_type: "auto" | "manual" | null;
          check_out_type: "auto" | "manual" | null;
          check_in_accuracy: number | null;
          attended: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["attendance_logs"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["attendance_logs"]["Insert"]>;
      };
      geofence_requests: {
        Row: {
          id: string;
          employee_id: string;
          branch_id: string | null;
          submitted_latitude: number;
          submitted_longitude: number;
          submitted_radius: number;
          status: "pending" | "approved" | "rejected";
          admin_note: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["geofence_requests"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["geofence_requests"]["Insert"]>;
      };
      work_schedules: {
        Row: {
          id: string;
          branch_id: string | null;
          employee_id: string | null;
          check_in_time: string;
          check_out_time: string;
          late_threshold_minutes: number;
          expected_hours_per_day: number;
          mark_absent_after_minutes: number;
          working_days: number[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["work_schedules"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["work_schedules"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      live_locations: {
        Row: {
          id: string;
          employee_id: string;
          latitude: number;
          longitude: number;
          accuracy: number | null;
          timestamp: string;
        };
        Insert: Omit<Database["public"]["Tables"]["live_locations"]["Row"], "id" | "timestamp"> & { id?: string; timestamp?: string };
        Update: Partial<Database["public"]["Tables"]["live_locations"]["Insert"]>;
      };
      admin_alerts: {
        Row: {
          id: string;
          type: string;
          recipient_ids: string[] | null;
          message: string;
          sent_via: string[] | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["admin_alerts"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["admin_alerts"]["Insert"]>;
      };
      alert_settings: {
        Row: {
          id: string;
          admin_emails: string[];
          admin_whatsapp_numbers: string[];
          send_absent_instant: boolean;
          send_late_instant: boolean;
          send_daily_summary: boolean;
          daily_summary_time: string;
          notify_new_registration: boolean;
          notify_geofence_request: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alert_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["alert_settings"]["Row"]>;
      };
    };
  };
}
