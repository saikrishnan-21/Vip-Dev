"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { dashboardAPI } from "@/api/api.service";
import AppLayout from "@/components/AppLayout";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Library,
  Zap,
  TrendingUp,
  Layers,
  BarChart3,
  Clock,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  brandName: string;
  website: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  tone: string;
  personality: string;
  contentTypes: string[];
  userRole?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { effectiveTheme } = useTheme();
  const { sidebarOpen } = useSidebar();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const resp = await dashboardAPI.getDashboard();
        const bp = resp?.data?.profile;
        if (bp) {
          const mapped: ProfileData = {
            brandName:
              bp.brandName || bp.fullName || user?.fullName || "My Brand",
            website: bp.website || "",
            industry: bp.industry || "Technology",
            primaryColor: bp.primaryColor || "#1389E9",
            secondaryColor: bp.secondaryColor || "#0EEDCD",
            tone: "Professional",
            personality: Array.isArray(bp.personality)
              ? bp.personality[0]
              : bp.personality || "Friendly",
            contentTypes: Array.isArray(bp.contentTypes)
              ? bp.contentTypes
              : ["Social Media", "Blog Posts"],
            userRole: user?.role || "user",
          };
          setProfile(mapped);
          localStorage.setItem("userProfile", JSON.stringify(mapped));
        }
      } catch (err) {
        console.error("Failed to load dashboard profile", err);
      }
    };
    load();
  }, [user]);

  if (!profile) return null;
  const isDark = effectiveTheme === "dark";
  const grad = `linear-gradient(to right, ${profile.primaryColor}, ${profile.secondaryColor})`;

  const STATS = [
    { label: "Articles Generated", value: "124", icon: Layers, trend: "+12%" },
    {
      label: "Total Word Count",
      value: "82.5K",
      icon: BarChart3,
      trend: "+8%",
    },
    { label: "Avg SEO Score", value: "92/100", icon: TrendingUp, trend: "+3%" },
    { label: "Assets Saved", value: "450", icon: Library, trend: "+15%" },
  ];

  const QUICK_ACTIONS = [
    {
      title: "Smart Generation",
      desc: "Create high-quality bulk articles",
      icon: Zap,
      link: "/dashboard/generate",
      color: "#F59E0B",
    },
    {
      title: "Review Content",
      desc: "Manage and approve AI drafts",
      icon: Library,
      link: "/dashboard/content",
      color: "#10B981",
    },
    {
      title: "Manage Media",
      desc: "Your global visual asset library",
      icon: Sparkles,
      link: "/dashboard/media",
      color: "#3B82F6",
    },
  ];

  return (
    <AppLayout>
      <main className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        {/* Welcome Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1
              className={cn(
                "text-5xl font-black tracking-tight",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              Welcome back,{" "}
              <span
                style={{
                  background: grad,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {user?.fullName?.split(" ")[0] || "Creator"}
              </span>
            </h1>
            <p
              className={cn(
                "text-lg font-medium",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Your content engine is running smooth. What's next?
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/generate")}
            style={{ background: grad }}
            className="px-8 py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
          >
            <Zap size={20} /> Start Generating
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "p-8 rounded-3xl border-2 transition-all hover:scale-[1.02]",
                isDark
                  ? "bg-white/[0.02] border-white/5"
                  : "bg-white border-slate-100 shadow-xl shadow-slate-200/50",
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
                  <stat.icon size={24} />
                </div>
                <span className="text-xs font-black text-emerald-500 px-2 py-1 rounded-full bg-emerald-500/10">
                  {stat.trend}
                </span>
              </div>
              <p
                className={cn(
                  "text-sm font-bold uppercase tracking-widest mb-1",
                  isDark ? "text-slate-500" : "text-slate-400",
                )}
              >
                {stat.label}
              </p>
              <p
                className={cn(
                  "text-3xl font-black",
                  isDark ? "text-white" : "text-slate-900",
                )}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <h2
              className={cn(
                "text-2xl font-black tracking-tight flex items-center gap-3",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.title}
                  onClick={() => router.push(action.link)}
                  className={cn(
                    "p-6 rounded-3xl border-2 text-left group transition-all",
                    isDark
                      ? "bg-white/[0.02] border-white/5 hover:border-cyan-500/50"
                      : "bg-white border-slate-100 hover:border-cyan-500/50 shadow-xl shadow-slate-200/50",
                  )}
                >
                  <div
                    className="mb-4 p-3 rounded-2xl w-fit transition-all group-hover:scale-110"
                    style={{
                      backgroundColor: `${action.color}15`,
                      color: action.color,
                    }}
                  >
                    <action.icon size={24} />
                  </div>
                  <h3
                    className={cn(
                      "font-black text-lg mb-1 transition-colors group-hover:text-cyan-500",
                      isDark ? "text-white" : "text-slate-900",
                    )}
                  >
                    {action.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">
                    {action.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2
              className={cn(
                "text-2xl font-black tracking-tight",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              Recent Activity
            </h2>
            <div
              className={cn(
                "rounded-3xl border-2 divide-y overflow-hidden",
                isDark
                  ? "bg-white/[0.02] border-white/5 divide-white/5"
                  : "bg-white border-slate-100 divide-slate-100 shadow-xl shadow-slate-200/50",
              )}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-6 flex items-center gap-4 hover:bg-cyan-500/5 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-bold truncate",
                        isDark ? "text-white" : "text-slate-900",
                      )}
                    >
                      Bulk News Generation #12{i}
                    </p>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                      Completed · 2h ago
                    </p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-slate-500 group-hover:text-cyan-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
