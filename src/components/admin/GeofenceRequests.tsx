import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/Skeleton";
import { MapPin, CheckCircle, XCircle } from "lucide-react";
import type { Database } from "../../lib/database.types";

type GeofenceRequest = Database["public"]["Tables"]["geofence_requests"]["Row"] & {
  profiles?: { full_name: string; email: string };
};

export function GeofenceRequests() {
  const [requests, setRequests] = useState<GeofenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GeofenceRequest | null>(null);
  const [note, setNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const q = supabase
      .from("geofence_requests")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (filter !== "all") q.eq("status", filter);

    const { data } = await q;
    setRequests((data as GeofenceRequest[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleDecision(status: "approved" | "rejected") {
    if (!selected) return;
    setActionLoading(true);

    await supabase.from("geofence_requests").update({ status, admin_note: note }).eq("id", selected.id);

    await supabase.from("notifications").insert({
      user_id: selected.employee_id,
      title: `Geofence Request ${status === "approved" ? "Approved" : "Rejected"}`,
      body: note
        ? `Your geofence request was ${status}. Note: ${note}`
        : `Your geofence request was ${status}.`,
      type: "geofence",
    });

    supabase.functions.invoke("send-alert", {
      body: {
        type: "geofence_request",
        message: `Geofence request by ${selected.profiles?.full_name} was ${status}. ${note ? "Note: " + note : ""}`,
      },
    });

    setSelected(null);
    setNote("");
    setActionLoading(false);
    load();
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Geofence Requests</h2>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 w-fit">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState message="No geofence requests" icon={<MapPin size={40} />} />
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Card key={req.id} className="p-4" onClick={() => { setSelected(req); setNote(""); }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{req.profiles?.full_name ?? "Unknown"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{req.profiles?.email}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-slate-400">
                    <span>{req.submitted_latitude.toFixed(4)}, {req.submitted_longitude.toFixed(4)}</span>
                    <span>R: {req.submitted_radius}m</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <Badge color={req.status === "approved" ? "green" : req.status === "pending" ? "yellow" : "red"}>
                  {req.status}
                </Badge>
              </div>
              {req.admin_note && <p className="text-xs text-slate-500 mt-2 italic">{req.admin_note}</p>}
            </Card>
          ))}
        </div>
      )}

      {/* Decision modal */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title="Geofence Request Review"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{selected.profiles?.full_name}</p>
              <p className="text-xs text-slate-500">{selected.profiles?.email}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Latitude</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selected.submitted_latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Longitude</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selected.submitted_longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Radius</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selected.submitted_radius}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(selected.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <Input
              label="Admin Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the employee..."
            />

            {selected.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  icon={<CheckCircle size={16} />}
                  loading={actionLoading}
                  onClick={() => handleDecision("approved")}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  icon={<XCircle size={16} />}
                  loading={actionLoading}
                  onClick={() => handleDecision("rejected")}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
