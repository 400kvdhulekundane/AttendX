import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../lib/i18n";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { Camera, User, Mail, Briefcase, Building2, MapPin, Sliders, CheckCircle, Clock } from "lucide-react";

type Branch = { id: string; name: string };
type GeofenceRequest = {
  id: string;
  status: string;
  submitted_latitude: number;
  submitted_longitude: number;
  submitted_radius: number;
  admin_note: string | null;
  created_at: string;
};

export function EmployeeProfile() {
  const { profile, refreshProfile } = useAuth();
  const { lang } = useApp();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [geofenceRequests, setGeofenceRequests] = useState<GeofenceRequest[]>([]);
  const [geofenceModal, setGeofenceModal] = useState(false);
  const [geoForm, setGeoForm] = useState({ latitude: "", longitude: "", radius: "100" });
  const [geoLoading, setGeoLoading] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", department: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setEditForm({ fullName: profile.full_name, department: profile.department ?? "" });
    }
    supabase.from("branches").select("id, name").then(({ data }) => setBranches(data ?? []));
    loadGeofenceRequests();
  }, [profile]);

  async function loadGeofenceRequests() {
    if (!profile) return;
    const { data } = await supabase
      .from("geofence_requests")
      .select("*")
      .eq("employee_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setGeofenceRequests(data ?? []);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError("");

    let photoUrl = profile.profile_photo_url;
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("profile-photos").upload(path, photoFile);
      if (!uploadErr) {
        const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
        photoUrl = data.publicUrl;
      }
    }

    const { error: updateErr } = await supabase.from("profiles").update({
      full_name: editForm.fullName,
      department: editForm.department,
      profile_photo_url: photoUrl,
    }).eq("id", profile.id);

    setLoading(false);
    if (updateErr) setError(updateErr.message);
    else {
      setSuccess("Profile updated");
      setEditing(false);
      setPhotoFile(null);
      refreshProfile();
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) { setError("Passwords do not match"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    setPwLoading(false);
    if (error) setError(error.message);
    else {
      setPasswordModal(false);
      setPasswords({ current: "", next: "", confirm: "" });
      setSuccess("Password updated");
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  async function submitGeofence(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setGeoLoading(true);
    const { error } = await supabase.from("geofence_requests").insert({
      employee_id: profile.id,
      branch_id: profile.branch_id,
      submitted_latitude: parseFloat(geoForm.latitude),
      submitted_longitude: parseFloat(geoForm.longitude),
      submitted_radius: parseInt(geoForm.radius),
    });

    if (!error) {
      supabase.functions.invoke("send-alert", {
        body: {
          type: "geofence_request",
          message: `${profile.full_name} submitted a new geofence request for review.`,
        },
      });
      setGeofenceModal(false);
      setGeoForm({ latitude: "", longitude: "", radius: "100" });
      loadGeofenceRequests();
    }
    setGeoLoading(false);
  }

  async function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setGeoForm({
        ...geoForm,
        latitude: pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
      });
    });
  }

  if (!profile) return null;

  const branchName = branches.find((b) => b.id === profile.branch_id)?.name ?? "N/A";

  return (
    <div className="p-4 space-y-4 pb-24">
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Profile header */}
      <Card className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
              {(photoFile ? URL.createObjectURL(photoFile) : profile.profile_photo_url) ? (
                <img
                  src={photoFile ? URL.createObjectURL(photoFile) : profile.profile_photo_url!}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                <User size={28} className="text-white" />
              )}
            </div>
            {editing && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-sm"
                >
                  <Camera size={12} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">{profile.full_name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
            <div className="flex gap-2 mt-1">
              <Badge color="blue">{profile.employee_id ?? "N/A"}</Badge>
              <Badge color={profile.status === "approved" ? "green" : profile.status === "pending" ? "yellow" : "red"}>
                {profile.status}
              </Badge>
            </div>
          </div>
        </div>

        {editing ? (
          <form onSubmit={saveProfile} className="space-y-3">
            <Input
              label={t(lang, "fullName")}
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              required
            />
            <Input
              label={t(lang, "department")}
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" loading={loading} className="flex-1">{t(lang, "save")}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} className="flex-1">{t(lang, "cancel")}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <InfoRow icon={<Briefcase size={14} />} label="Department" value={profile.department ?? "N/A"} />
            <InfoRow icon={<Building2 size={14} />} label="Branch" value={branchName} />
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="flex-1">{t(lang, "edit")}</Button>
              <Button variant="outline" size="sm" onClick={() => setPasswordModal(true)} className="flex-1">{t(lang, "changePassword")}</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Geofence requests */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium text-slate-900 dark:text-white text-sm">{t(lang, "geofenceRequest")}</p>
          <Button variant="outline" size="sm" icon={<MapPin size={14} />} onClick={() => setGeofenceModal(true)}>
            Submit
          </Button>
        </div>
        {geofenceRequests.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-3">No requests submitted</p>
        ) : (
          <div className="space-y-2">
            {geofenceRequests.map((req) => (
              <div key={req.id} className="flex items-start justify-between py-2 border-b border-slate-50 dark:border-slate-700 last:border-0">
                <div>
                  <p className="text-xs text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()} — Radius: {req.submitted_radius}m
                  </p>
                  {req.admin_note && <p className="text-xs text-slate-400 mt-0.5">{req.admin_note}</p>}
                </div>
                <Badge color={req.status === "approved" ? "green" : req.status === "pending" ? "yellow" : "red"}>
                  {req.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Geofence modal */}
      <Modal
        open={geofenceModal}
        onClose={() => setGeofenceModal(false)}
        title={t(lang, "submitGeofence")}
        footer={
          <>
            <Button variant="outline" onClick={() => setGeofenceModal(false)}>Cancel</Button>
            <Button onClick={() => document.getElementById("geoForm")?.dispatchEvent(new Event("submit", { bubbles: true }))} loading={geoLoading}>Submit</Button>
          </>
        }
      >
        <form id="geoForm" onSubmit={submitGeofence} className="space-y-4">
          <Button type="button" variant="secondary" icon={<MapPin size={14} />} size="sm" onClick={useCurrentLocation}>
            Use Current Location
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" value={geoForm.latitude} onChange={(e) => setGeoForm({ ...geoForm, latitude: e.target.value })} placeholder="18.5204" required />
            <Input label="Longitude" value={geoForm.longitude} onChange={(e) => setGeoForm({ ...geoForm, longitude: e.target.value })} placeholder="73.8567" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Radius: {geoForm.radius}m
            </label>
            <input
              type="range" min="50" max="500" step="10"
              value={geoForm.radius}
              onChange={(e) => setGeoForm({ ...geoForm, radius: e.target.value })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>50m</span><span>500m</span>
            </div>
          </div>
        </form>
      </Modal>

      {/* Password modal */}
      <Modal
        open={passwordModal}
        onClose={() => setPasswordModal(false)}
        title={t(lang, "changePassword")}
        footer={
          <>
            <Button variant="outline" onClick={() => setPasswordModal(false)}>Cancel</Button>
            <Button onClick={() => document.getElementById("pwForm")?.dispatchEvent(new Event("submit", { bubbles: true }))} loading={pwLoading}>Update</Button>
          </>
        }
      >
        <form id="pwForm" onSubmit={changePassword} className="space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Input label="New Password" type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required />
          <Input label="Confirm Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
        </form>
      </Modal>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="text-slate-400 flex-shrink-0">{icon}</span>
      <span className="text-slate-500 dark:text-slate-400 w-24 flex-shrink-0">{label}</span>
      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{value}</span>
    </div>
  );
}
