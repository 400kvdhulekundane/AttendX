import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { t } from "../../lib/i18n";
import {
  LayoutDashboard, Users, Building2, MapPin, CalendarDays,
  BarChart2, Bell, Clock, LogOut, Menu, X, Moon, Sun, Globe,
} from "lucide-react";

type AdminSection =
  | "dashboard" | "employees" | "branches" | "geofence"
  | "attendance" | "reports" | "alerts" | "schedules";

interface Props {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "employees", label: "Employees", icon: <Users size={18} /> },
  { id: "branches", label: "Branches", icon: <Building2 size={18} /> },
  { id: "geofence", label: "Geofence Requests", icon: <MapPin size={18} /> },
  { id: "attendance", label: "Attendance", icon: <CalendarDays size={18} /> },
  { id: "reports", label: "Reports", icon: <BarChart2 size={18} /> },
  { id: "alerts", label: "Alert Settings", icon: <Bell size={18} /> },
  { id: "schedules", label: "Work Schedules", icon: <Clock size={18} /> },
];

export function AdminNav({ active, onChange }: Props) {
  const { signOut, profile } = useAuth();
  const { theme, toggleTheme, lang, setLang } = useApp();
  const [open, setOpen] = useState(false);

  function navigate(s: AdminSection) {
    onChange(s);
    setOpen(false);
  }

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-14 flex items-center px-4 gap-3">
        <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 lg:hidden">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">AttendX</span>
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-medium">Admin</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "hi" : lang === "hi" ? "mr" : "en")}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
            title="Change language"
          >
            <Globe size={16} />
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={signOut} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 shadow-xl flex flex-col">
            <SidebarContent active={active} onNavigate={navigate} onClose={() => setOpen(false)} profile={profile} />
          </div>
        </div>
      )}

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex fixed left-0 top-14 bottom-0 w-56 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col z-30">
        <SidebarContent active={active} onNavigate={navigate} onClose={() => {}} profile={profile} />
      </aside>
    </>
  );
}

function SidebarContent({
  active,
  onNavigate,
  onClose,
  profile,
}: {
  active: AdminSection;
  onNavigate: (s: AdminSection) => void;
  onClose: () => void;
  profile: { full_name: string; profile_photo_url: string | null } | null;
}) {
  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 lg:hidden">
        <span className="font-bold text-slate-900 dark:text-white">Menu</span>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          <X size={18} className="text-slate-500" />
        </button>
      </div>

      {profile && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden flex-shrink-0">
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{profile.full_name[0]}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-blue-600">Administrator</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
              active === item.id
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span className={active === item.id ? "text-blue-600 dark:text-blue-400" : ""}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
}
