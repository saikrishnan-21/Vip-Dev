"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Settings,
  LogOut,
  Target,
  Moon,
  Sun,
  ImageIcon,
  Search,
  PlusCircle,
  Database,
  Users,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  primaryColor?: string;
  secondaryColor?: string;
  brandName?: string;
}

const mainNavigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Content", href: "/dashboard/content", icon: CheckSquare },
  { name: "Knowledge Base", href: "/dashboard/knowledge-base", icon: Database },
  { name: "Media Library", href: "/dashboard/media", icon: ImageIcon },
];

const generationNavigation = [
  { name: "Generate", href: "/dashboard/generate", icon: PlusCircle },
  { name: "AI Configuration", href: "/dashboard/ai-config", icon: Settings },
];

export default function Sidebar({
  primaryColor = "#22d3ee",
  secondaryColor = "#3b82f6",
  brandName = "VIP AI",
}: SidebarProps) {
  const { user, logout, isSuperAdmin } = useAuth();
  const { effectiveTheme, theme, setTheme } = useTheme();
  const { sidebarOpen: open, toggleSidebar: onClose } = useSidebar();
  const isDark = effectiveTheme === "dark";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 transform lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        isDark ? "bg-[#0b0e1a] border-white/5" : "bg-white border-slate-200",
        "border-r flex flex-col pt-4",
      )}
    >
      {/* Brand */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
            <img
              src="/assets/logo-icon.png"
              alt="FuzeBox Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to icon if image not found
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement?.classList.add(
                  "bg-gradient-to-br",
                  "from-cyan-400",
                  "to-blue-600",
                );
                const span = document.createElement("span");
                span.className = "text-white font-bold text-xl";
                span.innerText = "F";
                e.currentTarget.parentElement?.appendChild(span);
              }}
            />
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                "text-xl font-black tracking-tight leading-none",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              FuzeBox
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
              Content Studio
            </span>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <div className="flex-1 px-4 space-y-8 overflow-y-auto pb-4">
        <div>
          <h3
            className={cn(
              "px-4 mb-3 text-xs font-semibold uppercase tracking-wider",
              isDark ? "text-gray-500" : "text-gray-400",
            )}
          >
            Main Menu
          </h3>
          <div className="space-y-1">
            {mainNavigation.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
                activeClassName={cn(
                  isDark
                    ? "bg-white/10 text-cyan-400"
                    : "bg-cyan-50 text-cyan-600 shadow-sm shadow-cyan-500/10",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <h3
            className={cn(
              "px-4 mb-3 text-xs font-semibold uppercase tracking-wider",
              isDark ? "text-gray-500" : "text-gray-400",
            )}
          >
            AI Tools
          </h3>
          <div className="space-y-1">
            {generationNavigation.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isDark
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                )}
                activeClassName={cn(
                  isDark
                    ? "bg-white/10 text-cyan-400"
                    : "bg-cyan-50 text-cyan-600 shadow-sm shadow-cyan-500/10",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* User info & Settings */}
      <div
        className={cn(
          "mt-auto p-4 mx-4 mb-6 rounded-2xl border",
          isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100",
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
            {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-semibold truncate",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              {user?.fullName || "User"}
            </p>
            <p
              className={cn(
                "text-xs truncate",
                isDark ? "text-gray-500" : "text-gray-400",
              )}
            >
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "p-2 rounded-lg transition-colors duration-200 flex-1 flex justify-center",
              isDark
                ? "bg-white/5 hover:bg-white/10 text-cyan-400"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600",
            )}
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={logout}
            className={cn(
              "p-2 rounded-lg transition-colors duration-200 flex-1 flex justify-center text-red-500",
              isDark
                ? "bg-white/5 hover:bg-red-500/10"
                : "bg-slate-100 hover:bg-red-50",
            )}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
