"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  dashboardAPI,
  organizationAPI,
  getCurrentUser,
  getAuthToken,
} from "@/api/api.service";
import { GradientButton } from "@/components/ui/GradientButton";
import { GradientInput } from "@/components/ui/GradientInput";
import { cn } from "@/lib/utils";
import {
  Users,
  Plus,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  X,
  CheckCircle,
  XCircle,
  Settings,
  AlertTriangle,
  Info,
} from "lucide-react";

interface TeamMember {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: "Admin" | "User" | "Viewer";
  status: "active" | "inactive" | "unknown";
  joinedDate: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  "create_content",
  "edit_content",
  "delete_content",
  "view_analytics",
  "manage_brand",
  "invite_members",
];

/* ============= LOCAL STORAGE HELPERS (individual accounts) ============= */
const getLocalKey = (userId: string) => `individual_team_${userId}`;

const loadLocalMembers = (userId: string): TeamMember[] => {
  try {
    const raw = localStorage.getItem(getLocalKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalMembers = (userId: string, members: TeamMember[]) => {
  try {
    localStorage.setItem(getLocalKey(userId), JSON.stringify(members));
  } catch {}
};

/* ============= TOAST SYSTEM ============= */
type ToastType = "success" | "error" | "info" | "warning" | "confirm";
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}
let toastId = 0;

const ToastIcon = ({ type }: { type: ToastType }) => {
  if (type === "success") return <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />;
  if (type === "error")   return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
  if (type === "warning" || type === "confirm") return <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />;
  return <Info className="w-5 h-5 text-cyan-400 flex-shrink-0" />;
};

const borderColor = (type: ToastType) => {
  if (type === "success") return "border-green-500/40";
  if (type === "error")   return "border-red-500/40";
  if (type === "warning" || type === "confirm") return "border-yellow-500/40";
  return "border-cyan-500/40";
};

const ToastContainer = ({
  toasts,
  isDark,
  onDismiss,
}: {
  toasts: Toast[];
  isDark: boolean;
  onDismiss: (id: number) => void;
}) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-6 right-6 z-[300] flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-2xl border-2 p-4 shadow-2xl animate-fade-in backdrop-blur-sm",
            isDark ? "bg-[#0a0e1a]/95" : "bg-white/95",
            borderColor(toast.type)
          )}
        >
          <div className="flex items-start gap-3">
            <ToastIcon type={toast.type} />
            <div className="flex-1 min-w-0">
              <p className={cn("font-semibold text-sm", isDark ? "text-white" : "text-gray-900")}>
                {toast.title}
              </p>
              {toast.message && (
                <p className={cn("text-xs mt-0.5 font-normal", isDark ? "text-gray-400" : "text-gray-500")}>
                  {toast.message}
                </p>
              )}
              {toast.type === "confirm" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => { toast.onConfirm?.(); onDismiss(toast.id); }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => { toast.onCancel?.(); onDismiss(toast.id); }}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                      isDark
                        ? "bg-white/[0.05] border-white/10 text-gray-300 hover:bg-white/[0.08]"
                        : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {toast.type !== "confirm" && (
              <button
                onClick={() => onDismiss(toast.id)}
                className={cn("flex-shrink-0 transition-colors", isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ============= MAIN COMPONENT ============= */
const AdminDashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [teamAnalytics, setTeamAnalytics] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [accountDeactivated, setAccountDeactivated] = useState(false);

  const [isDark, setIsDark] = useState(
    () => !document.documentElement.classList.contains("light")
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains("light"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  /* ── toast helpers ── */
  const showToast = (
    type: ToastType,
    title: string,
    message?: string,
    opts?: { onConfirm?: () => void; onCancel?: () => void; duration?: number }
  ) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, title, message, onConfirm: opts?.onConfirm, onCancel: opts?.onCancel }]);
    if (type !== "confirm") setTimeout(() => dismissToast(id), opts?.duration ?? 4000);
  };
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  const confirmDialog = (title: string, message: string): Promise<boolean> =>
    new Promise((resolve) => {
      showToast("confirm", title, message, {
        onConfirm: () => resolve(true),
        onCancel:  () => resolve(false),
      });
    });

  /* ── Safe API wrapper ── */
  const safeCall = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    const token = getAuthToken();
    if (!token) { setAccountDeactivated(true); return fallback; }
    try {
      return await fn();
    } catch (e: any) {
      const msg = e?.message?.toLowerCase() ?? "";
      if (msg.includes("deactivat") || msg.includes("disabled") || msg.includes("inactive")) {
        setAccountDeactivated(true);
        return fallback;
      }
      if (msg.includes("session expired") || msg.includes("unauthorized") || msg.includes("401")) {
        showToast("error", "Session issue", "Please refresh the page and try again.");
        return fallback;
      }
      throw e;
    }
  };

  /* ── form state ── */
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName,  setNewMemberName]  = useState("");
  const [newMemberRole,  setNewMemberRole]  = useState<"Admin" | "User">("User");

  const resolvedUser = useMemo(() => user || getCurrentUser(), [user]);
  const userEmail = resolvedUser?.email ?? (typeof window !== "undefined" ? localStorage.getItem("userEmail") : "") ?? "";

  const currentUserId = useMemo(() => {
    const u = resolvedUser as any;
    return u?._id || u?.id || (typeof window !== "undefined" ? localStorage.getItem("userId") : null) || userEmail || "default";
  }, [resolvedUser, userEmail]);

  const orgId = useMemo(() => {
    const u = resolvedUser as any;
    const fromUser =
      typeof u?.organizationId === "string"
        ? u.organizationId
        : u?.organizationId?._id;
    return fromUser || (typeof window !== "undefined" ? localStorage.getItem("organizationId") : null) || null;
  }, [resolvedUser]);

  const isIndividual = useMemo(() => {
    const u = resolvedUser as any;
    if (u?.accountType === "individual") return true;
    if (u?.accountType === "organization") return false;
    return !orgId;
  }, [resolvedUser, orgId]);

  /* ── Map org API response shape → TeamMember ── */
  const mapMembers = (raw: any[]): TeamMember[] =>
    raw.map((m) => ({
      id:         m._id,
      userId:     m.userId?._id?.toString?.() || (typeof m.userId === "string" ? m.userId : undefined),
      email:      m.userId?.email || "",
      name:       m.userId?.fullName || m.userId?.email || "Member",
      role:       m.role === "admin" ? "Admin" : m.role === "viewer" ? "Viewer" : "User",
      status:
        typeof m.userId?.isActive === "boolean"
          ? m.userId.isActive ? "active" : "inactive"
          : "unknown",
      joinedDate:  m.joinedAt || "",
      permissions: m.role === "admin" ? [...AVAILABLE_PERMISSIONS] : ["create_content", "view_analytics"],
    }));

  /* ── Load members on mount ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (authLoading) return;
      const token = getAuthToken();
      if (!token) return;

      if (isIndividual) {
        const local = loadLocalMembers(currentUserId);
        if (!cancelled) { setTeamMembers(local); setLoading(false); }
        return;
      }

      if (!orgId) {
        setError("No organization found. Please complete onboarding first.");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [membersResp, analyticsResp] = await Promise.all([
          safeCall(() => organizationAPI.getMembers(orgId), { members: [] }),
          safeCall(() => dashboardAPI.getTeamAnalytics(), { data: null }),
        ]);
        if (!cancelled) {
          setTeamMembers(mapMembers((membersResp as any)?.members || []));
          setTeamAnalytics((analyticsResp as any)?.data || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [orgId, authLoading, isIndividual, currentUserId]);

  useEffect(() => {
    if (isIndividual && !authLoading && currentUserId !== "default") {
      saveLocalMembers(currentUserId, teamMembers);
    }
  }, [teamMembers, isIndividual, currentUserId, authLoading]);

  /* ── Add member ── */
  const addMember = async () => {
    if (!newMemberEmail.trim() || !newMemberName.trim()) {
      showToast("warning", "Missing fields", "Please fill in all fields."); return;
    }
    if (!newMemberEmail.includes("@")) {
      showToast("error", "Invalid email", "Please enter a valid email address."); return;
    }
    if (teamMembers.some((m) => m.email.toLowerCase() === newMemberEmail.toLowerCase())) {
      showToast("warning", "Already exists", "A member with this email already exists."); return;
    }

    if (isIndividual) {
      const newMember: TeamMember = {
        id:          `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        email:       newMemberEmail.trim().toLowerCase(),
        name:        newMemberName.trim(),
        role:        newMemberRole,
        status:      "active",
        joinedDate:  new Date().toISOString(),
        permissions: newMemberRole === "Admin" ? [...AVAILABLE_PERMISSIONS] : ["create_content", "view_analytics"],
      };
      setTeamMembers((prev) => [...prev, newMember]);
      showToast("success", "Member added!", `${newMemberName} has been added to your team.`);
      setNewMemberEmail(""); setNewMemberName(""); setNewMemberRole("User");
      setShowAddMemberModal(false);
      return;
    }

    if (!orgId) {
      showToast("error", "No organization", "Please complete onboarding or refresh the page."); return;
    }
    try {
      setLoading(true);
      const backendRole = newMemberRole === "Admin" ? "admin" : "member";
      const res = await safeCall(
        () => organizationAPI.addMember(orgId, {
          email:    newMemberEmail.trim().toLowerCase(),
          fullName: newMemberName.trim(),
          role:     backendRole,
        }),
        null
      );
      if (!res) return;
      if ((res as any)?.isNewUser && (res as any)?.message) {
        showToast("info", "Invitation sent", (res as any).message);
      } else {
        showToast("success", "Member added!", `${newMemberName} has been added to your team.`);
      }
      const membersResp = await safeCall(() => organizationAPI.getMembers(orgId), { members: [] });
      setTeamMembers(mapMembers((membersResp as any)?.members || []));
      setNewMemberEmail(""); setNewMemberName(""); setNewMemberRole("User");
      setShowAddMemberModal(false);
    } catch (e: any) {
      showToast("error", "Failed to add member", e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Promote / demote ── */
  const toggleMemberRole = async (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;
    const isPromoting = member.role === "User";
    const nextRole: "Admin" | "User" = isPromoting ? "Admin" : "User";
    const nextPerms = isPromoting ? [...AVAILABLE_PERMISSIONS] : ["create_content", "view_analytics"];

    if (isIndividual) {
      setTeamMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: nextRole, permissions: nextPerms } : m));
      showToast("success", isPromoting ? "Promoted to Admin" : "Demoted to User", `${member.name}'s role updated.`);
      return;
    }
    try {
      setLoading(true);
      await safeCall(() => organizationAPI.updateMemberRole(memberId, isPromoting ? "admin" : "member"), null);
      setTeamMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: nextRole, permissions: nextPerms } : m));
      showToast("success", isPromoting ? "Promoted to Admin" : "Demoted to User", `${member.name}'s role updated.`);
    } catch (e: any) {
      showToast("error", "Failed to update role", e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Toggle status ── */
  const toggleMemberStatus = async (member: TeamMember) => {
    const newActive = member.status !== "active";

    if (isIndividual) {
      setTeamMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, status: newActive ? "active" : "inactive" } : m));
      showToast("success", newActive ? "Member activated" : "Member deactivated", `${member.name} is now ${newActive ? "active" : "inactive"}.`);
      return;
    }
    const uid = member.userId;
    if (!uid) { showToast("error", "Cannot change status", "User ID is unknown."); return; }
    try {
      setLoading(true);
      await safeCall(() => dashboardAPI.updateUserStatus(uid, newActive), null);
      if (orgId) {
        const resp = await safeCall(() => organizationAPI.getMembers(orgId), { members: [] });
        setTeamMembers(mapMembers((resp as any)?.members || []));
      }
      showToast("success", newActive ? "Member activated" : "Member deactivated", `${member.name} is now ${newActive ? "active" : "inactive"}.`);
    } catch (e: any) {
      showToast("error", "Failed to update status", e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Remove member ── */
  const removeMember = async (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (member?.email === userEmail) {
      showToast("warning", "Cannot remove yourself", "You can't remove your own account."); return;
    }
    const confirmed = await confirmDialog("Remove member?", `Are you sure you want to remove ${member?.name || "this member"}?`);
    if (!confirmed) return;

    if (isIndividual) {
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast("success", "Member removed", `${member?.name} has been removed.`);
      return;
    }
    try {
      setLoading(true);
      await safeCall(() => organizationAPI.removeMember(memberId), null);
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast("success", "Member removed", `${member?.name} has been removed.`);
    } catch (e: any) {
      showToast("error", "Failed to remove member", e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Toggle permission ── */
  const togglePermission = (permission: string) => {
    if (!selectedMemberId) return;
    setTeamMembers(teamMembers.map((member) => {
      if (member.id !== selectedMemberId) return member;
      const has = member.permissions.includes(permission);
      return {
        ...member,
        permissions: has
          ? member.permissions.filter((p) => p !== permission)
          : [...member.permissions, permission],
      };
    }));
  };

  /* ── Loading screen ── */
  if (authLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", isDark ? "bg-[#0a0e1a] text-white" : "bg-gray-50 text-gray-900")}>
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }

  /* ── Deactivated screen ── */
  if (accountDeactivated) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center px-6", isDark ? "bg-[#0a0e1a]" : "bg-gray-50")}>
        <div className={cn("max-w-md w-full rounded-2xl border-2 p-8 text-center", isDark ? "bg-[#0a0e1a] border-red-500/30" : "bg-white border-red-200")}>
          <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className={cn("text-xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>Account Deactivated</h2>
          <p className={cn("text-sm mb-6", isDark ? "text-gray-400" : "text-gray-500")}>
            Your account has been deactivated. Please contact your administrator to reactivate.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={async () => { setAccountDeactivated(false); await refreshUser(); }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1389E9] to-[#0EEDCD] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className={cn("w-full py-2.5 rounded-xl border-2 font-semibold text-sm transition-colors", isDark ? "border-white/10 text-gray-400 hover:text-white" : "border-gray-200 text-gray-600 hover:text-gray-900")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId);

  /* ── Theme tokens ── */
  const t = {
    pageBg:            isDark ? "bg-[#0a0e1a]"              : "bg-gray-50",
    card:              isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-gray-200",
    tableHead:         isDark ? "bg-white/[0.04] border-white/10" : "bg-gray-50 border-gray-200",
    tableRow:          isDark ? "border-white/10"            : "border-gray-100",
    tableRowAlt:       isDark ? "bg-white/[0.02]"            : "bg-gray-50/50",
    heading:           isDark ? "text-white"                 : "text-gray-900",
    subtext:           isDark ? "text-gray-400"              : "text-gray-500",
    label:             isDark ? "text-gray-300"              : "text-gray-600",
    input:             isDark
      ? "bg-white/[0.05] border-white/10 text-white placeholder-gray-500 focus:border-blue-400 focus:bg-white/[0.08]"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500",
    errorBg:           isDark ? "bg-red-500/10 border-red-500/20"  : "bg-red-50 border-red-200",
    errorText:         isDark ? "text-red-400"               : "text-red-600",
    statCard:          isDark ? "bg-white/[0.03] border-2 border-white/10" : "bg-white border-2 border-gray-200 shadow-sm",
    modalBg:           isDark ? "bg-[#0a0e1a]"              : "bg-white",
    modalBorder:       isDark ? "border-cyan-400/50"         : "border-cyan-500/40",
    modalBorderBlue:   isDark ? "border-blue-400/50"         : "border-blue-500/40",
    cancelBtn:         isDark ? "bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.08]" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200",
    emptyIcon:         isDark ? "text-gray-600"              : "text-gray-300",
    emptyText:         isDark ? "text-gray-400"              : "text-gray-400",
    doneBtn:           isDark ? "bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.08]" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200",
    roleAdminSelected:   isDark ? "border-blue-400 bg-blue-500/20 text-blue-400"   : "border-blue-500 bg-blue-50 text-blue-600",
    roleAdminUnselected: isDark ? "border-white/10 bg-white/[0.03] text-gray-400 hover:border-blue-400/50"  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-400/50",
    roleUserSelected:    isDark ? "border-cyan-400 bg-cyan-500/20 text-cyan-400"   : "border-cyan-500 bg-cyan-50 text-cyan-600",
    roleUserUnselected:  isDark ? "border-white/10 bg-white/[0.03] text-gray-400 hover:border-cyan-400/50"  : "border-gray-200 bg-gray-50 text-gray-500 hover:border-cyan-400/50",
  };

  return (
    <div className={cn("min-h-screen relative overflow-hidden font-alliance antialiased transition-colors duration-300", t.pageBg)}>
      {isDark && (
        <>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </>
      )}

      <ToastContainer toasts={toasts} isDark={isDark} onDismiss={dismissToast} />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8">
        {error && (
          <div className={cn("mb-6 rounded-xl p-4 border", t.errorBg)}>
            <p className={cn("text-sm font-semibold", t.errorText)}>{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={cn("text-4xl font-bold mb-2", t.heading)}>Team Management</h1>
            <p className={cn("font-normal", t.subtext)}>Manage users and assign roles &amp; permissions</p>
          </div>
          <GradientButton onClick={() => setShowAddMemberModal(true)} className="font-bold flex items-center gap-2" disabled={loading}>
            <Plus className="w-5 h-5" />
            Add Member
          </GradientButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={cn("p-6 rounded-2xl", t.statCard)}>
            <div className={cn("text-sm font-semibold mb-2", t.label)}>Total Members</div>
            <div className={cn("text-3xl font-bold", t.heading)}>{teamMembers.length}</div>
          </div>
          <div className={cn("p-6 rounded-2xl", t.statCard)}>
            <div className={cn("text-sm font-semibold mb-2", t.label)}>Active Members</div>
            <div className="text-3xl font-bold text-green-500">{teamMembers.filter((m) => m.status === "active").length}</div>
          </div>
          <div className={cn("p-6 rounded-2xl", t.statCard)}>
            <div className={cn("text-sm font-semibold mb-2", t.label)}>Admins</div>
            <div className="text-3xl font-bold text-blue-500">{teamMembers.filter((m) => m.role === "Admin").length}</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5", t.subtext)} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members..."
              className={cn("w-full h-12 pl-12 pr-4 rounded-xl border-2 font-normal focus:outline-none transition-all", t.input)}
            />
          </div>
        </div>

        {/* Table */}
        <div className={cn("border-2 rounded-2xl overflow-hidden", t.card)}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={cn("border-b", t.tableHead)}>
                <tr>
                  {["Member", "Role", "Status", "Permissions", "Actions"].map((col, i) => (
                    <th key={col} className={cn("px-6 py-4 text-sm font-semibold", t.label, i < 4 ? "text-left" : "text-right")}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className={cn("border-b transition-colors", t.tableRow, member.status === "inactive" && "opacity-50", index % 2 === 0 ? t.tableRowAlt : "")}
                  >
                    <td className="px-6 py-4">
                      <div className={cn("font-semibold mb-1", t.heading)}>{member.name}</div>
                      <div className={cn("text-sm", t.subtext)}>{member.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex px-3 py-1 rounded-full border text-xs font-bold", member.role === "Admin" ? "bg-blue-500/20 border-blue-400/40 text-blue-500" : "bg-cyan-500/20 border-cyan-400/40 text-cyan-500")}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex px-3 py-1 rounded-full border text-xs font-bold", member.status === "active" ? "bg-green-500/20 border-green-400/40 text-green-500" : "bg-red-500/20 border-red-400/40 text-red-500")}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setSelectedMemberId(member.id); setShowPermissionsModal(true); }}
                        className="text-cyan-500 hover:text-cyan-400 text-sm font-semibold transition-colors flex items-center gap-1"
                      >
                        <Settings className="w-4 h-4" />
                        Manage ({member.permissions.length})
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {member.email !== userEmail && member.role === "User" && (
                          <button onClick={() => toggleMemberRole(member.id)} className="p-2 rounded-lg border bg-green-500/20 border-green-400/30 text-green-500 hover:bg-green-500/30 transition-all" title="Promote to Admin">
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                        )}
                        {member.email !== userEmail && (member.role === "Admin" || member.role === "Viewer") && (
                          <button onClick={() => toggleMemberRole(member.id)} className="p-2 rounded-lg border bg-yellow-500/20 border-yellow-400/30 text-yellow-500 hover:bg-yellow-500/30 transition-all" title="Demote to User">
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleMemberStatus(member)}
                          className={cn("p-2 rounded-lg border transition-all", member.status === "active" ? "bg-red-500/20 border-red-400/30 text-red-500 hover:bg-red-500/30" : "bg-green-500/20 border-green-400/30 text-green-500 hover:bg-green-500/30")}
                          title={member.status === "active" ? "Deactivate" : "Activate"}
                        >
                          {member.status === "active" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        {member.email !== userEmail && (
                          <button onClick={() => removeMember(member.id)} className="p-2 rounded-lg bg-red-500/20 border border-red-400/30 text-red-500 hover:bg-red-500/30 transition-all" title="Remove Member">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className={cn("w-16 h-16 mx-auto mb-3", t.emptyIcon)} />
              <p className={t.emptyText}>{searchQuery ? "No members found" : "No team members yet"}</p>
            </div>
          )}
        </div>
      </div>

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
          <div className={cn("w-full max-w-md rounded-2xl border-2 p-8 shadow-2xl", t.modalBg, t.modalBorder)}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn("text-2xl font-bold", t.heading)}>Add Team Member</h2>
              <button onClick={() => setShowAddMemberModal(false)} className={cn("transition-colors", t.subtext)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <GradientInput label="Name *" value={newMemberName} placeholder="Enter member name" onChange={(e) => setNewMemberName(e.target.value)} />
              <GradientInput label="Email *" value={newMemberEmail} placeholder="member@example.com" onChange={(e) => setNewMemberEmail(e.target.value)} />
              <div>
                <label className={cn("block text-sm font-semibold mb-2", t.label)}>Role *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setNewMemberRole("Admin")} className={cn("p-3 rounded-xl border-2 transition-all font-semibold", newMemberRole === "Admin" ? t.roleAdminSelected : t.roleAdminUnselected)}>
                    Admin
                  </button>
                  <button onClick={() => setNewMemberRole("User")} className={cn("p-3 rounded-xl border-2 transition-all font-semibold", newMemberRole === "User" ? t.roleUserSelected : t.roleUserUnselected)}>
                    User
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddMemberModal(false)} className={cn("flex-1 px-4 py-3 rounded-xl border-2 transition-all font-semibold", t.cancelBtn)}>
                Cancel
              </button>
              <GradientButton onClick={addMember} className="flex-1 font-bold" disabled={loading}>
                {loading ? "Adding..." : "Add Member"}
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSIONS MODAL */}
      {showPermissionsModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
          <div className={cn("w-full max-w-lg rounded-2xl border-2 p-8 shadow-2xl", t.modalBg, t.modalBorderBlue)}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={cn("text-2xl font-bold", t.heading)}>Manage Permissions</h2>
                <p className={cn("text-sm mt-1", t.subtext)}>{selectedMember.name}</p>
              </div>
              <button onClick={() => { setShowPermissionsModal(false); setSelectedMemberId(null); }} className={cn("transition-colors", t.subtext)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {AVAILABLE_PERMISSIONS.map((permission) => {
                const has = selectedMember.permissions.includes(permission);
                return (
                  <button
                    key={permission}
                    onClick={() => togglePermission(permission)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between",
                      has ? "border-green-500 bg-green-500/10" : isDark ? "border-white/10 bg-white/[0.03] hover:border-green-400/50" : "border-gray-200 bg-gray-50 hover:border-green-400/60"
                    )}
                  >
                    <div className={cn("font-semibold capitalize", t.heading)}>{permission.replace(/_/g, " ")}</div>
                    {has && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setShowPermissionsModal(false); setSelectedMemberId(null); }}
              className={cn("w-full px-4 py-3 rounded-xl border-2 transition-all font-semibold", t.doneBtn)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.25s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;