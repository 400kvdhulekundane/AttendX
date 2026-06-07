import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Modal, ConfirmModal } from "../ui/Modal";
import { Badge, StatusBadge } from "../ui/Badge";
import { SkeletonRow, EmptyState } from "../ui/Skeleton";
import { Search, User, CheckCircle, XCircle, ChevronRight, RotateCcw, UserCheck, UserX } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Profile | null>(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "employee")
      .order("created_at", { ascending: false });
    setEmployees(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = employees;
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.employee_id ?? "").toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q),
      );
    }
    setFiltered(list);
  }, [employees, search, statusFilter]);

  async function approveEmployee(id: string) {
    setActionLoading(true);
    await supabase.from("profiles").update({ status: "approved" }).eq("id", id);

    // Notify employee
    await supabase.from("notifications").insert({
      user_id: id,
      title: "Account Approved",
      body: "Your account has been approved. You can now log in to AttendX.",
      type: "approval",
    });

    await load();
    setSelected(null);
    setActionLoading(false);
  }

  async function rejectEmployee(id: string) {
    setActionLoading(true);
    await supabase.from("profiles").update({ status: "rejected", rejection_reason: rejectReason }).eq("id", id);

    await supabase.from("notifications").insert({
      user_id: id,
      title: "Account Rejected",
      body: `Your registration was not approved. ${rejectReason ? "Reason: " + rejectReason : ""}`,
      type: "rejection",
    });

    await load();
    setSelected(null);
    setRejectModal(false);
    setRejectReason("");
    setActionLoading(false);
  }

  async function toggleActive(emp: Profile) {
    setActionLoading(true);
    const newStatus = emp.status === "approved" ? "rejected" : "approved";
    await supabase.from("profiles").update({ status: newStatus }).eq("id", emp.id);
    await load();
    setSelected(null);
    setActionLoading(false);
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employees</h2>
        <Button variant="outline" size="sm" icon={<RotateCcw size={14} />} onClick={load}>Refresh</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Search name, ID, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={14} />}
          className="flex-1"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Quick approve all pending */}
      {employees.filter((e) => e.status === "pending").length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            {employees.filter((e) => e.status === "pending").length} pending registrations
          </p>
        </div>
      )}

      {/* Employee list */}
      {loading ? (
        <Card className="px-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState message="No employees found" icon={<User size={40} />} />
      ) : (
        <div className="space-y-2">
          {filtered.map((emp) => (
            <Card key={emp.id} className="p-4" onClick={() => setSelected(emp)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {emp.profile_photo_url ? (
                    <img src={emp.profile_photo_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-white text-sm font-bold">{emp.full_name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{emp.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{emp.employee_id} · {emp.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={emp.status} />
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Employee detail modal */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title="Employee Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {selected.profile_photo_url ? (
                  <img src={selected.profile_photo_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User size={28} className="text-white" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{selected.full_name}</h3>
                <p className="text-sm text-slate-500">{selected.email}</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoItem label="Employee ID" value={selected.employee_id ?? "N/A"} />
              <InfoItem label="Department" value={selected.department ?? "N/A"} />
              <InfoItem label="Joined" value={new Date(selected.created_at).toLocaleDateString()} />
              <InfoItem label="Status" value={selected.status} />
              {selected.rejection_reason && (
                <InfoItem label="Rejection Reason" value={selected.rejection_reason} />
              )}
            </div>

            {selected.id_card_url && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">ID Card</p>
                <img src={selected.id_card_url} alt="ID Card" className="rounded-xl border border-slate-200 dark:border-slate-600 max-h-40 object-contain w-full" />
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {selected.status === "pending" && (
                <>
                  <Button
                    variant="primary"
                    icon={<CheckCircle size={16} />}
                    loading={actionLoading}
                    onClick={() => approveEmployee(selected.id)}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    icon={<XCircle size={16} />}
                    onClick={() => setRejectModal(true)}
                    className="flex-1"
                  >
                    Reject
                  </Button>
                </>
              )}
              {selected.status === "approved" && (
                <Button
                  variant="secondary"
                  icon={<UserX size={16} />}
                  loading={actionLoading}
                  onClick={() => toggleActive(selected)}
                  className="flex-1"
                >
                  Deactivate
                </Button>
              )}
              {selected.status === "rejected" && (
                <Button
                  variant="primary"
                  icon={<UserCheck size={16} />}
                  loading={actionLoading}
                  onClick={() => toggleActive(selected)}
                  className="flex-1"
                >
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      <Modal
        open={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Reject Employee"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectModal(false)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={() => selected && rejectEmployee(selected.id)}>Reject</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">Provide a reason for rejection (optional):</p>
          <Input
            placeholder="Rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}
