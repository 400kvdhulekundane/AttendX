import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../lib/i18n";
import { Card } from "../ui/Card";
import { StatusBadge, Badge } from "../ui/Badge";
import { SkeletonRow, EmptyState } from "../ui/Skeleton";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Database } from "../../lib/database.types";

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"];

const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-400",
  late: "bg-amber-400",
  absent: "bg-red-400",
  "half-day": "bg-orange-400",
};

export function AttendanceHistory() {
  const { profile } = useAuth();
  const { lang } = useApp();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadLogs = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const from = new Date(year, month, 1).toISOString().split("T")[0];
    const to = new Date(year, month + 1, 0).toISOString().split("T")[0];

    const { data } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("employee_id", profile.id)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false });

    setLogs(data ?? []);
    setLoading(false);
  }, [profile, year, month]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const logByDate = Object.fromEntries(logs.map((l) => [l.date, l]));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  }

  function formatTime(ts: string | null | undefined) {
    if (!ts) return "--";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDuration(m: number | null | undefined) {
    if (!m) return "--";
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t(lang, "attendance")}</h2>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === "list" ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
          <ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" />
        </button>
        <p className="font-semibold text-slate-900 dark:text-white">{monthName}</p>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
          <ChevronRight size={18} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Present", color: "bg-emerald-400" },
          { label: "Late", color: "bg-amber-400" },
          { label: "Absent", color: "bg-red-400" },
          { label: "Half Day", color: "bg-orange-400" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>

      {viewMode === "calendar" && (
        <Card className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const log = logByDate[dateStr];
              const isToday = dateStr === new Date().toISOString().split("T")[0];
              const isFuture = new Date(dateStr) > new Date();
              const dotColor = log ? STATUS_COLORS[log.status] : "";

              return (
                <div
                  key={day}
                  className={`relative flex flex-col items-center justify-center aspect-square rounded-xl text-sm ${isToday ? "bg-blue-600 text-white font-bold" : isFuture ? "text-slate-300 dark:text-slate-600" : log ? "text-slate-900 dark:text-white" : "text-slate-400"}`}
                >
                  {day}
                  {log && !isToday && (
                    <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {viewMode === "list" && (
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <Card key={i} className="px-4"><SkeletonRow /></Card>)
          ) : logs.length === 0 ? (
            <EmptyState message="No attendance records this month" icon={<CalendarDays size={40} />} />
          ) : (
            logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">
                      {new Date(log.date).toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                      <span>In: <span className="font-medium text-slate-700 dark:text-slate-300">{formatTime(log.check_in)}</span></span>
                      <span>Out: <span className="font-medium text-slate-700 dark:text-slate-300">{formatTime(log.check_out)}</span></span>
                      <span>Dur: <span className="font-medium text-slate-700 dark:text-slate-300">{formatDuration(log.duration)}</span></span>
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      {log.check_in_type && <Badge color="slate">{log.check_in_type === "auto" ? t(lang, "autoLabel") : t(lang, "manualLabel")}</Badge>}
                    </div>
                  </div>
                  <StatusBadge status={log.status} />
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
