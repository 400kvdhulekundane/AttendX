import { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useApp } from "./contexts/AppContext";
import { AuthScreen } from "./components/AuthScreen";
import { EmployeeHeader } from "./components/layout/EmployeeHeader";
import { EmployeeNav } from "./components/layout/EmployeeNav";
import { AdminNav } from "./components/layout/AdminNav";
import { EmployeeDashboard } from "./components/employee/EmployeeDashboard";
import { AttendanceHistory } from "./components/employee/AttendanceHistory";
import { EmployeeProfile } from "./components/employee/EmployeeProfile";
import { NotificationsScreen } from "./components/employee/NotificationsScreen";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { EmployeeManagement } from "./components/admin/EmployeeManagement";
import { BranchManagement } from "./components/admin/BranchManagement";
import { GeofenceRequests } from "./components/admin/GeofenceRequests";
import { AttendanceManagement } from "./components/admin/AttendanceManagement";
import { Reports } from "./components/admin/Reports";
import { AlertsSettings } from "./components/admin/AlertsSettings";
import { WorkSchedules } from "./components/admin/WorkSchedules";
import { Clock } from "lucide-react";

type EmployeeTab = "dashboard" | "attendance" | "profile" | "notifications";
type AdminSection = "dashboard" | "employees" | "branches" | "geofence" | "attendance" | "reports" | "alerts" | "schedules";

function PendingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Account Pending Approval</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Your account is under review by an administrator. You'll receive a notification once it's approved.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}

export function AppShell() {
  const { profile, isAdmin, loading } = useAuth();
  const [empTab, setEmpTab] = useState<EmployeeTab>("dashboard");
  const [adminSection, setAdminSection] = useState<AdminSection>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Clock size={24} className="text-white" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading AttendX...</p>
        </div>
      </div>
    );
  }

  if (!profile) return <AuthScreen />;

  if (!isAdmin && profile.status === "pending") return <PendingScreen />;
  if (!isAdmin && profile.status === "rejected") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Account Rejected</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {profile.rejection_reason ?? "Your account registration was not approved. Please contact HR."}
          </p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    const SECTION_COMPONENTS: Record<AdminSection, React.ReactNode> = {
      dashboard: <AdminDashboard />,
      employees: <EmployeeManagement />,
      branches: <BranchManagement />,
      geofence: <GeofenceRequests />,
      attendance: <AttendanceManagement />,
      reports: <Reports />,
      alerts: <AlertsSettings />,
      schedules: <WorkSchedules />,
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <AdminNav active={adminSection} onChange={setAdminSection} />
        <main className="pt-14 lg:pl-56 min-h-screen">
          <div className="max-w-4xl">
            {SECTION_COMPONENTS[adminSection]}
          </div>
        </main>
      </div>
    );
  }

  // Employee view
  const TAB_COMPONENTS: Record<EmployeeTab, React.ReactNode> = {
    dashboard: <EmployeeDashboard />,
    attendance: <AttendanceHistory />,
    profile: <EmployeeProfile />,
    notifications: <NotificationsScreen />,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <EmployeeHeader />
      <main className="pt-14 max-w-lg mx-auto">
        {TAB_COMPONENTS[empTab]}
      </main>
      <EmployeeNav active={empTab} onChange={setEmpTab} />
    </div>
  );
}
