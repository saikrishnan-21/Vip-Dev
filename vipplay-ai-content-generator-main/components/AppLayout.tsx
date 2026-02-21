"use client";

import { useState, useEffect, ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { dashboardAPI } from "@/api/api.service";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface ProfileData {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
}

interface LayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const { effectiveTheme } = useTheme();
  const { user, loading } = useAuth();
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    brandName: "FuzeBox",
    primaryColor: "#22d3ee",
    secondaryColor: "#3b82f6",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const resp = await dashboardAPI.getDashboard();
        const bp = resp?.data?.profile;
        if (bp && !cancelled) {
          setProfile({
            brandName:
              bp.brandName || bp.fullName || user?.fullName || "FuzeBox",
            primaryColor: bp.primaryColor || "#22d3ee",
            secondaryColor: bp.secondaryColor || "#3b82f6",
          });
          return;
        }
      } catch {
        /* ignore */
      }
      const saved = localStorage.getItem("userProfile");
      if (saved && !cancelled) {
        const p = JSON.parse(saved);
        setProfile({
          brandName: p.brandName || "FuzeBox",
          primaryColor: p.primaryColor || "#22d3ee",
          secondaryColor: p.secondaryColor || "#3b82f6",
        });
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, loading, router]);

  const isDark = effectiveTheme === "dark";

  if (loading) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          isDark ? "bg-[#05070f]" : "bg-slate-50",
        )}
      >
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div
      className={cn(
        "min-h-screen flex",
        isDark ? "bg-[#05070f]" : "bg-slate-50",
      )}
    >
      <Sidebar
        primaryColor={profile.primaryColor}
        secondaryColor={profile.secondaryColor}
        brandName={profile.brandName}
      />

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Toggle button for mobile */}
        {!sidebarOpen && (
          <div className="lg:hidden p-4 border-b border-white/5 bg-transparent sticky top-0 z-40 backdrop-blur-sm flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-2 rounded-xl flex items-center justify-center border",
                isDark
                  ? "bg-white/5 border-white/10 text-white"
                  : "bg-white border-slate-200 text-slate-900",
              )}
            >
              <img
                src="/assets/logo-icon.png"
                alt="FuzeBox"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.parentElement;
                  if (fallback)
                    fallback.innerHTML =
                      '<div class="w-6 h-6 flex items-center justify-center font-bold text-xs">F</div>';
                }}
              />
            </button>
            <span
              className={cn(
                "font-black tracking-tight",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              FuzeBox
            </span>
          </div>
        )}
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
