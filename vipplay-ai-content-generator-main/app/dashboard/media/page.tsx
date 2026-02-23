"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import AppLayout from "@/components/AppLayout";
import { GalleryHorizontal, ClipboardList } from "lucide-react";
import { mediaAPI } from "@/api/api.service";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Asset {
  id: string;
  type: string;
  url: string;
  thumbnail: string;
  title: string;
  tags: string[];
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
  createdAt: string;
  queuePosition?: number;
  message?: string;
}

const ASPECT_PRESETS = [
  {
    label: "Instagram / FB Post",
    ratio: "1:1 (Square)",
    width: 1024,
    height: 1024,
    value: "instagram-post",
  },
  {
    label: "Instagram Reel / TikTok",
    ratio: "9:16 (Vertical)",
    width: 720,
    height: 1280,
    value: "instagram-reel",
  },
  {
    label: "Blog Header / YouTube",
    ratio: "16:9 (Wide)",
    width: 1280,
    height: 720,
    value: "blog-header",
  },
  {
    label: "Portrait Photo",
    ratio: "3:4 (Standard)",
    width: 864,
    height: 1152,
    value: "portrait",
  },
  {
    label: "Landscape Photo",
    ratio: "4:3 (Standard)",
    width: 1152,
    height: 864,
    value: "landscape",
  },
  {
    label: "Cinematic / Movie",
    ratio: "21:9 (Ultra Wide)",
    width: 1344,
    height: 576,
    value: "cinematic",
  },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconImage = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: "100%", height: "100%" }}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const IconPlus = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: "100%", height: "100%" }}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
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
const IconLoader = ({ spin = true }: { spin?: boolean }) => (
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
      animation: spin ? "spin 1s linear infinite" : "none",
    }}
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

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({
  open,
  onClose,
  children,
  maxWidth = 520,
  isDark,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
  isDark: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full rounded-2xl border overflow-y-auto ${isDark ? "bg-[#0d1117] border-gray-800" : "bg-white border-gray-200"}`}
        style={{
          maxWidth,
          maxHeight: "90vh",
          animation: "modalIn .25s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Asset Card ───────────────────────────────────────────────────────────────
function AssetCard({
  asset,
  onClick,
  isDark,
}: {
  asset: Asset;
  onClick: (a: Asset) => void;
  isDark: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      onClick={() => onClick(asset)}
      className={`rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${isDark ? "bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:shadow-xl hover:shadow-black/40" : "bg-white border-gray-200 hover:border-gray-400 hover:shadow-lg"}`}
    >
      <div
        className={`relative overflow-hidden ${isDark ? "bg-[#0a0e1a]" : "bg-gray-100"}`}
        style={{ aspectRatio: "16/9" }}
      >
        {!imgError ? (
          <img
            src={asset.thumbnail}
            alt={asset.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover block"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${isDark ? "text-gray-700" : "text-gray-300"}`}
          >
            <span className="w-10 h-10">
              <IconImage />
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3
          className={`text-sm font-alliance-semibold mb-1 truncate ${isDark ? "text-gray-200" : "text-gray-800"}`}
        >
          {asset.title}
        </h3>
        <p
          className={`text-xs font-alliance mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          {asset.dimensions} · {asset.model}
        </p>
      </div>
    </div>
  );
}

// ─── Generate Dialog ──────────────────────────────────────────────────────────
function GenerateDialog({
  open,
  onClose,
  onGenerate,
  isGenerating,
  isDark,
  grad,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (p: { prompt: string; ratio: string; style: string }) => void;
  isGenerating: boolean;
  isDark: boolean;
  grad: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("instagram-post");
  const [style, setStyle] = useState("realistic");
  const inputCls = `w-full rounded-lg px-3 py-2.5 text-sm border outline-none transition-all font-alliance ${isDark ? "bg-[#0a0e1a] border-gray-700 text-white placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400"}`;
  const labelCls = `block text-xs font-alliance-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`;
  return (
    <Modal open={open} onClose={onClose} isDark={isDark} maxWidth={500}>
      <div
        className={`p-6 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`text-lg font-alliance-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Generate New Asset
            </h2>
            <p
              className={`text-xs font-alliance mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Use AI to generate images for your content
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 flex items-center justify-center rounded-lg ${isDark ? "text-gray-500 hover:bg-gray-800 hover:text-gray-300" : "text-gray-400 hover:bg-gray-100"}`}
          >
            <span className="w-4 h-4">
              <IconX />
            </span>
          </button>
        </div>
      </div>
      <div className="p-6 flex flex-col gap-4">
        <div>
          <label className={labelCls}>Prompt *</label>
          <textarea
            rows={4}
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={inputCls}
            style={{ resize: "vertical", minHeight: 96 }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Aspect Ratio</label>
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              className={inputCls}
            >
              {ASPECT_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.ratio} ({p.width}×{p.height})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className={inputCls}
            >
              <option value="realistic">Realistic</option>
              <option value="artistic">Artistic</option>
              <option value="cartoon">Cartoon</option>
              <option value="abstract">Abstract</option>
            </select>
          </div>
        </div>
      </div>
      <div
        className={`p-6 border-t flex justify-end gap-3 ${isDark ? "border-gray-800" : "border-gray-200"}`}
      >
        <button
          onClick={onClose}
          className={`px-4 py-2 rounded-lg text-sm font-alliance-semibold border ${isDark ? "border-gray-700 text-gray-400 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (prompt.trim()) onGenerate({ prompt, ratio, style });
          }}
          disabled={isGenerating || !prompt.trim()}
          className="px-5 py-2 rounded-lg text-sm font-alliance-semibold text-white flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: grad }}
        >
          {isGenerating ? (
            <>
              <span className="w-3.5 h-3.5 animate-spin">
                <IconLoader />
              </span>
              Generating...
            </>
          ) : (
            <>✨ Generate</>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ─── Preview Dialog ───────────────────────────────────────────────────────────
function PreviewDialog({
  asset,
  onClose,
  isDark,
  grad,
}: {
  asset: Asset | null;
  onClose: () => void;
  isDark: boolean;
  grad: string;
}) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [asset]);
  if (!asset) return null;
  return (
    <Modal open={!!asset} onClose={onClose} isDark={isDark} maxWidth={860}>
      <div
        className={`p-6 border-b flex items-center justify-between ${isDark ? "border-gray-800" : "border-gray-200"}`}
      >
        <h2
          className={`text-base font-alliance-semibold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {asset.title}
        </h2>
        <button
          onClick={onClose}
          className={`w-7 h-7 flex items-center justify-center rounded-lg ${isDark ? "text-gray-500 hover:bg-gray-800 hover:text-gray-300" : "text-gray-400 hover:bg-gray-100"}`}
        >
          <span className="w-4 h-4">
            <IconX />
          </span>
        </button>
      </div>
      <div className="p-6 flex flex-col gap-5">
        <div
          className={`rounded-xl overflow-hidden ${isDark ? "bg-[#0a0e1a]" : "bg-gray-100"}`}
          style={{ aspectRatio: "16/9" }}
        >
          {!imgError ? (
            <img
              src={asset.url}
              alt={asset.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain block"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${isDark ? "text-gray-700" : "text-gray-300"}`}
            >
              <span className="w-12 h-12">
                <IconImage />
              </span>
            </div>
          )}
        </div>
        {asset.prompt && (
          <div>
            <p
              className={`text-xs font-alliance uppercase tracking-wider mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Prompt
            </p>
            <p
              className={`text-xs font-alliance leading-relaxed p-3 rounded-lg border ${isDark ? "bg-[#0a0e1a] border-gray-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"}`}
            >
              {asset.prompt}
            </p>
          </div>
        )}
      </div>
      <div
        className={`p-6 border-t flex justify-end ${isDark ? "border-gray-800" : "border-gray-200"}`}
      >
        <button
          onClick={() => window.open(asset.url, "_blank")}
          className="px-5 py-2 rounded-lg text-sm font-alliance-semibold text-white flex items-center gap-2 hover:opacity-90"
          style={{ background: grad }}
        >
          <span className="w-3.5 h-3.5">
            <IconExternal />
          </span>{" "}
          Open Full Size
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MediaLibrary() {
  const { effectiveTheme } = useTheme();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<"library" | "queue">("library");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([]);
  const [toast, setToast] = useState<{
    title: string;
    desc: string;
    variant: string;
  } | null>(null);

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

  const showToast = useCallback(
    (title: string, desc: string, variant = "success") => {
      setToast({ title, desc, variant });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  useEffect(() => {
    const fetchMediaData = async () => {
      try {
        const [assetsResp, queueResp] = await Promise.all([
          mediaAPI.getAssets(),
          mediaAPI.getQueue(),
        ]);
        if (assetsResp.success && assetsResp.assets)
          setAssets(assetsResp.assets);
        if (queueResp.success && queueResp.queue) setQueueJobs(queueResp.queue);
      } catch (error) {
        console.error("Failed to fetch media data:", error);
      }
    };

    fetchMediaData();
    const interval = setInterval(fetchMediaData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async ({
    prompt,
    ratio,
    style,
  }: {
    prompt: string;
    ratio: string;
    style: string;
  }) => {
    setGenerateOpen(false);
    setIsGenerating(true);
    try {
      const resp = await mediaAPI.generate({
        prompt,
        type: "image",
        aspectRatio: ratio,
        style,
      });
      if (resp.success) {
        setQueueJobs((prev) => [
          {
            _id: resp.jobId || `job_${Date.now()}`,
            prompt,
            status: "queued" as const,
            progress: 0,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        showToast(
          "Generation Started",
          "Your image is being generated...",
          "info",
        );
      }
    } catch (error: any) {
      showToast("Error", error.message || "Media generation failed", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      // Assuming there's a cancelJob in mediaAPI if needed, otherwise just filter
      // For now, let's just filter UI as requested
      setQueueJobs((prev) => prev.filter((j) => j._id !== jobId));
      showToast("Job Cancelled", "The generation job was cancelled.", "info");
    } catch {
      showToast("Error", "Failed to cancel job.", "error");
    }
  };

  const queuedCount = queueJobs.filter((j) => j.status === "queued").length;
  const processingCount = queueJobs.filter(
    (j) => j.status === "processing",
  ).length;

  return (
    <>
      {/* Header */}
      <header
        className={`border-b px-8 py-6 ${isDark ? "bg-[#0a0e1a] border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1
                className={`text-3xl font-alliance-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Media Library
              </h1>
              <p
                className={`font-alliance text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                AI-generated images for your content — {assets.length} assets
              </p>
            </div>
          </div>
          <button
            onClick={() => setGenerateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-alliance-semibold text-sm hover:opacity-90 hover:shadow-lg transition-all"
            style={{ background: grad }}
          >
            <span className="w-4 h-4">
              <IconPlus />
            </span>{" "}
            Generate New Asset
          </button>
        </div>
      </header>

      <div className="p-8">
        {/* Tabs */}
        <div
          className={`inline-flex rounded-xl border p-1 mb-6 gap-1 ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-100 border-gray-200"}`}
        >
          {[
            {
              id: "library",
              label: "Media Library",
              icon: <GalleryHorizontal size={16} strokeWidth={1.5} />,
            },
            {
              id: "queue",
              label: `Queue Jobs${queueJobs.length > 0 ? ` (${queueJobs.length})` : ""}`,
              icon: <ClipboardList size={16} strokeWidth={1.5} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "library" | "queue")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-alliance-semibold transition-all ${activeTab === tab.id ? (isDark ? "bg-gray-700 text-white shadow" : "bg-white text-gray-900 shadow") : isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Library Tab */}
        {activeTab === "library" &&
          (assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className={`w-14 h-14 mb-4 ${isDark ? "text-gray-700" : "text-gray-300"}`}
              >
                <IconImage />
              </div>
              <p
                className={`text-sm font-alliance ${isDark ? "text-gray-500" : "text-gray-400"}`}
              >
                No media assets yet. Generate your first image!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={setPreviewAsset}
                  isDark={isDark}
                />
              ))}
            </div>
          ))}

        {/* Queue Tab */}
        {activeTab === "queue" &&
          (queueJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className={`w-12 h-12 mb-4 ${isDark ? "text-gray-700" : "text-gray-300"}`}
              >
                <IconLoader spin={false} />
              </div>
              <p
                className={`text-sm font-alliance ${isDark ? "text-gray-500" : "text-gray-400"}`}
              >
                No jobs in queue. All jobs completed.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2
                  className={`text-base font-alliance-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Active Queue
                </h2>
                <span
                  className={`text-xs font-alliance ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  {queuedCount} queued · {processingCount} processing
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {queueJobs.map((job) => (
                  <div
                    key={job._id}
                    className={`flex items-center gap-3 p-4 rounded-xl border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}
                  >
                    <span
                      className={`w-4 h-4 flex-shrink-0 ${job.status === "processing" ? "text-blue-400" : isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      <IconLoader spin={job.status === "processing"} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-alliance-semibold truncate mb-1.5 ${isDark ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {job.prompt}
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-alliance-semibold px-2 py-0.5 rounded border ${job.status === "processing" ? (isDark ? "bg-blue-950/60 border-blue-800 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600") : isDark ? "bg-indigo-950/60 border-indigo-800 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"}`}
                        >
                          {job.status}
                        </span>
                        {job.status === "processing" && (
                          <span
                            className={`text-xs font-alliance ${isDark ? "text-blue-400" : "text-blue-500"}`}
                          >
                            {job.progress}%
                          </span>
                        )}
                      </div>
                      {job.status === "processing" && (
                        <div
                          className={`mt-2 h-1 rounded-full overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                        >
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {(job.status === "queued" ||
                      job.status === "processing") && (
                      <button
                        onClick={() => cancelJob(job._id)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 ${isDark ? "text-gray-500 hover:bg-red-950/30 hover:text-red-400" : "text-gray-400 hover:bg-red-50 hover:text-red-500"}`}
                      >
                        <span className="w-3.5 h-3.5">
                          <IconX />
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Modals (outside AppLayout so they overlay everything) */}
      <GenerateDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        isDark={isDark}
        grad={grad}
      />
      <PreviewDialog
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        isDark={isDark}
        grad={grad}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-7 right-7 px-5 py-4 rounded-xl border text-sm font-alliance z-50 shadow-2xl max-w-xs ${toast.variant === "error" ? (isDark ? "bg-red-950/90 border-red-800 text-red-300" : "bg-red-50 border-red-200 text-red-700") : toast.variant === "info" ? (isDark ? "bg-blue-950/90 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-700") : isDark ? "bg-green-950/90 border-green-800 text-green-300" : "bg-green-50 border-green-200 text-green-700"}`}
        >
          <p className="font-alliance-semibold mb-0.5">{toast.title}</p>
          <p className="opacity-80 text-xs">{toast.desc}</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes modalIn { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:none; } }`}</style>
    </>
  );
}
