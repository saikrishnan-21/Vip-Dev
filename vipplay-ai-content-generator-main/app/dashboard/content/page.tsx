"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { contentAPI } from "@/api/api.service";
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
  Clock,
  ArrowUpDown,
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

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  draft: {
    bg: "bg-gray-500/10",
    text: "text-gray-500",
    dot: "bg-gray-500",
    label: "Draft",
  },
  review: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    dot: "bg-amber-500",
    label: "In Review",
  },
  approved: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
    label: "Approved",
  },
  published: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    dot: "bg-blue-500",
    label: "Published",
  },
  rejected: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    dot: "bg-red-500",
    label: "Rejected",
  },
  archived: {
    bg: "bg-gray-500/5",
    text: "text-gray-400",
    dot: "bg-gray-400",
    label: "Archived",
  },
};

export default function ContentLibrary() {
  const { effectiveTheme } = useTheme();
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

    const fetchContent = async () => {
      try {
        setLoading(true);
        const resp = await contentAPI.getContent();
        if (resp.success && resp.content) {
          setArticles(resp.content);
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
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

  const filteredArticles = articles.filter((a) => {
    const matchesSearch = a.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const cardCls = `rounded-2xl border transition-all ${isDark ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-100 shadow-sm"} p-4`;
  const inputCls = `w-full pl-11 pr-4 py-2.5 rounded-xl border outline-none transition-all font-alliance ${isDark ? "bg-[#0a0e1a] border-gray-700 text-white placeholder-gray-600 focus:border-blue-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400"}`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header
        className={`border-b px-8 py-8 ${isDark ? "bg-[#0a0e1a] border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1
              className={`text-3xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Content Management
            </h1>
            <p
              className={`font-alliance ${isDark ? "text-gray-500" : "text-gray-600"}`}
            >
              Review, manage, and scale your brand's digital presence
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group w-full md:w-72">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className={inputCls}
              />
            </div>
            <button
              className={`p-3 rounded-xl border transition-all ${isDark ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-white" : "bg-white border-gray-200 text-gray-500 hover:text-gray-900"}`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Articles",
              value: articles.length,
              icon: Layers,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Pending Review",
              value: articles.filter((a) => a.status === "review").length,
              icon: Clock,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            },
            {
              label: "Approved Items",
              value: articles.filter((a) => a.status === "approved").length,
              icon: CheckCircle2,
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
            },
            {
              label: "Published Now",
              value: articles.filter((a) => a.status === "published").length,
              icon: FileText,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
          ].map((stat) => (
            <div key={stat.label} className={cardCls}>
              <div className="flex items-center p-2 justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest text-gray-500`}
                >
                  Overview
                </span>
              </div>
              <p
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} px-2`}
              >
                {stat.value}
              </p>
              <p
                className={`text-xs font-alliance ${isDark ? "text-gray-500" : "text-gray-400"}`}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedArticles.length > 0 && (
          <div
            className={`px-6 py-4 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 ${isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100 shadow-lg shadow-blue-500/5"}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {selectedArticles.length}
              </div>
              <span
                className={`text-sm font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
              >
                Articles Selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${isDark ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-50 border"}`}
              >
                <Download size={14} /> Export
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 text-white hover:opacity-90`}
                style={{ background: grad }}
              >
                <CheckCircle2 size={14} /> Approve All
              </button>
              <button
                className={`p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className={cardCls}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className={`border-b text-[10px] font-black uppercase tracking-widest ${isDark ? "border-gray-700 text-gray-500" : "border-gray-50 text-gray-400"}`}
                >
                  <th className="px-8 py-5 w-16 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedArticles.length === filteredArticles.length &&
                        filteredArticles.length > 0
                      }
                      onChange={() =>
                        setSelectedArticles(
                          selectedArticles.length === filteredArticles.length
                            ? []
                            : filteredArticles.map((a) => a._id),
                        )
                      }
                      className="w-4 h-4 rounded border-gray-300 accent-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-5">Article Overview</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Engagement</th>
                  <th className="px-6 py-5">Generated</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDark ? "divide-gray-800/50" : "divide-gray-50"}`}
              >
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-8">
                        <div
                          className={`h-12 w-full rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
                        />
                      </td>
                    </tr>
                  ))
                ) : filteredArticles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-8 py-20 text-center opacity-40"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <Layers size={48} />
                        <p className="font-bold uppercase tracking-widest text-sm">
                          No content found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((article) => {
                    const status =
                      STATUS_CONFIG[article.status] || STATUS_CONFIG.draft;
                    return (
                      <tr
                        key={article._id}
                        className={`group transition-all ${selectedArticles.includes(article._id) ? (isDark ? "bg-blue-500/5" : "bg-blue-50/50") : "hover:bg-gray-800/10"}`}
                        onClick={() => toggleSelect(article._id)}
                      >
                        <td
                          className="px-8 py-6 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedArticles.includes(article._id)}
                            onChange={() => toggleSelect(article._id)}
                            className="w-4 h-4 rounded border-gray-300 accent-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-500 border border-gray-100"}`}
                            >
                              <FileText size={18} />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-bold truncate max-w-[320px] ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {article.title}
                              </p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter transition-all group-hover:text-blue-500">
                                {article.category} · {article.wordCount} Words
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${status.bg} ${status.text} border border-current opacity-70`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
                            />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase">
                              <span>SEO Score</span>
                              <span
                                className={
                                  article.seoScore > 80
                                    ? "text-emerald-500"
                                    : "text-amber-500"
                                }
                              >
                                {article.seoScore}%
                              </span>
                            </div>
                            <div
                              className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${article.seoScore > 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                                style={{ width: `${article.seoScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 font-alliance text-xs text-gray-500">
                          {article.createdAt}
                        </td>
                        <td
                          className="px-6 py-6 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button
                              className={`p-2 rounded-lg transition-all ${isDark ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"}`}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className={`p-2 rounded-lg transition-all ${isDark ? "text-gray-400 hover:text-white hover:bg-gray-700" : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"}`}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className={`p-2 rounded-lg transition-all ${isDark ? "text-gray-400 hover:text-red-500 hover:bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
