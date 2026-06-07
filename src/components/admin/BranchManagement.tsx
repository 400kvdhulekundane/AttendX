import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal, ConfirmModal } from "../ui/Modal";
import { EmptyState } from "../ui/Skeleton";
import { Building2, Plus, Edit, Trash2, MapPin, Users } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Branch = Database["public"]["Tables"]["branches"]["Row"];

const DEFAULT_FORM = { name: "", address: "", latitude: "", longitude: "", radius: "100" };

export function BranchManagement() {
  const { profile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("branches").select("*").order("created_at", { ascending: false });
    setBranches(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setError("");
    setModal(true);
  }

  function openEdit(b: Branch) {
    setEditing(b);
    setForm({ name: b.name, address: b.address, latitude: String(b.latitude), longitude: String(b.longitude), radius: String(b.radius) });
    setError("");
    setModal(true);
  }

  async function useCurrentLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((f) => ({ ...f, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
    });
  }

  async function save() {
    setError("");
    if (!form.name || !form.latitude || !form.longitude) { setError("Name, latitude and longitude are required"); return; }
    setSaving(true);

    const payload = {
      name: form.name,
      address: form.address,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      radius: parseInt(form.radius),
      created_by: profile?.id,
    };

    if (editing) {
      const { error: err } = await supabase.from("branches").update(payload).eq("id", editing.id);
      if (err) setError(err.message);
      else { setModal(false); load(); }
    } else {
      const { error: err } = await supabase.from("branches").insert(payload);
      if (err) setError(err.message);
      else { setModal(false); load(); }
    }
    setSaving(false);
  }

  async function deleteBranch() {
    if (!deleteTarget) return;
    await supabase.from("branches").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Branches</h2>
        <Button icon={<Plus size={16} />} size="sm" onClick={openAdd}>Add Branch</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : branches.length === 0 ? (
        <EmptyState message="No branches created yet" icon={<Building2 size={40} />} />
      ) : (
        <div className="space-y-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 size={16} className="text-blue-500 flex-shrink-0" />
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{branch.name}</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{branch.address}</p>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />{branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                    </span>
                    <span>Radius: {branch.radius}m</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEdit(branch)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit size={14} className="text-slate-500" />
                  </button>
                  <button onClick={() => setDeleteTarget(branch)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit Branch" : "Add Branch"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving} onClick={save}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Input label="Branch Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Head Office" required />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City" />
          <Button variant="secondary" size="sm" icon={<MapPin size={14} />} onClick={useCurrentLocation} type="button">
            Use Current Location
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="18.5204" required />
            <Input label="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="73.8567" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Geofence Radius: {form.radius}m
            </label>
            <input
              type="range" min="50" max="1000" step="25"
              value={form.radius}
              onChange={(e) => setForm({ ...form, radius: e.target.value })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>50m</span><span>1000m</span>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteBranch}
        title="Delete Branch"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
