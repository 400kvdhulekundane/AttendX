import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../lib/i18n";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/Skeleton";
import { Bell, CheckCheck, CheckCircle, XCircle, AlertTriangle, Clock, MapPin } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  approval: <CheckCircle size={16} className="text-emerald-500" />,
  rejection: <XCircle size={16} className="text-red-500" />,
  absent: <AlertTriangle size={16} className="text-amber-500" />,
  late: <Clock size={16} className="text-amber-500" />,
  check_in: <CheckCircle size={16} className="text-blue-500" />,
  check_out: <MapPin size={16} className="text-blue-500" />,
  geofence: <MapPin size={16} className="text-purple-500" />,
};

export function NotificationsScreen() {
  const { profile } = useAuth();
  const { lang } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setUnreadCount(data?.filter((n) => !n.read).length ?? 0);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    load();
    // Subscribe to realtime
    if (!profile) return;
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${profile.id}`,
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, load]);

  async function markAllRead() {
    if (!profile) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t(lang, "notifications")}</h2>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline">
            <CheckCheck size={14} />
            {t(lang, "markAllRead")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState message={t(lang, "noNotifications")} icon={<Bell size={40} />} />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 cursor-pointer transition-opacity ${n.read ? "opacity-70" : ""}`}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.read ? "bg-slate-100 dark:bg-slate-700" : "bg-blue-50 dark:bg-blue-900/20"}`}>
                  {TYPE_ICONS[n.type] ?? <Bell size={16} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${n.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white"}`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("read", false).then(({ count: c }) => setCount(c ?? 0));

    const channel = supabase.channel("notif-count")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("read", false).then(({ count: c }) => setCount(c ?? 0));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return count;
}
