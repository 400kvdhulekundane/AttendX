interface BadgeProps {
  children: React.ReactNode;
  color?: "green" | "red" | "yellow" | "blue" | "orange" | "slate" | "purple";
  dot?: boolean;
  pulse?: boolean;
}

const colors = {
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  yellow: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const dotColors = {
  green: "bg-emerald-500",
  red: "bg-red-500",
  yellow: "bg-amber-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  slate: "bg-slate-400",
  purple: "bg-purple-500",
};

export function Badge({ children, color = "blue", dot = false, pulse = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {dot && (
        <span className={`relative flex h-1.5 w-1.5`}>
          {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[color]}`} />}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[color]}`} />
        </span>
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: BadgeProps["color"] }> = {
    present: { label: "Present", color: "green" },
    absent: { label: "Absent", color: "red" },
    late: { label: "Late", color: "yellow" },
    "half-day": { label: "Half Day", color: "orange" },
    pending: { label: "Pending", color: "yellow" },
    approved: { label: "Approved", color: "green" },
    rejected: { label: "Rejected", color: "red" },
    active: { label: "Active", color: "green" },
    inactive: { label: "Inactive", color: "slate" },
  };
  const item = map[status] ?? { label: status, color: "slate" as const };
  return <Badge color={item.color}>{item.label}</Badge>;
}
