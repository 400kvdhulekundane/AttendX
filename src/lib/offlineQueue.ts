import { supabase } from "./supabase";

export interface QueuedEvent {
  id: string;
  type: "check_in" | "check_out";
  employeeId: string;
  branchId: string | null;
  timestamp: string;
  accuracy: number | null;
  eventType: "auto" | "manual";
}

const QUEUE_KEY = "attendx_offline_queue";

export function getQueue(): QueuedEvent[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToQueue(event: QueuedEvent) {
  const queue = getQueue();
  queue.push(event);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export async function syncQueue(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let synced = 0;
  const remaining: QueuedEvent[] = [];

  for (const event of queue) {
    try {
      const date = new Date(event.timestamp).toISOString().split("T")[0];

      if (event.type === "check_in") {
        const { error } = await supabase.from("attendance_logs").upsert(
          {
            employee_id: event.employeeId,
            branch_id: event.branchId,
            date,
            check_in: event.timestamp,
            status: "present",
            check_in_type: event.eventType,
            check_in_accuracy: event.accuracy,
            attended: true,
          },
          { onConflict: "employee_id,date" },
        );
        if (error) { remaining.push(event); } else { synced++; }
      } else {
        const { data: existing } = await supabase
          .from("attendance_logs")
          .select("check_in")
          .eq("employee_id", event.employeeId)
          .eq("date", date)
          .maybeSingle();

        if (existing?.check_in) {
          const checkInTime = new Date(existing.check_in).getTime();
          const checkOutTime = new Date(event.timestamp).getTime();
          const duration = Math.round((checkOutTime - checkInTime) / 60000);

          const { error } = await supabase
            .from("attendance_logs")
            .update({
              check_out: event.timestamp,
              check_out_type: event.eventType,
              duration,
            })
            .eq("employee_id", event.employeeId)
            .eq("date", date);

          if (error) { remaining.push(event); } else { synced++; }
        } else {
          synced++; // discard orphaned check-outs
        }
      }
    } catch {
      remaining.push(event);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return synced;
}
