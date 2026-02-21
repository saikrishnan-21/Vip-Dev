"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import AppLayout from "@/components/AppLayout";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  GalleryHorizontal,
  ClipboardList,
  Image as ImageIcon,
  Plus,
  X,
  ExternalLink,
  Search,
  Loader2,
  Trash2,
  Download,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Asset {
  id: string;
  type: string;
  url: string;
  thumbnail: string;
  title: string;
  model: string;
  prompt: string;
  dimensions: string;
  generatedAt: string;
}

interface QueueJob {
  _id: string;
  prompt: string;
  status: "queued" | "processing" | "completed";
  progress: number;
}

const ASPECT_PRESETS = [
  { label: "Instagram Post", ratio: "1:1", value: "square" },
  { label: "Vertical Reel", ratio: "9:16", value: "portrait" },
  { label: "Blog Header", ratio: "16:9", value: "landscape" },
  { label: "Cinematic", ratio: "21:9", value: "wide" },
];

export default function MediaLibrary() {
  const { effectiveTheme } = useTheme();
  const { sidebarOpen } = useSidebar();
  const [activeTab, setActiveTab] = useState<"library" | "queue">("library");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([]);

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

  const handleGenerate = (prompt: string) => {
    setGenerateOpen(false);
    const jobId = `job_${Date.now()}`;
    setQueueJobs([
      { _id: jobId, prompt, status: "processing", progress: 10 },
      ...queueJobs,
    ]);

    // Simulate completion
    setTimeout(() => {
      setQueueJobs((prev) => prev.filter((j) => j._id !== jobId));
      const seed = Date.now();
      const newAsset: Asset = {
        id: `gen_${seed}`,
        type: "image",
        url: `https://picsum.photos/seed/${seed}/1280/720`,
        thumbnail: `https://picsum.photos/seed/${seed}/640/360`,
        title: "AI Concept Art",
        model: "flux-pro-1.1",
        prompt,
        dimensions: "1280x720",
        generatedAt: new Date().toLocaleDateString(),
      };
      setAssets((prev) => [newAsset, ...prev]);
    }, 4000);
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
              Media Library
            </h1>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-slate-400" : "text-slate-500",
              )}
            >
              Manage and generate visual assets
            </p>
          </div>
          <button
            onClick={() => setGenerateOpen(true)}
            style={{ background: grad }}
            className="px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={20} /> Generate New Asset
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div
              className={cn(
                "p-1 rounded-xl border flex gap-1",
                isDark
                  ? "bg-white/5 border-white/5"
                  : "bg-white border-slate-200",
              )}
            >
              <button
                onClick={() => setActiveTab("library")}
                className={cn(
                  "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  activeTab === "library"
                    ? isDark
                      ? "bg-white/10 text-cyan-400"
                      : "bg-slate-100 text-cyan-600"
                    : "text-slate-500 hover:text-slate-400",
                )}
              >
                <GalleryHorizontal size={14} /> Library
              </button>
              <button
                onClick={() => setActiveTab("queue")}
                className={cn(
                  "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  activeTab === "queue"
                    ? isDark
                      ? "bg-white/10 text-cyan-400"
                      : "bg-slate-100 text-cyan-600"
                    : "text-slate-500 hover:text-slate-400",
                )}
              >
                <ClipboardList size={14} /> Active Queue
                {queueJobs.length > 0 && (
                  <span className="bg-cyan-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {queueJobs.length}
                  </span>
                )}
              </button>
            </div>

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
                placeholder="Search assets..."
                className={cn(
                  "w-full pl-12 pr-6 py-2.5 rounded-xl border-2 outline-none text-sm font-medium",
                  isDark
                    ? "bg-white/5 border-white/5 focus:border-cyan-500/50"
                    : "bg-white border-slate-100 focus:border-cyan-500/50",
                )}
              />
            </div>
          </div>

          {/* Content Grid */}
          {activeTab === "library" ? (
            assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <ImageIcon size={64} strokeWidth={1} className="mb-4" />
                <p className="font-bold uppercase tracking-widest">
                  Library Empty
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setPreviewAsset(asset)}
                    className={cn(
                      "group rounded-2xl border-2 overflow-hidden cursor-pointer transition-all",
                      isDark
                        ? "bg-white/5 border-white/5 hover:border-cyan-500/50"
                        : "bg-white border-slate-100 hover:border-cyan-500/50 shadow-sm",
                    )}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-black/20">
                      <img
                        src={asset.thumbnail}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <div className="p-2 rounded-lg bg-white/20 text-white hover:bg-cyan-500 transition-colors">
                          <Maximize2 size={18} />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p
                        className={cn(
                          "text-xs font-bold truncate",
                          isDark ? "text-white" : "text-slate-900",
                        )}
                      >
                        {asset.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] font-black uppercase tracking-tighter bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded">
                          {asset.model.split("-")[0]}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          {asset.dimensions}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {queueJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-20">
                  <ClipboardList size={64} strokeWidth={1} className="mb-4" />
                  <p className="font-bold uppercase tracking-widest">
                    Queue Clear
                  </p>
                </div>
              ) : (
                queueJobs.map((job) => (
                  <div
                    key={job._id}
                    className={cn(
                      "p-6 rounded-2xl border flex items-center gap-6",
                      isDark
                        ? "bg-white/5 border-white/5"
                        : "bg-white border-slate-100 shadow-sm",
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 animate-pulse">
                      <ImageIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-bold truncate mb-2",
                          isDark ? "text-white" : "text-slate-900",
                        )}
                      >
                        {job.prompt}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-cyan-500 uppercase">
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg text-slate-500 hover:bg-white/5 transition-all">
                      <X size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Generate Modal */}
        {generateOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
            <div
              className={cn(
                "w-full max-w-xl rounded-3xl border p-8 shadow-2xl relative",
                isDark
                  ? "bg-[#05070f] border-white/10"
                  : "bg-white border-slate-200",
              )}
            >
              <button
                onClick={() => setGenerateOpen(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>
              <h2
                className={cn(
                  "text-2xl font-bold mb-8",
                  isDark ? "text-white" : "text-slate-900",
                )}
              >
                New Generation
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                    Prompt Description
                  </label>
                  <textarea
                    id="asset_prompt"
                    placeholder="Cinematic sunset over a cyberpunk city, ultra detailed..."
                    className={cn(
                      "w-full h-32 p-6 rounded-2xl border-2 outline-none font-medium",
                      isDark
                        ? "bg-white/5 border-white/5 focus:border-cyan-500/50 text-white"
                        : "bg-slate-50 border-slate-100 focus:border-cyan-500/50",
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                      Aspect Ratio
                    </label>
                    <select
                      className={cn(
                        "w-full h-12 px-6 rounded-xl border-2 outline-none",
                        isDark
                          ? "bg-white/5 border-white/5 text-white"
                          : "bg-slate-50 border-slate-100",
                      )}
                    >
                      {ASPECT_PRESETS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.ratio} ({p.label})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                      Model
                    </label>
                    <select
                      className={cn(
                        "w-full h-12 px-6 rounded-xl border-2 outline-none",
                        isDark
                          ? "bg-white/5 border-white/5 text-white"
                          : "bg-slate-50 border-slate-100",
                      )}
                    >
                      <option>Flux Pro 1.1</option>
                      <option>DALL-E 3</option>
                      <option>Stable Diffusion XL</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleGenerate(
                      (
                        document.getElementById(
                          "asset_prompt",
                        ) as HTMLTextAreaElement
                      )?.value || "New Asset",
                    )
                  }
                  style={{ background: grad }}
                  className="w-full py-4 rounded-2xl text-white font-bold text-lg"
                >
                  Start Generation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewAsset && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-8"
            onClick={() => setPreviewAsset(null)}
          >
            <div
              className="max-w-6xl w-full h-full flex flex-col items-center justify-center gap-8"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewAsset.url}
                className="max-w-full max-h-[70vh] rounded-3xl object-contain shadow-2xl"
              />
              <div className="flex flex-col items-center text-center max-w-3xl">
                <h2 className="text-white text-3xl font-bold mb-4">
                  {previewAsset.title}
                </h2>
                <p className="text-slate-400 text-lg mb-8">
                  {previewAsset.prompt}
                </p>
                <div className="flex gap-4">
                  <button className="px-8 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-2">
                    <Download size={20} /> Download
                  </button>
                  <button className="px-8 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                    <Trash2 size={20} /> Delete
                  </button>
                </div>
              </div>
            </div>
            <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-all">
              <X size={40} />
            </button>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
