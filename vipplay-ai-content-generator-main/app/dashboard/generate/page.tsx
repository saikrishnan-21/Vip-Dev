"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  FileText,
  Target,
  TrendingUp,
  RefreshCw,
  Settings,
  Layers,
  Feather,
  ChevronRight,
  Zap,
  Info,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
  _id: string;
  title: string;
  mode: string;
  status: "processing" | "queued" | "completed" | "failed" | "cancelled";
  createdAt: string;
  articleCount: number;
  progress: number;
}

interface Trend {
  keyword: string;
  volume: string;
  newsSource: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const MODES = [
  {
    id: "topic",
    label: "Topic-Based",
    desc: "Articles from a specific topic",
    icon: FileText,
  },
  {
    id: "keywords",
    label: "Keywords",
    desc: "SEO-optimized from tags",
    icon: Target,
  },
  {
    id: "trends",
    label: "Trending",
    desc: "Current viral search topics",
    icon: TrendingUp,
  },
  {
    id: "spin",
    label: "Rewrite",
    desc: "Creative article spinning",
    icon: RefreshCw,
  },
  {
    id: "freeform",
    label: "Free-form",
    desc: "Your own custom prompts",
    icon: Feather,
  },
];

function ModeToggle({
  isAdvanced,
  onChange,
  isDark,
}: {
  isAdvanced: boolean;
  onChange: (v: boolean) => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!isAdvanced)}
      className={cn(
        "flex items-center gap-4 px-6 py-2.5 rounded-xl border transition-all",
        isDark
          ? "bg-white/5 border-white/10"
          : "bg-white border-slate-200 shadow-sm",
      )}
    >
      <span
        className={cn(
          "text-xs font-bold uppercase tracking-widest transition-colors",
          !isAdvanced
            ? isDark
              ? "text-white"
              : "text-slate-900"
            : "text-slate-400",
        )}
      >
        Basic
      </span>
      <div
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          isAdvanced ? "bg-cyan-500" : isDark ? "bg-white/10" : "bg-slate-200",
        )}
      >
        <div
          className={cn(
            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
            isAdvanced ? "translate-x-5" : "translate-x-0",
          )}
        />
      </div>
      <span
        className={cn(
          "text-xs font-bold uppercase tracking-widest transition-colors",
          isAdvanced ? "text-cyan-500" : "text-slate-400",
        )}
      >
        Advanced
      </span>
    </button>
  );
}

