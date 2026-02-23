"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import AppLayout from "@/components/AppLayout";
import {
  FileText,
  Target,
  TrendingUp,
  RefreshCw,
  Settings,
  Layers,
  Feather,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Job {
  _id: string;
  title: string;
  mode: string;
  status: "processing" | "queued" | "completed" | "failed" | "cancelled";
  createdAt: string;
  articleCount: number;
  progress: number;
  queuePosition?: number;
}

interface Trend {
  keyword: string;
  volume: string;
  trend: string;
  rank: number;
  url: string | null;
  description: string;
  newsSource: string;
  relatedQueries: string[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> =
  {
    processing: {
      bg: "bg-blue-950/60",
      text: "text-blue-400",
      dot: "bg-blue-400",
    },
    queued: {
      bg: "bg-indigo-950/60",
      text: "text-indigo-400",
      dot: "bg-indigo-400",
    },
    completed: {
      bg: "bg-green-950/60",
      text: "text-green-400",
      dot: "bg-green-400",
    },
    failed: { bg: "bg-red-950/60", text: "text-red-400", dot: "bg-red-400" },
    cancelled: {
      bg: "bg-yellow-950/60",
      text: "text-yellow-400",
      dot: "bg-yellow-400",
    },
  };

const MODES = [
  {
    id: "topic",
    label: "Topic-Based",
    desc: "Generate articles from a specific topic or subject",
    icon: <FileText size={20} strokeWidth={1.5} color="currentColor" />,
  },
  {
    id: "keywords",
    label: "Keyword-Driven",
    desc: "Create SEO-optimized content from target keywords",
    icon: <Target size={20} strokeWidth={1.5} color="currentColor" />,
  },
  {
    id: "trends",
    label: "Trending Topics",
    desc: "Write about current trending topics and searches",
    icon: <TrendingUp size={20} strokeWidth={1.5} color="currentColor" />,
  },
  {
    id: "spin",
    label: "Article Spin",
    desc: "Create unique variations of existing articles",
    icon: <RefreshCw size={20} strokeWidth={1.5} color="currentColor" />,
  },
  {
    id: "freeform",
    label: "Free-form",
    desc: "Describe what you want in your own words",
    icon: <Feather size={20} strokeWidth={1.5} color="currentColor" />,
  },
];

const IconLoader = () => (
  <svg
    className="animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: "100%", height: "100%" }}
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

const IconX = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: "100%", height: "100%" }}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconRefresh = ({ spinning }: { spinning?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      width: "100%",
      height: "100%",
      animation: spinning ? "spin 1s linear infinite" : "none",
    }}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconExternal = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: "100%", height: "100%" }}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ─── Basic / Advanced Toggle ──────────────────────────────────────────────────
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
      className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all select-none ${
        isDark
          ? "bg-gray-800/70 border-gray-700 hover:border-gray-600"
          : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
      }`}
      aria-label="Toggle Basic / Advanced mode"
    >
      <span
        className={`text-sm font-alliance-semibold transition-colors ${
          !isAdvanced
            ? isDark
              ? "text-white"
              : "text-gray-900"
            : isDark
              ? "text-gray-500"
              : "text-gray-400"
        }`}
      >
        Basic
      </span>

      <span
        className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-300 ${
          isAdvanced ? "bg-blue-500" : isDark ? "bg-gray-700" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-300 flex items-center justify-center ${
            isAdvanced ? "translate-x-5 bg-white" : "translate-x-0 bg-white"
          }`}
        >
          {isAdvanced && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3 h-3"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
        </span>
      </span>

      <span
        className={`text-sm font-alliance-semibold flex items-center gap-1.5 transition-colors ${
          isAdvanced
            ? isDark
              ? "text-blue-400"
              : "text-blue-600"
            : isDark
              ? "text-gray-500"
              : "text-gray-400"
        }`}
      >
        Advanced
      </span>
    </button>
  );
}

