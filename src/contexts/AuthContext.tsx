import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const INACTIVITY_LIMIT = 8 * 60 * 60 * 1000; // 8 hours

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem("attendx_last_active");
  }, []);

  // Inactivity timer
  useEffect(() => {
    const updateActivity = () => localStorage.setItem("attendx_last_active", Date.now().toString());
    const checkInactivity = () => {
      const last = parseInt(localStorage.getItem("attendx_last_active") ?? "0", 10);
      if (last && Date.now() - last > INACTIVITY_LIMIT) signOut();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("touchstart", updateActivity);
    updateActivity();

    const interval = setInterval(checkInactivity, 60_000);
    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("touchstart", updateActivity);
      clearInterval(interval);
    };
  }, [signOut]);

  useEffect(() => {
    let mounted = true;

    const timeout = setTimeout(() => {
  if (mounted) setLoading(false);
}, 5000); // force stop loading after 5 seconds

supabase.auth.getSession().then(({ data: { session } }) => {
  if (!mounted) return;
  clearTimeout(timeout);
  setSession(session);
  setUser(session?.user ?? null);
  if (session?.user) {
    fetchProfile(session.user.id).finally(() => setLoading(false));
  } else {
    setLoading(false);
  }
});

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string, remember = false) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (!remember) {
      // When not remembering, override session storage behavior
      localStorage.setItem("attendx_no_persist", "1");
    } else {
      localStorage.removeItem("attendx_no_persist");
    }

    return { error: null };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const isAdmin =
    !!profile &&
    (profile.role === "admin" ||
      adminEmails.includes(profile.email?.toLowerCase() ?? ""));

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, isAdmin, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
