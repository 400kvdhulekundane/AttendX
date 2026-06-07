import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { BarChart2, Download, FileText, Users } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];

export function Reports() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{ name: string; present: number; absent: number; late: number; halfDay: number; total: number }[]>([]);

  useEffect(() => {
    supabase.from("branches").select("*").then(({ data }) => setBranches(data ?? []));
    supabase.from("profiles").select("id, full_name, employee_id, department").eq("role", "employee").eq("status", "approved").then(({ data }) => setEmployees(data ?? []));
  }, []);

  async function generateReport() {
    setLoading(true);

    let q = supabase.from("attendance_logs").select("employee_id, status, profiles(full_name, employee_id)").gte("date", from).lte("date", to);
    if (filterBranch !== "all") q = q.eq("branch_id", filterBranch);
    if (filterEmployee !== "all") q = q.eq("employee_id", filterEmployee);

    const { data } = await q;
    if (!data) { setLoading(false); return; }

    const map = new Map<string, { name: string; present: number; absent: number; late: number; halfDay: number; total: number }>();

    for (const log of data) {
      const emp = log as typeof log & { profiles?: { full_name: string; employee_id: string | null } };
      const key = emp.employee_id;
      if (!map.has(key)) {
        map.set(key, { name: emp.profiles?.full_name ?? "Unknown", present: 0, absent: 0, late: 0, halfDay: 0, total: 0 });
      }
      const r = map.get(key)!;
      r.total++;
      if (log.status === "present") r.present++;
      else if (log.status === "absent") r.absent++;
      else if (log.status === "late") r.late++;
      else if (log.status === "half-day") r.halfDay++;
    }

    setSummary(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }

  function exportCSV() {
    if (summary.length === 0) return;
    const headers = ["Name", "Present", "Absent", "Late", "Half Day", "Total Days", "Attendance %"];
    const rows = summary.map((s) => [
      s.name,
      s.present,
      s.absent,
      s.late,
      s.halfDay,
      s.total,
      s.total > 0 ? ((s.present + s.late + s.halfDay) / s.total * 100).toFixed(1) + "%" : "0%",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totals = summary.reduce((acc, s) => ({
    present: acc.present + s.present,
    absent: acc.absent + s.absent,
    late: acc.late + s.late,
    halfDay: acc.halfDay + s.halfDay,
    total: acc.total + s.total,
  }), { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 });

  return (
    <div className="p-4 space-y-4 pb-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reports & Export</h2>

      {/* Filters */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Select label="Branch" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
          <option value="all">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
        <Select label="Employee" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
          <option value="all">All Employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </Select>
        <Button icon={<BarChart2 size={16} />} loading={loading} onClick={generateReport} className="w-full">
          Generate Report
        </Button>
      </Card>

      {summary.length > 0 && (
        <>
          {/* Summary totals */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="p-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{totals.present}</p>
              <p className="text-xs text-slate-400">Present</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xl font-bold text-red-600">{totals.absent}</p>
              <p className="text-xs text-slate-400">Absent</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xl font-bold text-amber-600">{totals.late}</p>
              <p className="text-xs text-slate-400">Late</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xl font-bold text-orange-600">{totals.halfDay}</p>
              <p className="text-xs text-slate-400">Half Day</p>
            </Card>
          </div>

          {/* Export button */}
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Download size={16} />} onClick={exportCSV} className="flex-1">
              Export CSV
            </Button>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">P</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">A</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">L</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {summary.map((s, i) => {
                    const pct = s.total > 0 ? Math.round((s.present + s.late + s.halfDay) / s.total * 100) : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.name}</td>
                        <td className="px-3 py-3 text-center text-emerald-600 font-semibold">{s.present}</td>
                        <td className="px-3 py-3 text-center text-red-600 font-semibold">{s.absent}</td>
                        <td className="px-3 py-3 text-center text-amber-600 font-semibold">{s.late}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-semibold ${pct >= 90 ? "text-emerald-600" : pct >= 75 ? "text-amber-600" : "text-red-600"}`}>{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
