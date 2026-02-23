"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  primaryColor?: string;
  secondaryColor?: string;
  brandName?: string;
}

const navigationItems = [
  {
    id: "overview",
    label: "Overview",
    path: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "generate",
    label: "Generate Content",
    path: "/dashboard/generate",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    id: "media",
    label: "Media Library",
    path: "/dashboard/media",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    id: "content",
    label: "Content",
    path: "/dashboard/content",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    path: "/dashboard/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar({
  open,
  onClose,
  primaryColor = "#1389E9",
  secondaryColor = "#0EEDCD",
  brandName = "My Brand",
}: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, logout }             = useAuth();
  const { effectiveTheme, theme, setTheme } = useTheme();

  const isDark = effectiveTheme === "dark";
  const grad   = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  // Match active tab — most-specific path wins
  const activeTab =
    [...navigationItems]
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => pathname.startsWith(item.path))?.id ?? "overview";

  return (
    <>
      <aside
        className={`
          fixed top-0 left-0 h-screen w-[260px] z-50
          flex flex-col
          border-r transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          font-sans
          ${isDark ? "bg-blue-500/5 border-[#1c2333]" : "bg-white border-gray-200"}
          ${open ? "translate-x-0" : "-translate-x-[260px]"}
        `}
      >
        {/* ─── Logo ─── */}
        <div
          className={`px-5 pt-5 pb-[18px] border-b flex items-center cursor-pointer ${
            isDark ? "border-[#1c2333]" : "border-gray-200"
          }`}
          onClick={() => router.push("/dashboard")}
        >
          <img
            src={isDark ? "/assets/logo-white.png" : "/assets/logo-dark.png"}
            alt="FuzeBox"
            className="h-[10vh] w-auto object-contain block rounded-md"
          />
        </div>

        {/* ─── Navigation ─── */}
        <nav className="flex-1 px-[10px] py-3 overflow-y-auto">
          <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      router.push(item.path);
                      if (typeof window !== "undefined" && window.innerWidth < 1024) onClose();
                    }}
                    className={`
                      group w-full flex items-center gap-[11px] px-[13px] py-[9px]
                      rounded-lg border-none cursor-pointer text-left
                      text-[13.5px] transition-all duration-150 relative
                      ${
                        isActive
                          ? `font-semibold tracking-tight ${isDark ? "bg-[#1c2333] text-white" : "bg-gray-100 text-gray-900"}`
                          : `font-normal ${isDark ? "text-gray-500 hover:bg-[#161b27] hover:text-gray-200" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-[3px]"
                        style={{ background: grad }}
                      />
                    )}

                    {/* Icon — inherits hover color from parent button */}
                    <span
                      className="flex items-center flex-shrink-0 leading-none transition-colors duration-150"
                      style={{ color: isActive ? primaryColor : "inherit" }}
                    >
                      {item.icon}
                    </span>

                    <span className="leading-none">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ─── User Footer ─── */}
        <div className={`px-[10px] pt-3 pb-4 border-t ${isDark ? "border-[#1c2333]" : "border-gray-200"}`}>
          {/* User info row */}
          <div className={`flex items-center gap-[10px] px-3 py-2 rounded-lg mb-1 ${isDark ? "bg-[#111827]" : "bg-gray-50"}`}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0 tracking-tight"
              style={{ background: grad }}
            >
              {brandName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[12.5px] font-semibold truncate leading-[1.4] ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                {user?.email || "demo@vipcontentai.com"}
              </div>
              <div className={`text-[11px] leading-[1.3] ${isDark ? "text-gray-600" : "text-gray-500"}`}>
                {user?.accountType}
              </div>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`
              w-full flex items-center gap-[9px] px-[13px] py-2
              rounded-lg border-none cursor-pointer text-[13px]
              transition-all duration-150 mb-0.5
              ${isDark
                ? "bg-transparent text-gray-500 hover:bg-[#161b27] hover:text-gray-200"
                : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
            `}
          >
            <span className="flex items-center leading-none">
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </span>
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {/* Sign out */}
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className={`
              w-full flex items-center gap-[9px] px-[13px] py-2
              rounded-lg border-none cursor-pointer text-[13px]
              transition-all duration-150
              ${isDark
                ? "bg-transparent text-gray-500 hover:bg-red-500/10 hover:text-red-400"
                : "bg-transparent text-gray-600 hover:bg-red-50 hover:text-red-500"}
            `}
          >
            <span className="flex items-center leading-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}