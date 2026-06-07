import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Bell, Mail, Phone, Plus, Trash2, Save, Clock } from "lucide-react";

interface AlertSettings {
  id: string;
  admin_emails: string[];
  admin_whatsapp_numbers: string[];
  send_absent_instant: boolean;
  send_late_instant: boolean;
  send_daily_summary: boolean;
  daily_summary_time: string;
  notify_new_registration: boolean;
  notify_geofence_request: boolean;
}

export function AlertsSettings() {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("alert_settings").select("*").limit(1).maybeSingle();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    await supabase.from("alert_settings").update({
      admin_emails: settings.admin_emails,
      admin_whatsapp_numbers: settings.admin_whatsapp_numbers,
      send_absent_instant: settings.send_absent_instant,
      send_late_instant: settings.send_late_instant,
      send_daily_summary: settings.send_daily_summary,
      daily_summary_time: settings.daily_summary_time,
      notify_new_registration: settings.notify_new_registration,
      notify_geofence_request: settings.notify_geofence_request,
      updated_at: new Date().toISOString(),
    }).eq("id", settings.id);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  function addEmail() {
    if (!newEmail || !settings) return;
    setSettings({ ...settings, admin_emails: [...settings.admin_emails, newEmail] });
    setNewEmail("");
  }

  function removeEmail(email: string) {
    if (!settings) return;
    setSettings({ ...settings, admin_emails: settings.admin_emails.filter((e) => e !== email) });
  }

  function addPhone() {
    if (!newPhone || !settings) return;
    setSettings({ ...settings, admin_whatsapp_numbers: [...settings.admin_whatsapp_numbers, newPhone] });
    setNewPhone("");
  }

  function removePhone(phone: string) {
    if (!settings) return;
    setSettings({ ...settings, admin_whatsapp_numbers: settings.admin_whatsapp_numbers.filter((p) => p !== phone) });
  }

  if (loading) return <div className="p-4"><div className="animate-pulse space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}</div></div>;
  if (!settings) return null;

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Alert Settings</h2>
        {success && <span className="text-xs text-emerald-600 font-medium">Saved!</span>}
      </div>

      {/* Admin emails */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Mail size={16} className="text-blue-500" />
          <p className="font-medium text-slate-900 dark:text-white text-sm">Alert Emails</p>
        </div>
        <div className="space-y-2">
          {settings.admin_emails.map((email) => (
            <div key={email} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{email}</span>
              <button onClick={() => removeEmail(email)} className="text-red-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="admin@company.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            type="email"
            className="flex-1"
          />
          <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={addEmail}>Add</Button>
        </div>
      </Card>

      {/* WhatsApp numbers */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Phone size={16} className="text-emerald-500" />
          <p className="font-medium text-slate-900 dark:text-white text-sm">WhatsApp Numbers</p>
        </div>
        <div className="space-y-2">
          {settings.admin_whatsapp_numbers.map((num) => (
            <div key={num} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{num}</span>
              <button onClick={() => removePhone(num)} className="text-red-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="+91XXXXXXXXXX"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" size="sm" icon={<Plus size={14} />} onClick={addPhone}>Add</Button>
        </div>
      </Card>

      {/* Toggle settings */}
      <Card className="p-4 space-y-3">
        <p className="font-medium text-slate-900 dark:text-white text-sm flex items-center gap-2"><Bell size={16} className="text-amber-500" />Notification Triggers</p>
        {[
          { key: "send_absent_instant", label: "Instant absent alerts" },
          { key: "send_late_instant", label: "Instant late alerts" },
          { key: "send_daily_summary", label: "Daily summary report" },
          { key: "notify_new_registration", label: "New employee registration" },
          { key: "notify_geofence_request", label: "New geofence request" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
            <button
              onClick={() => setSettings({ ...settings, [key]: !(settings as Record<string, unknown>)[key] as boolean })}
              className={`relative w-11 h-6 rounded-full transition-colors ${(settings as Record<string, unknown>)[key] ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${(settings as Record<string, unknown>)[key] ? "translate-x-5" : ""}`} />
            </button>
          </div>
        ))}
      </Card>

      {/* Daily summary time */}
      {settings.send_daily_summary && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">Daily Summary Time</span>
            </div>
            <input
              type="time"
              value={settings.daily_summary_time?.slice(0, 5) ?? "10:00"}
              onChange={(e) => setSettings({ ...settings, daily_summary_time: e.target.value })}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </Card>
      )}

      <Button icon={<Save size={16} />} loading={saving} onClick={save} className="w-full" size="lg">
        Save Settings
      </Button>
    </div>
  );
}
