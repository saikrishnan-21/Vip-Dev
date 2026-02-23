"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Trash2,
  ExternalLink,
  Rss,
  Globe,
  TrendingUp,
  Layers,
} from "lucide-react";
import { AddRssDialog } from "@/components/add-rss-dialog";
import { AddWebsiteDialog } from "@/components/add-website-dialog";
import { AddTopicDialog } from "@/components/add-topic-dialog";
import { AddTrendsDialog } from "@/components/add-trends-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

interface Article {
  _id: string;
  sourceId: string;
  title: string;
  summary?: string;
  url: string;
  publishedAt?: string;
  fetchedAt?: string;
  tags?: string[];
  publishedDate: string;
  capturedDate: string;
  keywords: string[];
}

interface Source {
  id: string;
  _id: string;
  name: string;
  type: string;
  feedUrl?: string;
  websiteUrl?: string;
  url?: string;
  status: string;
  lastUpdated: string;
  articleCount: number;
}

export default function KnowledgeBasePage() {
  const { effectiveTheme } = useTheme();
  const [viewMode, setViewMode] = useState<"articles" | "sources">("articles");
  const [sources, setSources] = useState<Source[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSources, setExpandedSources] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<any>(null);

  const fetchSources = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const response = await fetch("/api/sources", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedSources = data.sources.map((s: any) => ({
            ...s,
            id: s._id,
            url: s.feedUrl || s.websiteUrl,
            status:
              s.status === "active"
                ? "Active"
                : s.status === "paused"
                  ? "Paused"
                  : "Error",
            lastUpdated: s.lastFetchedAt
              ? new Date(s.lastFetchedAt).toLocaleString()
              : "Never",
            articleCount: s.articlesCount || 0,
          }));
          setSources(formattedSources);
        }
      }
    } catch (err) {
      console.error("Sources fetch error:", err);
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      params.append("limit", "100");
      const response = await fetch(`/api/articles/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const formattedArticles = data.articles.map((a: any) => ({
            ...a,
            id: a._id,
            sourceId: a.sourceId,
            publishedDate: a.publishedAt
              ? new Date(a.publishedAt).toLocaleDateString()
              : "Unknown",
            capturedDate: a.fetchedAt
              ? new Date(a.fetchedAt).toLocaleString()
              : "Unknown",
            keywords: a.tags || [],
          }));
          setArticles(formattedArticles);
        }
      }
    } catch (err) {
      console.error("Articles fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = JSON.parse(localStorage.getItem("userProfile") || "{}");
      setProfile(p);
    }
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    const timer = setTimeout(() => fetchArticles(), 300);
    return () => clearTimeout(timer);
  }, [fetchArticles]);

  const primaryColor = profile?.primaryColor || "#1389E9";
  const secondaryColor = profile?.secondaryColor || "#0EEDCD";
  const grad = `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`;
  const isDark = effectiveTheme === "dark";

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "rss":
        return <Rss size={16} />;
      case "website":
        return <Globe size={16} />;
      case "topic":
        return <Tag size={16} />;
      case "trend":
        return <TrendingUp size={16} />;
      default:
        return <Database size={16} />;
    }
  };

  const isExpanded = (id: string) => expandedSources.includes(id);
  const toggleSource = (id: string) =>
    setExpandedSources((prev) =>
      isExpanded(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const cardCls = `rounded-2xl border transition-all ${isDark ? "bg-gray-800/30 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`;
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
              Knowledge Base
            </h1>
            <p
              className={`font-alliance ${isDark ? "text-gray-500" : "text-gray-600"}`}
            >
              The brain behind your AI-powered content strategy
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <AddRssDialog
              onSuccess={() => {
                fetchSources();
                fetchArticles();
              }}
            >
              <button
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${isDark ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-white border" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white border"}`}
              >
                <Rss size={14} /> RSS Feed
              </button>
            </AddRssDialog>
            <AddWebsiteDialog
              onSuccess={() => {
                fetchSources();
                fetchArticles();
              }}
            >
              <button
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${isDark ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-white border" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white border"}`}
              >
                <Globe size={14} /> Website
              </button>
            </AddWebsiteDialog>
            <AddTopicDialog
              onSuccess={() => {
                fetchSources();
                fetchArticles();
              }}
            >
              <button
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${isDark ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-white border" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white border"}`}
              >
                <Tag size={14} /> Topic
              </button>
            </AddTopicDialog>
            <AddTrendsDialog
              onSuccess={() => {
                fetchSources();
                fetchArticles();
              }}
            >
              <button
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 text-white hover:opacity-90 shadow-lg shadow-blue-500/10`}
                style={{ background: grad }}
              >
                <TrendingUp size={14} /> Trends
              </button>
            </AddTrendsDialog>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div
            className={`flex rounded-xl p-1 gap-1 border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-100 border-gray-200"}`}
          >
            {[
              {
                id: "articles",
                label: "Articles",
                icon: FileText,
                count: articles.length,
              },
              {
                id: "sources",
                label: "Sources",
                icon: Globe,
                count: sources.length,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setViewMode(t.id as any)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === t.id ? (isDark ? "bg-gray-700 text-blue-400" : "bg-white text-blue-600 shadow-sm") : "text-gray-500 hover:text-gray-400"}`}
              >
                <t.icon size={14} /> {t.label} ({t.count})
              </button>
            ))}
          </div>
          <div className="relative group w-full md:w-80">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${viewMode}...`}
              className={inputCls}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-blue-500">
            <Loader2 size={48} className="animate-spin mb-4" />
            <p className="font-bold uppercase tracking-[0.2em] text-xs opacity-50">
              Indexing Intelligence...
            </p>
          </div>
        ) : viewMode === "articles" ? (
          <div className="space-y-4">
            {sources
              .filter((s) => articles.some((a) => a.sourceId === s.id))
              .map((source) => {
                const sourceArticles = articles.filter(
                  (a) => a.sourceId === source.id,
                );
                const show = isExpanded(source.id);
                return (
                  <div key={source.id} className={cardCls}>
                    <button
                      onClick={() => toggleSource(source.id)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-blue-500 ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}
                        >
                          {getSourceIcon(source.type)}
                        </div>
                        <div>
                          <h3
                            className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {source.name}
                          </h3>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {sourceArticles.length} Encrypted Articles
                          </p>
                        </div>
                      </div>
                      {show ? (
                        <ChevronDown size={20} className="text-gray-500" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-500" />
                      )}
                    </button>
                    {show && (
                      <div
                        className={`px-6 pb-6 pt-0 divide-y ${isDark ? "divide-gray-800" : "divide-gray-50"}`}
                      >
                        {sourceArticles.map((article) => (
                          <div
                            key={article._id}
                            className="py-6 first:pt-4 flex flex-col md:flex-row md:items-start justify-between gap-6 group"
                          >
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start gap-4">
                                <div
                                  className={`p-2 rounded-lg ${isDark ? "bg-gray-800 text-gray-500" : "bg-gray-50 text-gray-400"} group-hover:text-blue-500 transition-colors`}
                                >
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <h4
                                    className={`text-sm font-bold mb-1 group-hover:text-blue-500 transition-colors cursor-pointer ${isDark ? "text-gray-200" : "text-gray-800"}`}
                                  >
                                    {article.title}
                                  </h4>
                                  <p
                                    className={`text-xs font-alliance line-clamp-2 leading-relaxed opacity-60 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                  >
                                    {article.summary}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar size={12} />{" "}
                                      {article.publishedDate}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <BrainCircuit size={12} /> Captured{" "}
                                      {article.capturedDate}
                                    </span>
                                    <a
                                      href={article.url}
                                      target="_blank"
                                      className="flex items-center gap-1.5 text-blue-500 hover:underline"
                                    >
                                      Link <ExternalLink size={10} />
                                    </a>
                                  </div>
                                </div>
                              </div>
                              {article.keywords &&
                                article.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pl-12">
                                    {article.keywords.map((kw) => (
                                      <span
                                        key={kw}
                                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${isDark ? "bg-gray-800 border-gray-700 text-gray-500" : "bg-gray-50 border-gray-200 text-gray-400"}`}
                                      >
                                        {kw}
                                      </span>
                                    ))}
                                  </div>
                                )}
                            </div>
                            <button
                              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"}`}
                            >
                              Use in Content
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div className={cardCls}>
            <div
              className={`divide-y ${isDark ? "divide-gray-800" : "divide-gray-50"}`}
            >
              {sources
                .filter((s) =>
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((source) => (
                  <div
                    key={source.id}
                    className="p-6 flex items-center justify-between group h-24"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${isDark ? "bg-gray-800 text-blue-400" : "bg-blue-50 text-blue-500"}`}
                      >
                        {getSourceIcon(source.type)}
                      </div>
                      <div className="min-w-0">
                        <h3
                          className={`text-base font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {source.name}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                          <span>{source.articleCount} Intelligence Bits</span>
                          <span>·</span>
                          <span>Last Refined {source.lastUpdated}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <span
                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${source.status === "Active" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                      >
                        {source.status}
                      </span>
                      <button
                        onClick={() =>
                          setDeleteDialog({ open: true, id: source.id })
                        }
                        className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Sever Intelligence Source?"
        description="This will permanently remove the source and all associated brain patterns. This action cannot be undone."
        onConfirm={async () => {
          // Delete logic here
          setDeleteDialog({ open: false, id: null });
        }}
        confirmText="Sever Connection"
        variant="destructive"
      />
    </div>
  );
}
