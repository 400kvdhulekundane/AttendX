import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../lib/i18n";
import { Card, StatCard } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ConfirmModal } from "../ui/Modal";
import { SkeletonCard } from "../ui/Skeleton";
import { getCurrentPosition, watchPosition, isInsideGeofence } from "../../lib/geolocation";
import { addToQueue, syncQueue } from "../../lib/offlineQueue";
import { MapPin, Clock, CheckCircle, LogOut, Wifi, WifiOff, CalendarDays, TrendingUp, Navigation } from "lucide-react";
import type { Database } from "../../lib/database.types";

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"];
type Branch = Database["public"]["Tables"]["branches"]["Row"];
type WorkSchedule = Database["public"]["Tables"]["work_schedules"]["Row"];

export function EmployeeDashboard() {
  const { profile } = useAuth();
  const { lang, isOnline } = useApp();
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [schedule, setSchedule] = useState<WorkSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [insideGeofence, setInsideGeofence] = useState(false);
  const [weekHours, setWeekHours] = useState(0);
  const [monthPercent, setMonthPercent] = useState(0);
  const [checkInModal, setCheckInModal] = useState(false);
  const [checkOutModal, setCheckOutModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const watchCleanup = useRef<(() => void) | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const [{ data: log }, { data: br }, { data: sched }] = await Promise.all([
      supabase.from("attendance_logs").select("*").eq("employee_id", profile.id).eq("date", today).maybeSingle(),
      profile.branch_id ? supabase.from("branches").select("*").eq("id", profile.branch_id).maybeSingle() : Promise.resolve({ data: null }),
      profile.branch_id
        ? supabase.from("work_schedules").select("*").or(`branch_id.eq.${profile.branch_id},employee_id.eq.${profile.id}`).order("employee_id", { ascending: false }).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    setTodayLog(log);
    setBranch(br);
    setSchedule(sched);

    // Week hours
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { data: weekLogs } = await supabase
      .from("attendance_logs")
      .select("duration")
      .eq("employee_id", profile.id)
      .gte("date", weekStart.toISOString().split("T")[0]);
    setWeekHours(Math.round((weekLogs?.reduce((s, l) => s + (l.duration ?? 0), 0) ?? 0) / 60 * 10) / 10);

    // Month attendance
    const monthStart = new Date();
    monthStart.setDate(1);
    const { data: monthLogs } = await supabase
      .from("attendance_logs")
      .select("attended")
      .eq("employee_id", profile.id)
      .gte("date", monthStart.toISOString().split("T")[0]);
    const attended = monthLogs?.filter((l) => l.attended).length ?? 0;
    const total = monthLogs?.length ?? 0;
    setMonthPercent(total > 0 ? Math.round((attended / total) * 100) : 0);

    setLoading(false);
  }, [profile, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // GPS watch
  useEffect(() => {
    if (!branch) return;

    watchCleanup.current = watchPosition(
      (coords) => {
        setGpsAccuracy(Math.round(coords.accuracy));
        const inside = isInsideGeofence(coords.latitude, coords.longitude, branch.latitude, branch.longitude, branch.radius);
        setInsideGeofence(inside);

        // Update live location
        if (profile) {
          supabase.from("live_locations").upsert({
            employee_id: profile.id,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
          }, { onConflict: "employee_id" });
        }
      },
      () => setGpsAccuracy(null),
    );

    return () => watchCleanup.current?.();
  }, [branch, profile]);

  // Sync queue when online
  useEffect(() => {
    if (isOnline) syncQueue().then((n) => { if (n > 0) loadData(); });
  }, [isOnline, loadData]);

  async function doCheckIn(manual = true) {
    if (!profile) return;
    setActionLoading(true);

    try {
      const coords = await getCurrentPosition().catch(() => null);
      const now = new Date().toISOString();
      const checkInType = manual ? "manual" : "auto";

      const isLate = schedule
        ? (() => {
            const [h, m] = schedule.check_in_time.split(":").map(Number);
            const scheduled = new Date();
            scheduled.setHours(h, m + schedule.late_threshold_minutes, 0, 0);
            return new Date(now) > scheduled;
          })()
        : false;

      if (isOnline) {
        const { error } = await supabase.from("attendance_logs").upsert({
          employee_id: profile.id,
          branch_id: profile.branch_id,
          date: today,
          check_in: now,
          status: isLate ? "late" : "present",
          check_in_type: checkInType,
          check_in_accuracy: coords?.accuracy ?? null,
          attended: true,
        }, { onConflict: "employee_id,date" });
        if (!error) await loadData();
      } else {
        addToQueue({
          id: crypto.randomUUID(),
          type: "check_in",
          employeeId: profile.id,
          branchId: profile.branch_id,
          timestamp: now,
          accuracy: coords?.accuracy ?? null,
          eventType: checkInType,
        });
      }
    } finally {
      setActionLoading(false);
      setCheckInModal(false);
    }
  }

  async function doCheckOut(manual = true) {
    if (!profile || !todayLog?.check_in) return;
    setActionLoading(true);

    try {
      const now = new Date().toISOString();
      const duration = Math.round((new Date(now).getTime() - new Date(todayLog.check_in).getTime()) / 60000);

      if (isOnline) {
        await supabase.from("attendance_logs").update({
          check_out: now,
          check_out_type: manual ? "manual" : "auto",
          duration,
          status: duration < (schedule ? schedule.expected_hours_per_day * 60 / 2 : 240) ? "half-day" : todayLog.status,
        }).eq("id", todayLog.id);
        await loadData();
      } else {
        addToQueue({
          id: crypto.randomUUID(),
          type: "check_out",
          employeeId: profile.id,
          branchId: profile.branch_id,
          timestamp: now,
          accuracy: null,
          eventType: manual ? "manual" : "auto",
        });
      }
    } finally {
      setActionLoading(false);
      setCheckOutModal(false);
    }
  }

  const isCheckedIn = !!todayLog?.check_in && !todayLog?.check_out;
  const isCheckedOut = !!todayLog?.check_out;

  function formatTime(ts: string | null | undefined) {
    if (!ts) return "--:--";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDuration(mins: number | null | undefined) {
    if (!mins) return "0h 0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <WifiOff size={14} className="text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">{t(lang, "offline")}</span>
        </div>
      )}

      {/* Check-in status card */}
      {loading ? (
        <SkeletonCard />
      ) : (
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Today's Status</p>
              <div className="mt-1">
                {isCheckedIn ? (
                  <Badge color="green" dot pulse>Checked In</Badge>
                ) : isCheckedOut ? (
                  <Badge color="blue" dot>Checked Out</Badge>
                ) : (
                  <Badge color="slate" dot>Not Checked In</Badge>
                )}
              </div>
            </div>
            {gpsAccuracy !== null && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${gpsAccuracy < 20 ? "bg-emerald-50 text-emerald-600" : gpsAccuracy < 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
                <Navigation size={12} />
                {gpsAccuracy}m
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">{t(lang, "checkInTime")}</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{formatTime(todayLog?.check_in)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">{t(lang, "checkOutTime")}</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{formatTime(todayLog?.check_out)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">{t(lang, "duration")}</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{formatDuration(todayLog?.duration)}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {!isCheckedIn && !isCheckedOut && (
              <Button
                className="flex-1"
                size="lg"
                icon={<CheckCircle size={18} />}
                onClick={() => setCheckInModal(true)}
              >
                {t(lang, "checkIn")}
              </Button>
            )}
            {isCheckedIn && (
              <Button
                className="flex-1"
                variant="secondary"
                size="lg"
                icon={<LogOut size={18} />}
                onClick={() => setCheckOutModal(true)}
              >
                {t(lang, "checkOut")}
              </Button>
            )}
            {isCheckedOut && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl py-3 text-sm font-medium">
                <CheckCircle size={16} />
                Day Complete
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={t(lang, "weekHours")}
            value={`${weekHours}h`}
            icon={<Clock size={18} />}
            color="text-blue-600"
          />
          <StatCard
            label={t(lang, "monthAttendance")}
            value={`${monthPercent}%`}
            icon={<TrendingUp size={18} />}
            color={monthPercent >= 90 ? "text-emerald-600" : monthPercent >= 75 ? "text-amber-600" : "text-red-600"}
          />
        </div>
      )}

      {/* Branch/Geofence info */}
      {branch && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${insideGeofence ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>
              <MapPin size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">{t(lang, "activeBranch")}</p>
              <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{branch.name}</p>
              <p className="text-xs text-slate-400 truncate">{branch.address}</p>
            </div>
            <Badge color={insideGeofence ? "green" : "slate"}>{insideGeofence ? "Inside" : "Outside"}</Badge>
          </div>
        </Card>
      )}

      {/* Schedule info */}
      {schedule && (
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Work Schedule</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Start Time</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{schedule.check_in_time?.slice(0, 5)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">End Time</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{schedule.check_out_time?.slice(0, 5)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Late After</p>
              <p className="text-sm font-semibold text-amber-600">{schedule.late_threshold_minutes} min</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Expected Hours</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{schedule.expected_hours_per_day}h</p>
            </div>
          </div>
        </Card>
      )}

      <ConfirmModal
        open={checkInModal}
        onClose={() => setCheckInModal(false)}
        onConfirm={() => doCheckIn(true)}
        title={t(lang, "confirmCheckIn")}
        message={`You are about to manually check in at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`}
        confirmLabel={t(lang, "checkIn")}
        loading={actionLoading}
      />
      <ConfirmModal
        open={checkOutModal}
        onClose={() => setCheckOutModal(false)}
        onConfirm={() => doCheckOut(true)}
        title={t(lang, "confirmCheckOut")}
        message={`You are about to manually check out at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`}
        confirmLabel={t(lang, "checkOut")}
        loading={actionLoading}
      />
    </div>
  );
}
