import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/Skeleton";
import { Clock, Plus, Edit, Save } from "lucide-react";
import type { Database } from "../../lib/database.types";

type WorkSchedule = Database["public"]["Tables"]["work_schedules"]["Row"] & {
  branches?: { name: string };
  profiles?: { full_name: string } | null;
};
type Branch = Database["public"]["Tables"]["branches"]["Row"];
type Profile = { id: string; full_name: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_FORM = {
  branchId: "", employeeId: "",
  checkInTime: "09:00", checkOutTime: "18:00",
  lateThreshold: "15", expectedHours: "8",
  markAbsentAfter: "120", workingDays: [1, 2, 3, 4, 5],
};

export function WorkSchedules() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<WorkSchedule | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("work_schedules")
      .select("*, branches(name), profiles(full_name)")
      .order("created_at", { ascending: false });
    setSchedules((data as WorkSchedule[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    supabase.from("branches").select("*").then(({ data }) => setBranches(data ?? []));
    supabase.from("profiles").select("id, full_name").eq("status", "approved").eq("role", "employee").then(({ data }) => setEmployees(data ?? []));
  }, [load]);

  function openAdd() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setError("");
    setModal(true);
  }

  function openEdit(s: WorkSchedule) {
    setEditing(s);
    setForm({
      branchId: s.branch_id ?? "",
      employeeId: s.employee_id ?? "",
      checkInTime: s.check_in_time.slice(0, 5),
      checkOutTime: s.check_out_time.slice(0, 5),
      lateThreshold: String(s.late_threshold_minutes),
      expectedHours: String(s.expected_hours_per_day),
      markAbsentAfter: String(s.mark_absent_after_minutes),
      workingDays: s.working_days ?? [1, 2, 3, 4, 5],
    });
    setError("");
    setModal(true);
  }

  function toggleDay(day: number) {
    const days = form.workingDays.includes(day)
      ? form.workingDays.filter((d) => d !== day)
      : [...form.workingDays, day].sort();
    setForm({ ...form, workingDays: days });
  }

  async function save() {
    setError("");
    if (!form.branchId) { setError("Branch is required"); return; }
    setSaving(true);

    const payload = {
      branch_id: form.branchId,
      employee_id: form.employeeId || null,
      check_in_time: form.checkInTime + ":00",
      check_out_time: form.checkOutTime + ":00",
      late_threshold_minutes: parseInt(form.lateThreshold),
      expected_hours_per_day: parseFloat(form.expectedHours),
      mark_absent_after_minutes: parseInt(form.markAbsentAfter),
      working_days: form.workingDays,
    };

    if (editing) {
      const { error: err } = await supabase.from("work_schedules").update(payload).eq("id", editing.id);
      if (err) setError(err.message);
      else { setModal(false); load(); }
    } else {
      const { error: err } = await supabase.from("work_schedules").insert(payload);
      if (err) setError(err.message);
      else { setModal(false); load(); }
    }
    setSaving(false);
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Work Schedules</h2>
        <Button icon={<Plus size={16} />} size="sm" onClick={openAdd}>Add Schedule</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState message="No schedules created" icon={<Clock size={40} />} />
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">
                    {s.branches?.name ?? "Unknown Branch"}
                    {s.profiles && <span className="text-blue-600 ml-1.5 text-xs">(Override: {s.profiles.full_name})</span>}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    <span>In: <strong className="text-slate-700 dark:text-slate-300">{s.check_in_time.slice(0, 5)}</strong></span>
                    <span>Out: <strong className="text-slate-700 dark:text-slate-300">{s.check_out_time.slice(0, 5)}</strong></span>
                    <span>Late after: <strong className="text-amber-600">{s.late_threshold_minutes}m</strong></span>
                    <span>Expected: <strong className="text-slate-700 dark:text-slate-300">{s.expected_hours_per_day}h</strong></span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {DAYS.map((d, i) => (
                      <span key={i} className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${s.working_days?.includes(i) ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-slate-300 dark:text-slate-600"}`}>
                        {d[0]}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <Edit size={14} className="text-slate-500" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit Schedule" : "Add Schedule"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button loading={saving} icon={<Save size={14} />} onClick={save}>{editing ? "Save" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Select label="Branch *" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
            <option value="">Select Branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select label="Employee Override (leave blank for whole branch)" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
            <option value="">All Employees in Branch</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Check-in Time" type="time" value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} />
            <Input label="Check-out Time" type="time" value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} />
            <Input label="Late After (min)" type="number" value={form.lateThreshold} onChange={(e) => setForm({ ...form, lateThreshold: e.target.value })} />
            <Input label="Expected Hours" type="number" step="0.5" value={form.expectedHours} onChange={(e) => setForm({ ...form, expectedHours: e.target.value })} />
          </div>
          <Input label="Mark Absent After (min)" type="number" value={form.markAbsentAfter} onChange={(e) => setForm({ ...form, markAbsentAfter: e.target.value })} />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Working Days</p>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.workingDays.includes(i) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
