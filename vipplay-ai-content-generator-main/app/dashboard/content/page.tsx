"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import AppLayout from "@/components/AppLayout";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  MoreVertical,
  ChevronRight,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContentItem {
  _id: string;
  title: string;
  status:
    | "draft"
    | "review"
    | "approved"
    | "published"
    | "archived"
    | "rejected";
  wordCount: number;
  seoScore: number;
  createdAt: string;
  category: string;
}

const STATUS_COLORS = {
  draft: "text-slate-500 bg-slate-500/10 border-slate-500/20",
  review: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  approved: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  published: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  rejected: "text-red-500 bg-red-500/10 border-red-500/20",
  archived: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

export default function ContentLibrary() {
  const { effectiveTheme } = useTheme();
  const { sidebarOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
      setProfile(p);
    }

    // Simulate fetching content
    setTimeout(() => {
      setArticles([
        {
          _id: "1",
          title: "The Future of AI Content Generation",
          status: "published",
          wordCount: 1250,
          seoScore: 94,
          createdAt: "2024-02-15",
          category: "Technology",
        },
        {
          _id: "2",
          title: "10 Tips for Better Prompt Engineering",
          status: "approved",
          wordCount: 850,
          seoScore: 88,
          createdAt: "2024-02-18",
          category: "Tutorial",
        },
        {
          _id: "3",
          title: "Why Sustainable Energy Matters",
          status: "review",
          wordCount: 1500,
          seoScore: 91,
          createdAt: "2024-02-20",
          category: "Environment",
        },
        {
          _id: "4",
          title: "Modern Web Design Trends 2024",
          status: "draft",
          wordCount: 1100,
          seoScore: 75,
          createdAt: "2024-02-20",
          category: "Design",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const primaryColor = profile?.primaryColor || "#1389E9";
  const secondaryColor = profile?.secondaryColor || "#0EEDCD";
  const grad = `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`;
  const isDark = effectiveTheme === "dark";

  const toggleSelect = (id: string) => {
    setSelectedArticles((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
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
            "sticky top-0 z-30 px-8 py-6 border-b backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6",
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
              Content Management
            </h1>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Review, manage, and refine your generated articles
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative group w-full md:w-64",
                isDark ? "text-slate-500" : "text-slate-400",
              )}
            >
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className={cn(
                  "w-full pl-12 pr-6 py-2.5 rounded-xl border-2 outline-none text-sm font-medium transition-all",
                  isDark
                    ? "bg-white/5 border-white/5 focus:border-cyan-500/50"
                    : "bg-slate-50 border-slate-100 focus:border-cyan-500/50",
                )}
              />
            </div>
            <button
              className={cn(
                "p-3 rounded-xl border-2 transition-all",
                isDark
                  ? "bg-white/5 border-white/5 hover:border-white/10 text-slate-400"
                  : "bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-500",
              )}
            >
              <Filter size={18} />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Articles",
                value: articles.length,
                icon: Layers,
                color: "text-cyan-500",
              },
              {
                label: "Pending Review",
                value: articles.filter((a) => a.status === "review").length,
                icon: Clock,
                color: "text-amber-500",
              },
              {
                label: "Approved",
                value: articles.filter((a) => a.status === "approved").length,
                icon: CheckCircle2,
                color: "text-emerald-500",
              },
              {
                label: "Published",
                value: articles.filter((a) => a.status === "published").length,
                icon: FileText,
                color: "text-cyan-500",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "p-6 rounded-2xl border-2",
                  isDark
                    ? "bg-white/[0.02] border-white/5"
                    : "bg-white border-slate-100 shadow-sm",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest text-slate-500",
                    )}
                  >
                    {stat.label}
                  </span>
                  <stat.icon size={16} className={stat.color} />
                </div>
                <p
                  className={cn(
                    "text-2xl font-black",
                    isDark ? "text-white" : "text-slate-900",
                  )}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Bulk Actions Bar */}
          {selectedArticles.length > 0 && (
            <div
              className={cn(
                "px-6 py-4 rounded-2xl border-2 flex items-center justify-between gap-6 animate-in slide-in-from-bottom-4",
                isDark
                  ? "bg-cyan-500/10 border-cyan-500/20"
                  : "bg-cyan-50 border-cyan-500/20 shadow-lg shadow-cyan-500/5",
              )}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-black text-cyan-500 uppercase tracking-widest">
                  {selectedArticles.length} Selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold uppercase transition-all flex items-center gap-2">
                  <Download size={14} /> Export
                </button>
                <button className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold uppercase transition-all flex items-center gap-2">
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-bold uppercase transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Content Table/Grid */}
          <div
            className={cn(
              "rounded-3xl border-2 overflow-hidden",
              isDark
                ? "bg-white/[0.02] border-white/5"
                : "bg-white border-slate-100 shadow-xl shadow-slate-200/40",
            )}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className={cn(
                      "border-b text-[10px] font-black uppercase tracking-[0.2em]",
                      isDark
                        ? "border-white/5 text-slate-500"
                        : "border-slate-50 text-slate-400",
                    )}
                  >
                    <th className="px-8 py-5 w-16">
                      <input
                        type="checkbox"
                        checked={selectedArticles.length === articles.length}
                        onChange={() =>
                          setSelectedArticles(
                            selectedArticles.length === articles.length
                              ? []
                              : articles.map((a) => a._id),
                          )
                        }
                        className="w-4 h-4 rounded border-slate-300 accent-cyan-500"
                      />
                    </th>
                    <th className="px-8 py-5">Article Title</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Word Count</th>
                    <th className="px-8 py-5 text-center">SEO Score</th>
                    <th className="px-8 py-5">Date</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody
                  className={cn(
                    "divide-y",
                    isDark ? "divide-white/5" : "divide-slate-50",
                  )}
                >
                  {loading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td
                          colSpan={7}
                          className="px-8 py-6 h-16 bg-white/5 opacity-20 mr-4"
                        />
                      </tr>
                    ))
                  ) : articles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest opacity-30"
                      >
                        No content found
                      </td>
                    </tr>
                  ) : (
                    articles.map((article) => (
                      <tr
                        key={article._id}
                        className={cn(
                          "group hover:bg-cyan-500/[0.02] transition-colors cursor-pointer",
                          selectedArticles.includes(article._id) &&
                            (isDark ? "bg-cyan-500/5" : "bg-cyan-50/50"),
                        )}
                        onClick={() => toggleSelect(article._id)}
                      >
                        <td
                          className="px-8 py-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedArticles.includes(article._id)}
                            onChange={() => toggleSelect(article._id)}
                            className="w-4 h-4 rounded border-slate-300 accent-cyan-500"
                          />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p
                                className={cn(
                                  "text-sm font-bold truncate max-w-[300px]",
                                  isDark ? "text-white" : "text-slate-900",
                                )}
                              >
                                {article.title}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                                {article.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span
                            className={cn(
                              "text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-full border",
                              STATUS_COLORS[article.status],
                            )}
                          >
                            {article.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-medium text-slate-500">
                          {article.wordCount} words
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={cn(
                                "text-sm font-black",
                                article.seoScore > 90
                                  ? "text-emerald-500"
                                  : article.seoScore > 70
                                    ? "text-amber-500"
                                    : "text-red-400",
                              )}
                            >
                              {article.seoScore}
                            </span>
                            <div className="w-12 h-1 bg-slate-200 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full",
                                  article.seoScore > 90
                                    ? "bg-emerald-500"
                                    : "bg-amber-500",
                                )}
                                style={{ width: `${article.seoScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                          {article.createdAt}
                        </td>
                        <td
                          className="px-8 py-6 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-lg bg-white/10 hover:bg-cyan-500 text-slate-400 hover:text-white transition-all">
                              <Edit size={16} />
                            </button>
                            <button className="p-2 rounded-lg bg-white/10 hover:bg-red-500 text-slate-400 hover:text-white transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
