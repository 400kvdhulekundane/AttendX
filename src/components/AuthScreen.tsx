import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import { t } from "../lib/i18n";
import { Button } from "./ui/Button";
import { Input, Select } from "./ui/Input";
import { Eye, EyeOff, Mail, Lock, User, Briefcase, Building2, Upload, Clock, CheckCircle } from "lucide-react";

type AuthView = "login" | "register" | "forgot" | "pending";

interface Branch {
  id: string;
  name: string;
}

export function AuthScreen() {
  const { signIn, refreshProfile } = useAuth();
  const { lang, toggleTheme, theme } = useApp();
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);

  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [registerForm, setRegisterForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    employeeId: "", department: "", branchId: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    supabase.from("branches").select("id, name").then(({ data }) => setBranches(data ?? []));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password, loginForm.remember);
    setLoading(false);
    if (error) setError(error);
  }

  async function uploadFile(file: File, bucket: string, userId: string): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) return null;
    if (bucket === "profile-photos") {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    return path;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!profilePhotoFile) { setError("Profile photo is required"); return; }
    if (!idCardFile) { setError("ID card photo is required"); return; }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        data: {
          full_name: registerForm.fullName,
          employee_id: registerForm.employeeId,
          department: registerForm.department,
          branch_id: registerForm.branchId || null,
          role: "employee",
        },
      },
    });

    if (signUpError || !data.user) {
      setLoading(false);
      setError(signUpError?.message ?? "Registration failed");
      return;
    }

    const userId = data.user.id;
    const [profileUrl, idCardPath] = await Promise.all([
      uploadFile(profilePhotoFile, "profile-photos", userId),
      uploadFile(idCardFile, "id-cards", userId),
    ]);

    await supabase.from("profiles").update({
      profile_photo_url: profileUrl,
      id_card_url: idCardPath,
    }).eq("id", userId);

    // Send admin alert
    supabase.functions.invoke("send-alert", {
      body: {
        type: "new_registration",
        message: `New employee registration: ${registerForm.fullName} (${registerForm.email}) is pending approval.`,
      },
    });

    await supabase.auth.signOut();
    setLoading(false);
    setView("pending");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess("Password reset email sent. Check your inbox.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Clock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AttendX</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Smart Attendance Management</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
          {view === "pending" && (
            <div className="text-center py-6">
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Registration Submitted</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Your account is pending admin approval. You'll receive an email once approved.
              </p>
              <Button variant="outline" onClick={() => setView("login")}>Back to Login</Button>
            </div>
          )}

          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">{t(lang, "loginBtn")}</h2>
              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
              <Input
                label={t(lang, "email")}
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                leftIcon={<Mail size={16} />}
                placeholder="you@company.com"
                required
              />
              <Input
                label={t(lang, "password")}
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                placeholder="••••••••"
                required
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={loginForm.remember}
                    onChange={(e) => setLoginForm({ ...loginForm, remember: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  {t(lang, "rememberMe")}
                </label>
                <button type="button" onClick={() => { setView("forgot"); setError(""); }} className="text-sm text-blue-600 hover:underline">
                  {t(lang, "forgotPassword")}
                </button>
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">{t(lang, "loginBtn")}</Button>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {t(lang, "noAccount")}{" "}
                <button type="button" onClick={() => { setView("register"); setError(""); }} className="text-blue-600 font-medium hover:underline">
                  {t(lang, "register")}
                </button>
              </p>
            </form>
          )}

          {view === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{t(lang, "resetPassword")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Enter your email to receive a password reset link.</p>
              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
              {success && <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm text-emerald-600 dark:text-emerald-400">{success}</div>}
              <Input
                label={t(lang, "email")}
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                placeholder="you@company.com"
                required
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">{t(lang, "resetPassword")}</Button>
              <button type="button" onClick={() => { setView("login"); setError(""); setSuccess(""); }} className="w-full text-sm text-slate-500 hover:text-slate-700 text-center">
                ← {t(lang, "back")} to {t(lang, "login")}
              </button>
            </form>
          )}

          {view === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{t(lang, "registerBtn")}</h2>
              {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600 dark:text-red-400">{error}</div>}
              <Input
                label={t(lang, "fullName")}
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                leftIcon={<User size={16} />}
                placeholder="John Smith"
                required
              />
              <Input
                label={t(lang, "email")}
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                leftIcon={<Mail size={16} />}
                placeholder="you@company.com"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t(lang, "employeeId")}
                  value={registerForm.employeeId}
                  onChange={(e) => setRegisterForm({ ...registerForm, employeeId: e.target.value })}
                  placeholder="EMP001"
                  required
                />
                <Input
                  label={t(lang, "department")}
                  value={registerForm.department}
                  onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                  leftIcon={<Briefcase size={14} />}
                  placeholder="Engineering"
                  required
                />
              </div>
              <Select
                label={t(lang, "branch")}
                value={registerForm.branchId}
                onChange={(e) => setRegisterForm({ ...registerForm, branchId: e.target.value })}
              >
                <option value="">Select Branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Input
                label={t(lang, "password")}
                type={showPassword ? "text" : "password"}
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                leftIcon={<Lock size={16} />}
                rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>}
                placeholder="Min. 8 characters"
                required
              />
              <Input
                label={t(lang, "confirmPassword")}
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                leftIcon={<Lock size={16} />}
                placeholder="Repeat password"
                required
              />

              {/* Photo uploads */}
              <div className="space-y-3">
                <FileUpload
                  label={t(lang, "profilePhoto")}
                  accept="image/*"
                  file={profilePhotoFile}
                  onChange={setProfilePhotoFile}
                />
                <FileUpload
                  label={t(lang, "idCardPhoto")}
                  accept="image/*,application/pdf"
                  file={idCardFile}
                  onChange={setIdCardFile}
                />
              </div>

              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">{t(lang, "registerBtn")}</Button>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                {t(lang, "haveAccount")}{" "}
                <button type="button" onClick={() => { setView("login"); setError(""); }} className="text-blue-600 font-medium hover:underline">
                  {t(lang, "login")}
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Language switcher */}
        <div className="flex justify-center gap-2 mt-4">
          {(["en", "hi", "mr"] as const).map((l) => (
            <button
              key={l}
              onClick={() => { /* setLang(l) handled via app context */ }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${lang === l ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-white dark:hover:bg-slate-800"}`}
            >
              {l === "en" ? "EN" : l === "hi" ? "हि" : "म"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FileUpload({ label, accept, file, onChange }: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</p>
      <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
        <Upload size={16} className="text-slate-400" />
        <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {file ? file.name : "Click to upload"}
        </span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
