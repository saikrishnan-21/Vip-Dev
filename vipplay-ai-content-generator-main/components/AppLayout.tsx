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
  children:
    | ReactNode
    | ((sidebarOpen: boolean, toggleSidebar: () => void) => ReactNode);
}

export default function AppLayout({ children }: LayoutProps) {
  const { effectiveTheme } = useTheme();
  const { user, loading } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    brandName: "FuzeBox",
    primaryColor: "#22d3ee",
    secondaryColor: "#3b82f6",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    if (!user.accountType) {
      router.replace("/account-type");
      return;
    }

    if (!user.onboardingCompleted) {
      router.replace("/onboarding");
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
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        primaryColor={profile.primaryColor}
        secondaryColor={profile.secondaryColor}
        brandName={profile.brandName}
      />

      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen overflow-hidden relative transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          sidebarOpen ? "ml-[260px]" : "ml-0",
        )}
      >
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
          {typeof children === "function"
            ? children(sidebarOpen, () => setSidebarOpen(!sidebarOpen))
            : children}
        </main>
      </div>
    </div>
  );
}
