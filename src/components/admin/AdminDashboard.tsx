import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useApp } from "../../contexts/AppContext";
import { Card, StatCard } from "../ui/Card";
import { SkeletonCard } from "../ui/Skeleton";
import { Users, UserCheck, UserX, Clock, AlertCircle, TrendingUp, MapPin, Building2 } from "lucide-react";

interface Stats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
}

interface LiveEmployee {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  branch_id: string | null;
}

export function AdminDashboard() {
  const { lang } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveEmployees, setLiveEmployees] = useState<LiveEmployee[]>([]);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadStats();
    loadLiveEmployees();
  }, []);

  async function loadStats() {
    setLoading(true);
    const [
      { count: total },
      { count: approved },
      { count: pending },
      { count: rejected },
      { count: presentToday },
      { count: absentToday },
      { count: lateToday },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "employee"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("attendance_logs").select("*", { count: "exact", head: true }).eq("date", today).eq("attended", true),
      supabase.from("attendance_logs").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "absent"),
      supabase.from("attendance_logs").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "late"),
    ]);

    setStats({
      total: total ?? 0,
      approved: approved ?? 0,
      pending: pending ?? 0,
      rejected: rejected ?? 0,
      presentToday: presentToday ?? 0,
      absentToday: absentToday ?? 0,
      lateToday: lateToday ?? 0,
    });
    setLoading(false);
  }

  async function loadLiveEmployees() {
    const { data } = await supabase
      .from("live_locations")
      .select("employee_id, timestamp")
      .gte("timestamp", new Date(Date.now() - 30 * 60 * 1000).toISOString());

    if (!data?.length) return;
    const ids = data.map((l) => l.employee_id);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, profile_photo_url, branch_id").in("id", ids);
    setLiveEmployees(profiles ?? []);
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString("default", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Today's stats */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Today's Overview</p>
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Present" value={stats?.presentToday ?? 0} icon={<UserCheck size={18} />} color="text-emerald-600" />
            <StatCard label="Absent" value={stats?.absentToday ?? 0} icon={<UserX size={18} />} color="text-red-600" />
            <StatCard label="Late" value={stats?.lateToday ?? 0} icon={<Clock size={18} />} color="text-amber-600" />
          </div>
        )}
      </div>

      {/* Employee stats */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Employees</p>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total Employees"
              value={stats?.total ?? 0}
              icon={<Users size={18} />}
              color="text-blue-600"
              sub={`${stats?.approved ?? 0} active`}
            />
            <StatCard
              label="Pending Approval"
              value={stats?.pending ?? 0}
              icon={<AlertCircle size={18} />}
              color="text-amber-600"
              sub="Awaiting review"
            />
          </div>
        )}
      </div>

      {/* Live employees */}
      {liveEmployees.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Live Employees ({liveEmployees.length})</p>
          </div>
          <div className="space-y-2">
            {liveEmployees.slice(0, 5).map((emp) => (
              <div key={emp.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {emp.profile_photo_url ? (
                    <img src={emp.profile_photo_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-white text-xs font-bold">{emp.full_name[0]}</span>
                  )}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">{emp.full_name}</span>
                <span className="ml-auto">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
