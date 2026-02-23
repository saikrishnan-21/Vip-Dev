"use client";

import { useState } from "react";
import { Sun, Moon, SunMoon } from "lucide-react";

/* ── Mini app window preview ── */
function AppPreview({ type }: { type: string }) {
  if (type === "light") {
    return (
      <div className="w-full h-full bg-white flex overflow-hidden">
        <div className="w-8 bg-slate-50 border-r border-slate-100 flex flex-col gap-1.5 p-1.5 flex-shrink-0">
          <div className="h-1.5 rounded-full bg-indigo-400 w-full" />
          <div className="h-1.5 rounded-full bg-slate-200 w-full" />
          <div className="h-1.5 rounded-full bg-slate-200 w-3/4" />
          <div className="h-1.5 rounded-full bg-slate-200 w-full" />
        </div>
        <div className="flex-1 p-2 flex flex-col gap-1.5">
          <div className="h-2 rounded bg-slate-800 w-1/2" />
          <div className="h-1.5 rounded bg-slate-300 w-4/5" />
          <div className="h-1.5 rounded bg-slate-200 w-3/5" />
          <div className="mt-1 bg-slate-50 border border-slate-100 rounded-md p-1.5 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
            <div className="h-1.5 rounded bg-slate-200 flex-1" />
          </div>
        </div>
      </div>
    );
  }

  if (type === "dark") {
    return (
      <div className="w-full h-full flex overflow-hidden" style={{ background: "#0f172a" }}>
        <div className="w-8 border-r flex flex-col gap-1.5 p-1.5 flex-shrink-0" style={{ background: "#1e293b", borderColor: "#334155" }}>
          <div className="h-1.5 rounded-full w-full" style={{ background: "#818cf8" }} />
          <div className="h-1.5 rounded-full w-full" style={{ background: "#334155" }} />
          <div className="h-1.5 rounded-full w-3/4" style={{ background: "#334155" }} />
          <div className="h-1.5 rounded-full w-full" style={{ background: "#334155" }} />
        </div>
        <div className="flex-1 p-2 flex flex-col gap-1.5">
          <div className="h-2 rounded w-1/2" style={{ background: "#f8fafc" }} />
          <div className="h-1.5 rounded w-4/5" style={{ background: "#475569" }} />
          <div className="h-1.5 rounded w-3/5" style={{ background: "#334155" }} />
          <div className="mt-1 rounded-md p-1.5 flex items-center gap-1" style={{ background: "#1e293b", border: "1px solid #334155" }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#818cf8" }} />
            <div className="h-1.5 rounded flex-1" style={{ background: "#334155" }} />
          </div>
        </div>
      </div>
    );
  }

  // system — split half/half
  return (
    <div className="w-full h-full flex overflow-hidden">
      <div className="w-1/2 bg-white flex overflow-hidden border-r border-slate-200">
        <div className="w-5 bg-slate-50 border-r border-slate-100 flex flex-col gap-1 p-1">
          <div className="h-1 rounded-full bg-sky-400 w-full" />
          <div className="h-1 rounded-full bg-slate-200 w-full" />
          <div className="h-1 rounded-full bg-slate-200 w-3/4" />
        </div>
        <div className="flex-1 p-1.5 flex flex-col gap-1">
          <div className="h-1.5 rounded bg-slate-700 w-2/3" />
          <div className="h-1 rounded bg-slate-200 w-full" />
          <div className="h-1 rounded bg-slate-100 w-4/5" />
        </div>
      </div>
      <div className="w-1/2 flex overflow-hidden" style={{ background: "#0f172a" }}>
        <div className="w-5 border-r flex flex-col gap-1 p-1" style={{ background: "#1e293b", borderColor: "#334155" }}>
          <div className="h-1 rounded-full w-full" style={{ background: "#38bdf8" }} />
          <div className="h-1 rounded-full w-full" style={{ background: "#334155" }} />
          <div className="h-1 rounded-full w-3/4" style={{ background: "#334155" }} />
        </div>
        <div className="flex-1 p-1.5 flex flex-col gap-1">
          <div className="h-1.5 rounded w-2/3" style={{ background: "#f8fafc" }} />
          <div className="h-1 rounded w-full" style={{ background: "#334155" }} />
          <div className="h-1 rounded w-4/5" style={{ background: "#1e293b" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Theme config ── */
const themes = [
  {
    id: "light",
    label: "Light",
    description: "Clean, bright workspace built for daytime productivity.",
    badge: "Default",
    badgeClass: "bg-amber-100 text-amber-700",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    border: "border-amber-400",
    cardBg: "bg-amber-50/40",
    checkBg: "bg-amber-500",
    icon: <Sun size={20} className="text-amber-500" />,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Reduced eye strain for focused, late-night sessions.",
    badge: "Popular",
    badgeClass: "bg-indigo-100 text-indigo-700",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-500",
    dot: "bg-indigo-500",
    ring: "ring-indigo-200",
    border: "border-indigo-400",
    cardBg: "bg-indigo-50/40",
    checkBg: "bg-indigo-500",
    icon: <Moon size={20} className="text-indigo-400" />,
  },
  {
    id: "system",
    label: "System",
    description: "Automatically syncs with your OS preference in real time.",
    badge: "Smart",
    badgeClass: "bg-sky-100 text-sky-700",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    dot: "bg-sky-500",
    ring: "ring-sky-200",
    border: "border-sky-400",
    cardBg: "bg-sky-50/40",
    checkBg: "bg-sky-500",
    icon: <SunMoon size={20} className="text-sky-500" />,
  },
];

// To wire up to your real ThemeContext, replace useState with:
// const { theme: selected, setTheme: setSelected } = useTheme();
export default function AppearanceSettings() {
  const [selected, setSelected] = useState("light");
  const activeTheme = themes.find((t) => t.id === selected);

  return (
    <div className="w-full flex justify-center px-6 py-10">
      <div className="w-full max-w-2xl">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Appearance</h2>
              <p className="text-xs text-slate-400 mt-0.5">Personalize VIPContentAI to match your workflow</p>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="flex items-center gap-3 mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Color Theme</p>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Theme Grid — 3 columns */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {themes.map((t) => {
            const isSelected = selected === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`
                  relative group flex flex-col rounded-2xl border-2 overflow-hidden
                  transition-all duration-200 text-left cursor-pointer outline-none focus:outline-none
                  ${isSelected
                    ? `${t.border} shadow-lg ring-4 ${t.ring}`
                    : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }
                `}
              >
                {/* Mini App Preview */}
                <div className="w-full relative overflow-hidden border-b border-slate-100" style={{ aspectRatio: "16/9" }}>
                  {/* Fake browser top bar */}
                  <div className="absolute top-0 left-0 right-0 h-5 bg-slate-200/90 backdrop-blur-sm flex items-center px-2 gap-1 z-10">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <div className="flex-1 h-2.5 ml-1.5 rounded-sm bg-white/60" />
                  </div>
                  <div className="absolute inset-0 top-5">
                    <AppPreview type={t.id} />
                  </div>

                  {/* Selected check overlay */}
                  {isSelected && (
                    <div className={`absolute top-7 right-2 w-5 h-5 rounded-full ${t.checkBg} flex items-center justify-center shadow z-20`}>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className={`p-3.5 flex flex-col gap-1.5 flex-1 transition-colors duration-200 ${isSelected ? t.cardBg : "bg-white"}`}>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      {/* Radio indicator */}
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? t.border : "border-slate-300"}`}>
                        {isSelected && <div className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{t.label}</span>
                    </div>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none ${t.badgeClass}`}>
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Theme Status Bar */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTheme?.iconBg}`}>
              <span className={activeTheme?.iconColor}>{activeTheme?.icon}</span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium leading-none mb-0.5">Currently active</p>
              <p className="text-sm font-semibold text-slate-800">{activeTheme?.label} Theme</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Applied
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Changes apply instantly across your entire workspace.
        </p>
      </div>
    </div>
  );
}