import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { StatusBadge, Badge } from "../ui/Badge";
import { EmptyState } from "../ui/Skeleton";
import { CalendarDays, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import type { Database } from "../../lib/database.types";

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"] & {
  profiles?: { full_name: string; employee_id: string | null };
};
type Branch = Database["public"]["Tables"]["branches"]["Row"];

export function AttendanceManagement() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [editTarget, setEditTarget] = useState<AttendanceLog | null>(null);
  const [editForm, setEditForm] = useState({ status: "present", check_in: "", check_out: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("attendance_logs")
      .select("*, profiles(full_name, employee_id)")
      .eq("date", filterDate)
      .order("created_at", { ascending: false });

    if (filterBranch !== "all") q = q.eq("branch_id", filterBranch);
    if (filterStatus !== "all") q = q.eq("status", filterStatus);

    const { data } = await q;
    setLogs((data as AttendanceLog[]) ?? []);
    setLoading(false);
  }, [filterDate, filterBranch, filterStatus]);

  useEffect(() => {
    load();
    supabase.from("branches").select("*").then(({ data }) => setBranches(data ?? []));
  }, [load]);

  function shiftDate(days: number) {
    const d = new Date(filterDate);
    d.setDate(d.getDate() + days);
    setFilterDate(d.toISOString().split("T")[0]);
  }

  function openEdit(log: AttendanceLog) {
    setEditTarget(log);
    setEditForm({
      status: log.status,
      check_in: log.check_in ? new Date(log.check_in).toTimeString().slice(0, 5) : "",
      check_out: log.check_out ? new Date(log.check_out).toTimeString().slice(0, 5) : "",
    });
  }

  async function saveEdit() {
    if (!editTarget) return;
    setSaving(true);

    const dateStr = editTarget.date;
    const checkIn = editForm.check_in ? new Date(`${dateStr}T${editForm.check_in}`).toISOString() : null;
    const checkOut = editForm.check_out ? new Date(`${dateStr}T${editForm.check_out}`).toISOString() : null;
    const duration = checkIn && checkOut
      ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000)
      : null;

    await supabase.from("attendance_logs").update({
      status: editForm.status as AttendanceLog["status"],
      check_in: checkIn,
      check_out: checkOut,
      duration,
      attended: editForm.status !== "absent",
      check_in_type: "manual",
      check_out_type: checkOut ? "manual" : null,
    }).eq("id", editTarget.id);

    setSaving(false);
    setEditTarget(null);
    load();
  }

  function formatTime(ts: string | null | undefined) {
    if (!ts) return "--";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Attendance</h2>

      {/* Date nav */}
      <div className="flex items-center gap-2">
        <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
          <ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" />
        </button>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={() => shiftDate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
          <ChevronRight size={18} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <Select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
          <option value="all">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="half-day">Half Day</option>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {["present", "absent", "late", "half-day"].map((s) => {
          const count = logs.filter((l) => l.status === s).length;
          const colors: Record<string, string> = { present: "text-emerald-600", absent: "text-red-600", late: "text-amber-600", "half-day": "text-orange-600" };
          return (
            <Card key={s} className="p-2.5 text-center">
              <p className={`text-xl font-bold ${colors[s]}`}>{count}</p>
              <p className="text-xs text-slate-400 capitalize">{s}</p>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState message="No attendance records for this date" icon={<CalendarDays size={40} />} />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{log.profiles?.full_name ?? "Unknown"}</p>
                  <div className="flex gap-3 mt-1 text-xs text-slate-500">
                    <span>In: {formatTime(log.check_in)}</span>
                    <span>Out: {formatTime(log.check_out)}</span>
                    {log.duration && <span>{Math.floor(log.duration / 60)}h {log.duration % 60}m</span>}
                  </div>
                  {log.check_in_type && (
                    <Badge color="slate">{log.check_in_type}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={log.status} />
                  <button onClick={() => openEdit(log)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                    <Edit size={14} className="text-slate-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          title="Edit Attendance"
          footer={
            <>
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button loading={saving} onClick={saveEdit}>Save</Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {editTarget.profiles?.full_name} — {editTarget.date}
            </p>
            <Select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half-day">Half Day</option>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Check-in Time" type="time" value={editForm.check_in} onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })} />
              <Input label="Check-out Time" type="time" value={editForm.check_out} onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
