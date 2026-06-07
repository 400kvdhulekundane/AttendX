import { useApp } from "../../contexts/AppContext";
import { useAuth } from "../../contexts/AuthContext";
import { useUnreadCount } from "../employee/NotificationsScreen";
import { LayoutDashboard, CalendarDays, User, Bell } from "lucide-react";

type EmployeeTab = "dashboard" | "attendance" | "profile" | "notifications";

interface Props {
  active: EmployeeTab;
  onChange: (tab: EmployeeTab) => void;
}

export function EmployeeNav({ active, onChange }: Props) {
  const { profile } = useAuth();
  const unread = useUnreadCount(profile?.id);

  const tabs: { id: EmployeeTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Home", icon: <LayoutDashboard size={22} /> },
    { id: "attendance", label: "Attendance", icon: <CalendarDays size={22} /> },
    { id: "profile", label: "Profile", icon: <User size={22} /> },
    { id: "notifications", label: "Alerts", icon: <Bell size={22} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-safe">
      <div className="grid grid-cols-4 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center justify-center py-3 gap-1 relative transition-colors ${active === tab.id ? "text-blue-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
          >
            <div className="relative">
              {tab.icon}
              {tab.id === "notifications" && unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
            {active === tab.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