export default function Generate() {
  const { effectiveTheme } = useTheme();

  const [mode, setMode] = useState("topic");
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [articleCount, setArticleCount] = useState(1);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    desc: string;
    variant: string;
  } | null>(null);
  const hasFetched = useRef(false);

  // SSR-safe localStorage read
  const savedTone = (() => {
    try {
      if (typeof window === "undefined") return "Professional & Informative";
      const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
      return (
        p.tone || p.writingTone || p.defaultTone || "Professional & Informative"
      );
    } catch {
      return "Professional & Informative";
    }
  })();

  const [topicForm, setTopicForm] = useState({
    topic: "",
    focus: "",
    tone: savedTone,
    description: "",
    angle: "Informational",
    audience: "General",
  });
  const [keywordsForm, setKeywordsForm] = useState({
    keywords: "",
    density: "Natural (Recommended)",
  });
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [spinForm, setSpinForm] = useState({
    sourceUrl: "",
    spinLevel: "High (70-80% unique)",
  });
  const [freeformForm, setFreeformForm] = useState({
    description: "",
    angle: "Professional",
    audience: "Expert",
  });
  const [advanced, setAdvanced] = useState({
    wordCount: "1000-1500 words",
    seo: "Maximum (Recommended)",
    structure: "Auto (AI decides)",
    purpose: "Inform",
    contentFormat: "News Article",
    distributionChannels: [] as string[],
  });

  // SSR-safe profile state
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
        setProfile(p);
      } catch {
        setProfile({});
      }
    }
  }, []);

  const primaryColor = profile?.primaryColor || "#1389E9";
  const secondaryColor = profile?.secondaryColor || "#0EEDCD";
  const grad = `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`;

  const isDark = effectiveTheme === "dark";

  const showToast = useCallback(
    (title: string, desc: string, variant = "success") => {
      setToast({ title, desc, variant });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    setTrendsError("");
    hasFetched.current = true;
    try {
      const response = await fetch("/api/trends");
      if (!response.ok) throw new Error("Failed to fetch trends");
      const data = await response.json();
      setTrends(data.trends ?? data);
    } catch (err: any) {
      setTrendsError("Failed to load trending topics. Please try again.");
      setTrends([]);
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "trends" && !hasFetched.current) fetchTrends();
    if (mode !== "trends") hasFetched.current = false;
  }, [mode, fetchTrends]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs?status=active");
        if (!response.ok) return;
        const data = await response.json();
        setJobs(data.jobs ?? data);
      } catch {
        // Silently fail
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const cancelJob = async (id: string) => {
    try {
      await fetch(`/api/jobs/${id}/cancel`, { method: "POST" });
      setJobs((prev) => prev.filter((j) => j._id !== id));
      showToast("Job Cancelled", "The generation job was cancelled.", "info");
    } catch {
      showToast("Error", "Failed to cancel job. Please try again.", "error");
    }
  };

  const handleGenerate = async () => {
    if (mode === "topic" && !topicForm.topic.trim()) {
      showToast("Validation Error", "Topic is required.", "error");
      return;
    }
    if (mode === "keywords" && !keywordsForm.keywords.trim()) {
      showToast("Validation Error", "Keywords are required.", "error");
      return;
    }
    if (mode === "trends" && !selectedTrend) {
      showToast("Validation Error", "Please select a trending topic.", "error");
      return;
    }
    if (mode === "spin" && !spinForm.sourceUrl.trim()) {
      showToast("Validation Error", "Source article URL is required.", "error");
      return;
    }
    if (mode === "freeform" && !freeformForm.description.trim()) {
      showToast("Validation Error", "Please describe what you want.", "error");
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        mode,
        articleCount,
        advanced,
        ...(mode === "topic" && {
          topic: topicForm.topic,
          focus: topicForm.focus,
          tone: topicForm.tone,
        }),
        ...(mode === "keywords" && {
          keywords: keywordsForm.keywords,
          density: keywordsForm.density,
        }),
        ...(mode === "trends" && { trend: selectedTrend }),
        ...(mode === "spin" && {
          sourceUrl: spinForm.sourceUrl,
          spinLevel: spinForm.spinLevel,
        }),
        ...(mode === "freeform" && {
          description: freeformForm.description,
          tone: freeformForm.angle,
          personality: freeformForm.audience,
        }),
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      const newJob: Job = data.job ?? data;
      setJobs((prev) => [newJob, ...prev]);
      showToast(
        articleCount > 1 ? "Bulk Generation Started" : "Generation Started",
        articleCount > 1
          ? `Generating ${articleCount} articles...`
          : "Job queued successfully.",
      );
    } catch (err: any) {
      showToast("Error", err.message || "Failed to start generation.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const inputCls = `w-full rounded-lg px-3 py-2.5 text-sm border outline-none transition-all font-alliance ${isDark ? "bg-[#0a0e1a] border-gray-700 text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20"}`;
  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`;
  const cardCls = `rounded-xl border p-6 ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`;
  const headingCls = `text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`;
  const hintCls = `text-xs font-alliance mt-1.5 ${isDark ? "text-gray-500" : "text-gray-600"}`;

  const activeCount = jobs.filter((j) => j.status === "queued").length;
  const processingCount = jobs.filter((j) => j.status === "processing").length;

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-alliance-semibold text-white transition-all ${toast.variant === "error" ? "bg-red-600" : toast.variant === "info" ? "bg-blue-600" : "bg-green-600"}`}
        >
          <p>{toast.title}</p>
          <p className="font-alliance text-xs opacity-80 mt-0.5">
            {toast.desc}
          </p>
        </div>
      )}

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header
        className={`border-b px-8 py-6 ${isDark ? "bg-[#0a0e1a] border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className={`text-3xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Generate Content
            </h1>
            <p
              className={`font-alliance ${isDark ? "text-gray-500" : "text-gray-600"}`}
            >
              Choose a generation mode and create SEO-optimized articles at
              scale
            </p>
          </div>

          <div className="flex items-center pt-1">
            <ModeToggle
              isAdvanced={isAdvanced}
              onChange={setIsAdvanced}
              isDark={isDark}
            />
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Mode Selector */}
        <div className="mb-6">
          <p
            className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? "text-gray-400" : "text-gray-700"}`}
          >
            Select Generation Template
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {MODES.map(({ id, label, desc, icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`rounded-xl border p-4 text-left transition-all ${mode === id ? (isDark ? "border-blue-500 bg-blue-500/10 shadow-[0_0_16px_rgba(59,130,246,0.12)]" : "border-blue-400 bg-blue-50") : isDark ? "border-gray-700 bg-gray-800/50 hover:border-gray-600" : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={isDark ? "text-cyan-400" : "text-blue-600"}>
                    {icon}
                  </span>
                  {mode === id && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                      ✓
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm font-bold mb-1 ${mode === id ? (isDark ? "text-blue-300" : "text-blue-700") : isDark ? "text-gray-200" : "text-gray-800"}`}
                >
                  {label}
                </p>
                <p
                  className={`text-xs font-alliance leading-snug ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Config + Advanced */}
          <div className="lg:col-span-2 flex flex-col gap-6 text-bold">
            <div className={cardCls}>
              <h2 className={`${headingCls} mb-5`}>
                {MODES.find((m) => m.id === mode)?.label} — Configuration
              </h2>

              {/* ── Topic Mode ── */}
              {mode === "topic" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelCls}>Article Topic</label>
                    <input
                      className={inputCls}
                      placeholder="e.g., Top Fantasy Football Sleepers for 2025 Season"
                      value={topicForm.topic}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          topic: e.target.value,
                        })
                      }
                    />
                    <p className={hintCls}>
                      Enter a specific topic for your article
                    </p>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Focus Area{" "}
                      <span
                        className={`normal-case font-alliance ${isDark ? "text-gray-600" : "text-gray-500"}`}
                      >
                        (optional)
                      </span>
                    </label>
                    <input
                      className={inputCls}
                      placeholder="e.g., NFL Draft, Varsity Sports"
                      value={topicForm.focus}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          focus: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* ── Keywords Mode ── */}
              {mode === "keywords" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelCls}>Keywords</label>
                    <textarea
                      className={inputCls}
                      rows={4}
                      placeholder={
                        "Enter keywords separated by commas\ne.g., fantasy football rankings, sleeper picks, draft strategy"
                      }
                      value={keywordsForm.keywords}
                      onChange={(e) =>
                        setKeywordsForm({
                          ...keywordsForm,
                          keywords: e.target.value,
                        })
                      }
                      style={{ resize: "vertical", minHeight: "100px" }}
                    />
                    <p className={hintCls}>
                      Add multiple keywords for better SEO optimization
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Keyword Density</label>
                    <select
                      className={inputCls}
                      value={keywordsForm.density}
                      onChange={(e) =>
                        setKeywordsForm({
                          ...keywordsForm,
                          density: e.target.value,
                        })
                      }
                    >
                      <option>Natural (Recommended)</option>
                      <option>Light (1-2%)</option>
                      <option>Medium (2-3%)</option>
                      <option>Heavy (3-4%)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ── Trends Mode ── */}
              {mode === "trends" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelCls} style={{ margin: 0 }}>
                      Select a Trending Topic
                    </label>
                    <button
                      onClick={fetchTrends}
                      disabled={loadingTrends}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-alliance-semibold border transition-colors disabled:opacity-50 ${isDark ? "border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-700" : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                    >
                      <span className="w-3 h-3 inline-block">
                        <IconRefresh spinning={loadingTrends} />
                      </span>{" "}
                      Refresh
                    </button>
                  </div>

                  {loadingTrends ? (
                    <div
                      className={`flex items-center justify-center gap-3 py-10 rounded-lg border ${isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50"}`}
                    >
                      <span className="w-4 h-4 text-blue-400 flex-shrink-0">
                        <IconLoader />
                      </span>
                      <span
                        className={`text-sm font-alliance ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Fetching trending topics...
                      </span>
                    </div>
                  ) : trendsError ? (
                    <div
                      className={`flex flex-col items-center justify-center py-10 gap-3 rounded-lg border ${isDark ? "border-red-800/40 bg-red-950/20" : "border-red-200 bg-red-50"}`}
                    >
                      <p
                        className={`text-sm font-alliance ${isDark ? "text-red-400" : "text-red-600"}`}
                      >
                        {trendsError}
                      </p>
                      <button
                        onClick={fetchTrends}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-alliance-semibold border transition-colors ${isDark ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                      >
                        <span className="w-3.5 h-3.5 inline-block">
                          <IconRefresh />
                        </span>{" "}
                        Retry
                      </button>
                    </div>
                  ) : trends.length === 0 ? (
                    <div
                      className={`flex flex-col items-center justify-center py-10 gap-3 rounded-lg border ${isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50"}`}
                    >
                      <p
                        className={`text-sm font-alliance ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No trending topics loaded.
                      </p>
                      <button
                        onClick={fetchTrends}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-alliance-semibold border transition-colors ${isDark ? "border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                      >
                        <span className="w-3.5 h-3.5 inline-block">
                          <IconRefresh />
                        </span>{" "}
                        Load Topics
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                      {trends.map((t) => (
                        <label
                          key={t.keyword}
                          onClick={() => setSelectedTrend(t)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedTrend?.keyword === t.keyword ? (isDark ? "border-blue-500 bg-blue-500/10" : "border-blue-400 bg-blue-50") : isDark ? "border-gray-700 bg-gray-900/30 hover:border-gray-600" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`}
                        >
                          <input
                            type="radio"
                            name="trend"
                            className="accent-blue-500"
                            checked={selectedTrend?.keyword === t.keyword}
                            onChange={() => setSelectedTrend(t)}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-alliance-semibold truncate ${isDark ? "text-gray-200" : "text-gray-800"}`}
                            >
                              {t.keyword}
                            </p>
                            {t.url && (
                              <a
                                href={t.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`text-xs font-alliance flex items-center gap-1 mt-0.5 ${isDark ? "text-gray-500 hover:text-gray-400" : "text-gray-500 hover:text-gray-700"}`}
                              >
                                <span className="w-3 h-3 flex-shrink-0">
                                  <IconExternal />
                                </span>
                                <span className="truncate">{t.url}</span>
                              </a>
                            )}
                          </div>
                          <span
                            className={`text-xs font-alliance-semibold px-2 py-0.5 rounded border flex-shrink-0 ${isDark ? "bg-blue-950/60 text-blue-400 border-blue-800/60" : "bg-blue-50 text-blue-600 border-blue-200"}`}
                          >
                            {t.volume}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Spin Mode ── */}
              {mode === "spin" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelCls}>Source Article URL</label>
                    <input
                      className={inputCls}
                      placeholder="https://example.com/article-to-spin"
                      value={spinForm.sourceUrl}
                      onChange={(e) =>
                        setSpinForm({
                          ...spinForm,
                          sourceUrl: e.target.value,
                        })
                      }
                    />
                    <p className={hintCls}>
                      Paste the URL of an article to create a unique variation
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Uniqueness Level</label>
                    <select
                      className={inputCls}
                      value={spinForm.spinLevel}
                      onChange={(e) =>
                        setSpinForm({
                          ...spinForm,
                          spinLevel: e.target.value,
                        })
                      }
                    >
                      <option>High (70-80% unique)</option>
                      <option>Medium (50-70% unique)</option>
                      <option>Inspired (30-50% unique)</option>
                    </select>
                  </div>
                  <div
                    className={`p-4 rounded-lg border text-xs font-alliance leading-relaxed ${isDark ? "bg-yellow-950/20 border-yellow-800/40 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}
                  >
                    ⚠️ Spinning creates unique variations while maintaining the
                    core message. Always review for accuracy.
                  </div>
                </div>
              )}

              {/* ── Free-form Mode ── */}
              {mode === "freeform" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className={`${labelCls} mb-0`}>
                        Free-form description
                      </label>
                      <span
                        className={`text-xs font-alliance normal-case px-1.5 py-0.5 rounded ${isDark ? "bg-gray-700 text-gray-400 border border-gray-600" : "bg-gray-100 text-gray-500 border border-gray-200"}`}
                      >
                        required
                      </span>
                    </div>
                    <textarea
                      className={inputCls}
                      rows={6}
                      placeholder="Describe what you want in your own words. Be as specific or as broad as you like — the AI will figure it out."
                      maxLength={2000}
                      value={freeformForm.description}
                      onChange={(e) =>
                        setFreeformForm({
                          ...freeformForm,
                          description: e.target.value,
                        })
                      }
                      style={{ resize: "vertical", minHeight: "140px" }}
                    />
                    <p
                      className={`text-xs font-alliance mt-1 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                    >
                      {freeformForm.description.length} / 2000 characters.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Tone</label>
                      <select
                        className={inputCls}
                        value={freeformForm.angle}
                        onChange={(e) =>
                          setFreeformForm({
                            ...freeformForm,
                            angle: e.target.value,
                          })
                        }
                      >
                        <option value="Professional">Professional</option>
                        <option value="Friendly">Friendly</option>
                        <option value="Innovative">Innovative</option>
                        <option value="Empathetic">Empathetic</option>
                        <option value="Energetic">Energetic</option>
                        <option value="Educational">Educational</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Style</label>
                      <select
                        className={inputCls}
                        value={freeformForm.audience}
                        onChange={(e) =>
                          setFreeformForm({
                            ...freeformForm,
                            audience: e.target.value,
                          })
                        }
                      >
                        <option value="Expert">The Expert</option>
                        <option value="Guide">The Guide</option>
                        <option value="Innovator">The Innovator</option>
                        <option value="Storyteller">The Storyteller</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Advanced Settings ─── */}
            <div className={`${cardCls} transition-all`}>
              <h2 className={`${headingCls} mb-6 flex items-center gap-2`}>
                <span>
                  <Settings size={20} strokeWidth={1.5} color="currentColor" />
                </span>{" "}
                Advanced Settings
              </h2>

              <div className="flex flex-col gap-6">
                {/* Purpose + Distribution Channel — 50/50 */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls} htmlFor="purpose">
                      Purpose
                    </label>
                    <select
                      id="purpose"
                      className={inputCls}
                      value={advanced.purpose}
                      onChange={(e) =>
                        setAdvanced({
                          ...advanced,
                          purpose: e.target.value,
                        })
                      }
                    >
                      {[
                        "Inform",
                        "Persuade",
                        "Entertain",
                        "Educate",
                        "Inspire",
                      ].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Distribution Channel</label>
                    <div
                      className={`flex items-center justify-around gap-x-6 ${inputCls}`}
                    >
                      {["Blog", "Newsletter", "Social"].map((channel) => (
                        <label
                          key={channel}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 accent-blue-500 cursor-pointer"
                            checked={advanced.distributionChannels.includes(
                              channel,
                            )}
                            onChange={(e) => {
                              const current = advanced.distributionChannels;
                              setAdvanced({
                                ...advanced,
                                distributionChannels: e.target.checked
                                  ? [...current, channel]
                                  : current.filter((c) => c !== channel),
                              });
                            }}
                          />
                          <span
                            className={`text-sm font-alliance ${isDark ? "text-gray-300" : "text-gray-700"}`}
                          >
                            {channel}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className={`border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}
                />

                {/* Three selects */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  {[
                    {
                      id: "wc",
                      label: "Target Word Count",
                      key: "wordCount",
                      opts: [
                        "800-1000 words",
                        "1000-1500 words",
                        "1500-2000 words",
                        "2000+ words",
                      ],
                    },
                    {
                      id: "seo",
                      label: "SEO Optimization",
                      key: "seo",
                      opts: ["Maximum (Recommended)", "Balanced", "Minimal"],
                    },
                    {
                      id: "struct",
                      label: "Content Structure",
                      key: "structure",
                      opts: [
                        "News Article",
                        "Feature",
                        "Auto (AI decides)",
                        "Listicle",
                        "How-to Guide",
                        "Analysis",
                        "Opinion",
                        "Review",
                      ],
                    },
                  ].map(({ id, label, key, opts }) => (
                    <div key={id}>
                      <label className={labelCls} htmlFor={id}>
                        {label}
                      </label>
                      <select
                        id={id}
                        className={inputCls}
                        value={(advanced as Record<string, any>)[key]}
                        onChange={(e) =>
                          setAdvanced({
                            ...advanced,
                            [key]: e.target.value,
                          })
                        }
                      >
                        {opts.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Bulk + Queue */}
          <div className="flex flex-col gap-6">
            <div className={cardCls}>
              <h2 className={`${headingCls} mb-5 flex items-center gap-2`}>
                <span>
                  <Layers size={20} strokeWidth={1.5} color="currentColor" />
                </span>{" "}
                Bulk Generation
              </h2>
              <div className="mb-4">
                <label className={labelCls}>Number of Articles</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className={inputCls}
                  value={articleCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    setArticleCount(isNaN(v) || v < 1 ? 1 : v > 50 ? 50 : v);
                  }}
                />
                <p className={hintCls}>Generate up to 50 articles at once</p>
              </div>
              <div
                className={`rounded-lg p-3 mb-5 border ${isDark ? "bg-[#0a0e1a] border-gray-700" : "bg-gray-50 border-gray-200"}`}
              >
                {[
                  {
                    label: "Estimated time",
                    value: `${articleCount * 2} min`,
                  },
                  { label: "Total articles", value: String(articleCount) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1">
                    <span
                      className={`text-xs font-alliance ${isDark ? "text-gray-500" : "text-gray-600"}`}
                    >
                      {label}
                    </span>
                    <span
                      className={`text-xs font-alliance-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-lg text-white font-alliance-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: grad }}
              >
                {generating ? (
                  <>
                    <span className="w-4 h-4 flex-shrink-0">
                      <IconLoader />
                    </span>
                    Starting...
                  </>
                ) : (
                  <>
                    Generate {articleCount}{" "}
                    {articleCount === 1 ? "Article" : "Articles"}
                  </>
                )}
              </button>
              <p
                className={`text-xs font-alliance text-center mt-3 ${isDark ? "text-gray-600" : "text-gray-500"}`}
              >
                You'll be notified when generation is complete
              </p>
            </div>

            {/* Queue */}
            <div className={cardCls}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={headingCls}>Queue Jobs</h2>
                {jobs.length > 0 && (
                  <span
                    className={`text-xs font-alliance-semibold px-2 py-0.5 rounded border ${isDark ? "bg-blue-950/60 text-blue-400 border-blue-800/60" : "bg-blue-50 text-blue-600 border-blue-200"}`}
                  >
                    {activeCount} queued · {processingCount} running
                  </span>
                )}
              </div>
              {jobs.length === 0 ? (
                <div
                  className={`flex items-center justify-center py-8 rounded-lg border ${isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50"}`}
                >
                  <p
                    className={`text-sm font-alliance ${isDark ? "text-gray-500" : "text-gray-600"}`}
                  >
                    No active jobs. Queue is empty.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {jobs.map((j) => {
                    const s = STATUS_CONFIG[j.status] || STATUS_CONFIG.queued;
                    return (
                      <div
                        key={j._id}
                        className={`p-3 rounded-lg border ${isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50"}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p
                            className={`text-xs font-alliance-semibold truncate flex-1 ${isDark ? "text-gray-200" : "text-gray-800"}`}
                          >
                            {j.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className={`flex items-center gap-1 text-xs font-alliance-semibold px-2 py-0.5 rounded ${s.bg} ${s.text}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`}
                              />
                              {j.status}
                            </span>
                            {(j.status === "queued" ||
                              j.status === "processing") && (
                              <button
                                onClick={() => cancelJob(j._id)}
                                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${isDark ? "text-gray-500 hover:text-red-400 hover:bg-red-950/30" : "text-gray-500 hover:text-red-500 hover:bg-red-50"}`}
                              >
                                <span className="w-3 h-3">
                                  <IconX />
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs font-alliance ${isDark ? "text-gray-500" : "text-gray-600"}`}
                          >
                            {j.articleCount}{" "}
                            {j.articleCount === 1 ? "article" : "articles"} ·{" "}
                            {timeAgo(j.createdAt)}
                          </span>
                          {j.status === "queued" && j.queuePosition && (
                            <span
                              className={`text-xs font-alliance-semibold ${isDark ? "text-indigo-400" : "text-indigo-500"}`}
                            >
                              #{j.queuePosition}
                            </span>
                          )}
                          {j.status === "processing" &&
                            j.progress !== undefined && (
                              <span
                                className={`text-xs font-alliance-semibold ${isDark ? "text-blue-400" : "text-blue-500"}`}
                              >
                                {j.progress}%
                              </span>
                            )}
                        </div>
                        {j.status === "processing" &&
                          j.progress !== undefined && (
                            <div
                              className={`mt-2 h-1 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${j.progress}%`,
                                  background: grad,
                                }}
                              />
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
