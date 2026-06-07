import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import { Moon, Sun, Globe, LogOut, WifiOff, Clock } from "lucide-react";

export function EmployeeHeader() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme, lang, setLang, isOnline } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 h-14 flex items-center px-4 gap-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
          <Clock size={16} className="text-white" />
        </div>
        <span className="font-bold text-slate-900 dark:text-white">AttendX</span>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-2 py-1 rounded-lg text-xs">
          <WifiOff size={12} />
          <span>Offline</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => setLang(lang === "en" ? "hi" : lang === "hi" ? "mr" : "en")}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 text-xs font-bold"
          title="Change language"
        >
          <Globe size={16} />
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {profile?.profile_photo_url ? (
          <button onClick={signOut} className="w-8 h-8 rounded-full overflow-hidden ml-1">
            <img src={profile.profile_photo_url} className="w-full h-full object-cover" alt="Profile" />
          </button>
        ) : (
          <button onClick={signOut} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