export default function Generate() {
  const { effectiveTheme } = useTheme();
  const router = useRouter();
  const { sidebarOpen } = useSidebar();
  const [mode, setMode] = useState("topic");
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [articleCount, setArticleCount] = useState(1);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [generating, setGenerating] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
      setProfile(p);
    }
  }, []);

  const primaryColor = profile?.primaryColor || "#1389E9";
  const secondaryColor = profile?.secondaryColor || "#0EEDCD";
  const grad = `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`;
  const isDark = effectiveTheme === "dark";

  // Form States
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setGenerating(false);
      const newJob: Job = {
        _id: `job_${Date.now()}`,
        title:
          mode === "topic"
            ? topic
            : mode === "trends"
              ? selectedTrend?.keyword || "Trend"
              : "New Content",
        mode,
        status: "processing",
        createdAt: new Date().toISOString(),
        articleCount,
        progress: 10,
      };
      setJobs([newJob, ...jobs]);
    }, 1500);
  };

  const cancelJob = (id: string) => {
    setJobs(jobs.filter((j) => j._id !== id));
  };

  return (
    <AppLayout>
      <main
        style={{ transition: "margin-left 0.3s ease" }}
        className={cn("flex-1 overflow-auto", sidebarOpen ? "lg:ml-0" : "ml-0")}
      >
        {/* Header */}
        <header
          className={cn(
            "sticky top-0 z-30 px-8 py-6 border-b backdrop-blur-md flex items-center justify-between",
            isDark
              ? "bg-[#0a0e1a]/80 border-white/5"
              : "bg-white/80 border-slate-100 shadow-sm",
          )}
        >
          <div>
            <h1
              className={cn(
                "text-2xl font-bold",
                isDark ? "text-white" : "text-slate-900",
              )}
            >
              Generate Content
            </h1>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              AI-powered bulk article creation
            </p>
          </div>
          <ModeToggle
            isAdvanced={isAdvanced}
            onChange={setIsAdvanced}
            isDark={isDark}
          />
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Mode Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {MODES.map((m) => {
                  const active = mode === m.id;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-3",
                        active
                          ? "border-cyan-500 bg-cyan-500/5"
                          : isDark
                            ? "border-white/5 bg-white/5 hover:border-white/10"
                            : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <div
                        className={cn(
                          "p-2.5 rounded-xl",
                          active
                            ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                            : isDark
                              ? "bg-white/5 text-slate-400"
                              : "bg-slate-50 text-slate-500",
                        )}
                      >
                        <Icon size={20} />
                      </div>
                      <span
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-wider",
                          active
                            ? "text-cyan-500"
                            : isDark
                              ? "text-slate-400"
                              : "text-slate-600",
                        )}
                      >
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Main Configuration Card */}
              <div
                className={cn(
                  "rounded-3xl border p-8",
                  isDark
                    ? "bg-white/5 border-white/5"
                    : "bg-white border-slate-100 shadow-xl shadow-slate-200/40",
                )}
              >
                <h2
                  className={cn(
                    "text-xl font-bold mb-6 flex items-center gap-3",
                    isDark ? "text-white" : "text-slate-900",
                  )}
                >
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                    <Settings size={20} />
                  </div>
                  {MODES.find((m) => m.id === mode)?.label} Settings
                </h2>

                <div className="space-y-6">
                  {mode === "topic" && (
                    <div>
                      <label
                        className={cn(
                          "block text-[10px] font-black uppercase tracking-[0.2em] mb-3",
                          isDark ? "text-slate-500" : "text-slate-400",
                        )}
                      >
                        Focus Topic
                      </label>
                      <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What should the articles focus on?"
                        className={cn(
                          "w-full h-14 px-6 rounded-2xl border-2 outline-none transition-all font-medium",
                          isDark
                            ? "bg-white/5 border-white/5 focus:border-cyan-500/50 text-white"
                            : "bg-slate-50 border-slate-100 focus:border-cyan-500/50",
                        )}
                      />
                    </div>
                  )}

                  {mode === "keywords" && (
                    <div>
                      <label
                        className={cn(
                          "block text-[10px] font-black uppercase tracking-[0.2em] mb-3",
                          isDark ? "text-slate-500" : "text-slate-400",
                        )}
                      >
                        Target Keywords
                      </label>
                      <textarea
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Enter keywords separated by commas..."
                        className={cn(
                          "w-full h-32 p-6 rounded-2xl border-2 outline-none transition-all font-medium",
                          isDark
                            ? "bg-white/5 border-white/5 focus:border-cyan-500/50 text-white"
                            : "bg-slate-50 border-slate-100 focus:border-cyan-500/50",
                        )}
                      />
                    </div>
                  )}

                  {isAdvanced && (
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      <div>
                        <label
                          className={cn(
                            "block text-[10px] font-black uppercase tracking-[0.2em] mb-3",
                            isDark ? "text-slate-500" : "text-slate-400",
                          )}
                        >
                          Tone
                        </label>
                        <select
                          className={cn(
                            "w-full h-12 px-6 rounded-xl border-2 outline-none",
                            isDark
                              ? "bg-white/5 border-white/5 text-white"
                              : "bg-slate-50 border-slate-100",
                          )}
                        >
                          <option>Professional</option>
                          <option>Conversational</option>
                          <option>Provocative</option>
                        </select>
                      </div>
                      <div>
                        <label
                          className={cn(
                            "block text-[10px] font-black uppercase tracking-[0.2em] mb-3",
                            isDark ? "text-slate-500" : "text-slate-400",
                          )}
                        >
                          Length
                        </label>
                        <select
                          className={cn(
                            "w-full h-12 px-6 rounded-xl border-2 outline-none",
                            isDark
                              ? "bg-white/5 border-white/5 text-white"
                              : "bg-slate-50 border-slate-100",
                          )}
                        >
                          <option>Long (1500+ words)</option>
                          <option>Standard (1000 words)</option>
                          <option>Short (500 words)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Action Card */}
            <div className="space-y-6">
              <div
                className={cn(
                  "rounded-3xl border p-6",
                  isDark
                    ? "bg-white/5 border-white/5"
                    : "bg-white border-slate-100 shadow-xl shadow-slate-200/40",
                )}
              >
                <h3
                  className={cn(
                    "text-sm font-bold mb-6 flex items-center gap-2",
                    isDark ? "text-white" : "text-slate-900",
                  )}
                >
                  <Zap size={16} className="text-cyan-500" /> Bulk Action
                </h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span
                        className={cn(
                          "text-xs font-bold uppercase",
                          isDark ? "text-slate-400" : "text-slate-500",
                        )}
                      >
                        Quantity
                      </span>
                      <span className="text-xl font-black text-cyan-500">
                        {articleCount}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={articleCount}
                      onChange={(e) =>
                        setArticleCount(parseInt(e.target.value))
                      }
                      className="w-full accent-cyan-500 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full"
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{ background: grad }}
                    className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {generating ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Plus size={18} />
                        <span>
                          Generate {articleCount}{" "}
                          {articleCount === 1 ? "Article" : "Articles"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Queue History */}
              <div
                className={cn(
                  "rounded-3xl border overflow-hidden",
                  isDark
                    ? "bg-white/5 border-white/5"
                    : "bg-white border-slate-100 shadow-xl shadow-slate-200/40",
                )}
              >
                <div className="p-5 border-b border-white/5 flex justify-between items-center">
                  <h3
                    className={cn(
                      "text-xs font-bold uppercase tracking-widest",
                      isDark ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    Recent Jobs
                  </h3>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded-full font-bold">
                    {jobs.length}
                  </span>
                </div>
                <div className="max-h-[300px] overflow-auto divide-y divide-white/5 custom-scrollbar">
                  {jobs.length === 0 ? (
                    <div className="p-8 text-center opacity-30">
                      <Info size={32} className="mx-auto mb-2" />
                      <p className="text-[10px] font-bold uppercase">
                        No active jobs
                      </p>
                    </div>
                  ) : (
                    jobs.map((j) => (
                      <div
                        key={j._id}
                        className="p-5 hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="min-w-0 pr-4">
                            <p
                              className={cn(
                                "text-xs font-bold truncate",
                                isDark ? "text-white" : "text-slate-900",
                              )}
                            >
                              {j.title}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                              {timeAgo(j.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => cancelJob(j._id)}
                            className="text-slate-500 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full transition-all"
                              style={{ width: `${j.progress}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-cyan-500">
                            {j.progress}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(22, 163, 174, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(22, 163, 174, 0.2);
          }
        `}</style>
      </main>
    </AppLayout>
  );
}
