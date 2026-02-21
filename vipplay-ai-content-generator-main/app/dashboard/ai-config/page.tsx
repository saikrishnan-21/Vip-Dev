"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"

const configTabs = [
  {
    id: "ollama",
    icon: Server,
    title: "Ollama",
    description: "Local model server configuration",
  },
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud Providers",
    description: "OpenAI, Anthropic, Google AI",
  },
  {
    id: "openrouter",
    icon: Network,
    title: "OpenRouter",
    description: "Unified API for multiple models",
  },
  {
    id: "catalog",
    icon: Database,
    title: "Model Catalog",
    description: "All available models",
  },
  {
    id: "groups",
    icon: Users,
    title: "Model Groups",
    description: "Agentic workflows & routing",
  },
  {
    id: "export",
    icon: Download,
    title: "Export/Import",
    description: "Backup and restore settings",
  },
]

export default function AIConfigPage() {
  const [activeTab, setActiveTab] = useState("ollama")
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434")
  const [ollamaModels, setOllamaModels] = useState([
    { name: "llama3.1:8b", size: "4.7GB", modified: "2 days ago" },
    { name: "llama3.1:70b", size: "40GB", modified: "1 week ago" },
    { name: "mistral:7b", size: "4.1GB", modified: "3 days ago" },
  ])
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [cloudProviders, setCloudProviders] = useState({
    openai: { apiKey: "sk-proj-...", enabled: true, status: "connected" },
    anthropic: { apiKey: "sk-ant-...", enabled: true, status: "connected" },
    google: { apiKey: "", enabled: false, status: "disconnected" },
  })

  const [pullModelOpen, setPullModelOpen] = useState(false)
  const [pullModelName, setPullModelName] = useState("")
  const [pullModelLoading, setPullModelLoading] = useState(false)

  const [deleteModelOpen, setDeleteModelOpen] = useState(false)
  const [modelToDelete, setModelToDelete] = useState<string | null>(null)

  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [groupRoutingStrategy, setGroupRoutingStrategy] = useState("fallback")

  const [exportOpen, setExportOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  const toggleApiKeyVisibility = (provider: string) => {
    setShowApiKeys((prev) => ({ ...prev, [provider]: !prev[provider] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const updateProviderApiKey = (provider: keyof typeof cloudProviders, apiKey: string) => {
    setCloudProviders((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], apiKey },
    }))
  }

  const handlePullModel = async () => {
    setPullModelLoading(true)
    // Simulate pulling model
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setOllamaModels([...ollamaModels, { name: pullModelName, size: "5.2GB", modified: "Just now" }])
    setPullModelLoading(false)
    setPullModelOpen(false)
    setPullModelName("")
  }

  const handleDeleteModel = () => {
    if (modelToDelete) {
      setOllamaModels(ollamaModels.filter((m) => m.name !== modelToDelete))
      setDeleteModelOpen(false)
      setModelToDelete(null)
    }
  }

  const handleCreateGroup = () => {
    // Mock creating group
    setCreateGroupOpen(false)
    setGroupName("")
    setGroupDescription("")
    setGroupRoutingStrategy("fallback")
  }

  const handleTestConnection = async (provider: string) => {
    setTestingConnection(provider)
    // Simulate testing connection
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setTestingConnection(null)
  }

  const handleExport = () => {
    const config = {
      ollama: { url: ollamaUrl, models: ollamaModels },
      cloudProviders: {
        openai: { enabled: cloudProviders.openai.enabled },
        anthropic: { enabled: cloudProviders.anthropic.enabled },
        google: { enabled: cloudProviders.google.enabled },
      },
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ai-config-export.json"
    a.click()
    setExportOpen(false)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string)
          // Apply imported config
          if (config.ollama) {
            setOllamaUrl(config.ollama.url)
            setOllamaModels(config.ollama.models)
          }
          setImportOpen(false)
        } catch (error) {
          console.error("Failed to import config:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Configuration</h1>
        <p className="text-muted-foreground">Manage AI models, providers, and agentic workflows</p>
        <Badge variant="secondary" className="mt-2 bg-amber-500/10 text-amber-500 border-amber-500/20">
          Superadmin Only
        </Badge>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Configuration Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configTabs.map((tab) => {
            const Icon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                    : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <Icon className={`h-8 w-8 mb-3 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-foreground mb-1">{tab.title}</h3>
                <p className="text-sm text-muted-foreground">{tab.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "ollama" && (
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Ollama Server Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ollama-url" className="text-foreground">
                  Server URL
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="ollama-url"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="bg-background border-border"
                  />
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Connected to Ollama</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                  {ollamaModels.length} models
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-foreground">Installed Models</Label>
                  <Button size="sm" variant="outline" onClick={() => setPullModelOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Pull Model
                  </Button>
                </div>

                <div className="space-y-2">
                  {ollamaModels.map((model, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{model.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {model.size} • Modified {model.modified}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setModelToDelete(model.name)
                          setDeleteModelOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "cloud" && (
          <div className="space-y-4">
            {/* OpenAI */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  OpenAI
                </h3>
                <Switch checked={cloudProviders.openai.enabled} />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="openai-key" className="text-foreground">
                    API Key
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="openai-key"
                      type={showApiKeys.openai ? "text" : "password"}
                      value={cloudProviders.openai.apiKey}
                      onChange={(e) => updateProviderApiKey("openai", e.target.value)}
                      className="bg-background border-border"
                    />
                    <Button variant="outline" size="icon" onClick={() => toggleApiKeyVisibility("openai")}>
                      {showApiKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(cloudProviders.openai.apiKey)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm font-medium text-green-500">Connected</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection("openai")}
                    disabled={testingConnection === "openai"}
                  >
                    {testingConnection === "openai" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Anthropic */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  Anthropic
                </h3>
                <Switch checked={cloudProviders.anthropic.enabled} />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="anthropic-key" className="text-foreground">
                    API Key
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="anthropic-key"
                      type={showApiKeys.anthropic ? "text" : "password"}
                      value={cloudProviders.anthropic.apiKey}
                      onChange={(e) => updateProviderApiKey("anthropic", e.target.value)}
                      className="bg-background border-border"
                    />
                    <Button variant="outline" size="icon" onClick={() => toggleApiKeyVisibility("anthropic")}>
                      {showApiKeys.anthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(cloudProviders.anthropic.apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-sm font-medium text-green-500">Connected</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection("anthropic")}
                    disabled={testingConnection === "anthropic"}
                  >
                    {testingConnection === "anthropic" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Google AI */}
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  Google AI
                </h3>
                <Switch checked={cloudProviders.google.enabled} />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="google-key" className="text-foreground">
                    API Key
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="google-key"
                      type={showApiKeys.google ? "text" : "password"}
                      placeholder="Enter Google AI API key"
                      className="bg-background border-border"
                    />
                    <Button variant="outline" size="icon" onClick={() => toggleApiKeyVisibility("google")}>
                      {showApiKeys.google ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                  <span className="text-sm font-medium text-muted-foreground">Not configured</span>
                  <Button size="sm" variant="outline" disabled>
                    Test Connection
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "openrouter" && (
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              OpenRouter Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="openrouter-key" className="text-foreground">
                  API Key
                </Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="openrouter-key"
                    type={showApiKeys.openrouter ? "text" : "password"}
                    placeholder="Enter OpenRouter API key"
                    className="bg-background border-border"
                  />
                  <Button variant="outline" size="icon" onClick={() => toggleApiKeyVisibility("openrouter")}>
                    {showApiKeys.openrouter ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  OpenRouter provides unified access to multiple AI models
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-foreground">Enable OpenRouter</Label>
                <Switch />
              </div>
            </div>
          </Card>
        )}

        {activeTab === "catalog" && (
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Model Catalog
            </h3>

            <div className="mb-4">
              <Input placeholder="Search models..." className="bg-background border-border" />
            </div>

            <div className="space-y-2">
              {[
                { name: "llama3.1:8b", provider: "Ollama", status: "available" },
                { name: "gpt-4o", provider: "OpenAI", status: "available" },
                { name: "claude-3.5-sonnet", provider: "Anthropic", status: "available" },
                { name: "mistral:7b", provider: "Ollama", status: "available" },
              ].map((model, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{model.name}</p>
                    <p className="text-xs text-muted-foreground">{model.provider}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                    {model.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "groups" && (
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Model Groups
              </h3>
              <Button size="sm" onClick={() => setCreateGroupOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>

            <div className="space-y-4">
              <Card className="p-4 bg-background border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">Content Researcher</h4>
                  <Badge variant="secondary">2 models</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Expert research agent for gathering insights</p>
                <div className="flex gap-2">
                  <Badge variant="outline">llama3.1:70b</Badge>
                  <Badge variant="outline">gpt-4o</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">Routing: Fallback</p>
                </div>
              </Card>

              <Card className="p-4 bg-background border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">Content Writer</h4>
                  <Badge variant="secondary">2 models</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Professional writer for creating engaging content</p>
                <div className="flex gap-2">
                  <Badge variant="outline">claude-3.5-sonnet</Badge>
                  <Badge variant="outline">gpt-4o</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">Routing: Round-robin</p>
                </div>
              </Card>
            </div>
          </Card>
        )}

        {activeTab === "export" && (
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export & Import Settings
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-foreground mb-2 block">Export Configuration</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Download your AI configuration (API keys will be excluded)
                </p>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setExportOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <Label className="text-foreground mb-2 block">Import Configuration</Label>
                <p className="text-sm text-muted-foreground mb-3">Upload a previously exported configuration file</p>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={pullModelOpen} onOpenChange={setPullModelOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Pull Ollama Model</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter the name of the model you want to pull from Ollama registry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="model-name" className="text-foreground">
                Model Name
              </Label>
              <Input
                id="model-name"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                placeholder="e.g., llama3.1:8b, mistral:7b"
                className="bg-background border-border mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Visit ollama.com/library for available models</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPullModelOpen(false)} disabled={pullModelLoading}>
              Cancel
            </Button>
            <Button onClick={handlePullModel} disabled={!pullModelName || pullModelLoading}>
              {pullModelLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pulling...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Pull Model
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteModelOpen}
        onOpenChange={setDeleteModelOpen}
        title="Delete Model"
        description={`Are you sure you want to delete ${modelToDelete}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteModel}
        variant="destructive"
      />

      <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Model Group</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a group of models for agentic workflows with routing strategies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="group-name" className="text-foreground">
                Group Name
              </Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Content Researcher"
                className="bg-background border-border mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="group-description" className="text-foreground">
                Description
              </Label>
              <Textarea
                id="group-description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Describe the purpose of this model group..."
                className="bg-background border-border mt-1.5 min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="routing-strategy" className="text-foreground">
                Routing Strategy
              </Label>
              <Select value={groupRoutingStrategy} onValueChange={setGroupRoutingStrategy}>
                <SelectTrigger className="bg-background border-border mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fallback">Fallback - Try models in order until success</SelectItem>
                  <SelectItem value="round-robin">Round-robin - Distribute requests evenly</SelectItem>
                  <SelectItem value="weighted">Weighted - Based on model performance</SelectItem>
                  <SelectItem value="majority-judge">Majority Judge - Multiple models vote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Export Configuration</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Your configuration will be exported as a JSON file. API keys will be excluded for security.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-500">
                <strong>Note:</strong> API keys and sensitive data will not be included in the export.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Download Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Import Configuration</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload a previously exported configuration file to restore your settings
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="import-file" className="text-foreground">
              Configuration File
            </Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="bg-background border-border mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1.5">Select a JSON file exported from VIPContentAI</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
