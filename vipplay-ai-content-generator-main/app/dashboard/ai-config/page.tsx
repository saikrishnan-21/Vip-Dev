"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Server,
  Cloud,
  Network,
  Database,
  Users,
  Download,
  Upload,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ShieldCheck,
  BrainCircuit,
  Zap,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CONFIG_SECTIONS = [
  { id: "ollama", icon: Server, title: "Ollama", desc: "Local model server" },
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud",
    desc: "OpenAI, Anthropic, Google",
  },
  {
    id: "openrouter",
    icon: Network,
    title: "OpenRouter",
    desc: "Unified API gateway",
  },
  { id: "catalog", icon: Database, title: "Catalog", desc: "Available models" },
  { id: "groups", icon: Users, title: "Groups", desc: "Agentic workflows" },
  { id: "export", icon: Download, title: "Sync", desc: "Backup & Restore" },
];

export default function AIConfigPage() {
  const { effectiveTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("ollama");
  const [profile, setProfile] = useState<any>(null);

  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModels, setOllamaModels] = useState([
    { name: "llama3.1:8b", size: "4.7GB", modified: "2 days ago" },
    { name: "llama3.1:70b", size: "40GB", modified: "1 week ago" },
    { name: "mistral:7b", size: "4.1GB", modified: "3 days ago" },
  ]);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const [cloudProviders, setCloudProviders] = useState({
    openai: { apiKey: "sk-proj-...", enabled: true, status: "connected" },
    anthropic: { apiKey: "sk-ant-...", enabled: true, status: "connected" },
    google: { apiKey: "", enabled: false, status: "disconnected" },
  });

  const [pullModelOpen, setPullModelOpen] = useState(false);
  const [pullModelName, setPullModelName] = useState("");
  const [pullModelLoading, setPullModelLoading] = useState(false);
  const [deleteModelOpen, setDeleteModelOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(
    null,
  );

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

  const toggleApiKeyVisibility = (provider: string) =>
    setShowApiKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const cardCls = `p-6 rounded-2xl border ${isDark ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`;
  const inputCls = `w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-all font-alliance ${isDark ? "bg-[#0a0e1a] border-gray-700 text-white placeholder-gray-600 focus:border-blue-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400"}`;
  const labelCls = `block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2`;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header
        className={`border-b px-8 py-8 ${isDark ? "bg-[#0a0e1a] border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`text-3xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              AI Intelligence Hub
            </h1>
            <p
              className={`font-alliance ${isDark ? "text-gray-500" : "text-gray-600"}`}
            >
              Neural core and model provider orchestration
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Protocol Admin Access
            </span>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CONFIG_SECTIONS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all ${activeTab === tab.id ? (isDark ? "bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10" : "bg-white border-blue-500 shadow-md") : isDark ? "bg-gray-800/30 border-gray-700 hover:border-gray-500" : "bg-gray-50 border-gray-100 hover:bg-white"}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${activeTab === tab.id ? "bg-blue-500 text-white" : isDark ? "bg-gray-700 text-gray-400" : "bg-white text-gray-400 border"}`}
              >
                <tab.icon size={18} />
              </div>
              <h3
                className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {tab.title}
              </h3>
              <p className="text-[10px] font-alliance opacity-50 truncate uppercase tracking-tighter">
                {tab.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
          {activeTab === "ollama" && (
            <div className={cardCls}>
              <div className="flex items-center justify-between mb-8 border-b border-gray-700/50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                    <Server size={24} />
                  </div>
                  <div>
                    <h2
                      className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Ollama Core
                    </h2>
                    <p className="text-xs font-alliance text-gray-500">
                      Managing local inference nodes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Zap size={14} className="fill-current animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Connected
                  </span>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <label className={labelCls}>Neural Endpoint URL</label>
                    <div className="flex gap-2">
                      <input
                        className={inputCls}
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                      />
                      <button
                        className={`p-2.5 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 border-dashed">
                    <h4 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
                      Internal Health
                    </h4>
                    <div className="flex items-center justify-between text-[11px] font-alliance text-gray-500">
                      <span>Latent Response</span>
                      <span className="text-emerald-500 font-bold">
                        12ms - Optimal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Active Local Models
                    </h3>
                    <button
                      onClick={() => setPullModelOpen(true)}
                      className="text-[10px] font-black uppercase text-blue-500 hover:underline"
                    >
                      + Pull Neural Map
                    </button>
                  </div>
                  <div className="space-y-2">
                    {ollamaModels.map((m) => (
                      <div
                        key={m.name}
                        className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? "bg-[#0a0e1a] border-gray-700" : "bg-gray-50 border-gray-100"}`}
                      >
                        <div className="flex items-center gap-3">
                          <BrainCircuit size={18} className="text-blue-500" />
                          <div>
                            <p
                              className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {m.name}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">
                              {m.size} · Synced {m.modified}
                            </p>
                          </div>
                        </div>
                        <button className="text-gray-600 hover:text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cloud" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  id: "openai",
                  name: "OpenAI",
                  icon: Cloud,
                  key: "sk-proj-...",
                },
                {
                  id: "anthropic",
                  name: "Anthropic",
                  icon: Zap,
                  key: "sk-ant-...",
                },
                { id: "google", name: "Google AI", icon: Network, key: "" },
              ].map((p) => (
                <div key={p.id} className={cardCls}>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`p-2.5 rounded-xl bg-gray-800 text-blue-400`}
                    >
                      <p.icon size={20} />
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${p.key ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-gray-700"}`}
                    />
                  </div>
                  <h3
                    className={`text-base font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {p.name}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>API Access Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showApiKeys[p.id] ? "text" : "password"}
                          className={inputCls}
                          value={p.key || "Not configured"}
                          disabled={!p.key}
                        />
                        <button
                          onClick={() => toggleApiKeyVisibility(p.id)}
                          className="p-2.5 text-gray-500"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>
                    <button
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${p.key ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-gray-700 text-gray-500 bg-transparent"}`}
                    >
                      {p.key ? "Test Connection" : "Register Provider"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fallback for other tabs */}
          {activeTab !== "ollama" && activeTab !== "cloud" && (
            <div
              className={`${cardCls} py-32 flex flex-col items-center justify-center opacity-40`}
            >
              <Layers size={48} className="mb-4 text-gray-500" />
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">
                Neural Tab: {activeTab}
              </h3>
              <p className="text-xs mt-2 font-alliance">
                Interface synchronization pending verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Styled Dialogs */}
      <Dialog open={pullModelOpen} onOpenChange={setPullModelOpen}>
        <DialogContent
          className={`${isDark ? "bg-[#0d1117] border-gray-800" : "bg-white"} rounded-3xl p-8 max-w-md border-2`}
        >
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
              <Download size={24} />
            </div>
            <DialogTitle
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Pull Local Model
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm font-alliance pt-1">
              Sync new brain patterns from Ollama registry.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Registry Identifier</label>
              <input
                className={inputCls}
                placeholder="e.g. llama3.1:8b"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-8 pt-6 border-t border-gray-800 gap-3">
            <button
              onClick={() => setPullModelOpen(false)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Cancel
            </button>
            <button
              onClick={() => setPullModelOpen(false)}
              disabled={!pullModelName}
              className="px-8 py-2.5 rounded-xl text-white font-bold text-xs uppercase shadow-xl hover:opacity-90 disabled:opacity-40"
              style={{ background: grad }}
            >
              Pull Model
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
