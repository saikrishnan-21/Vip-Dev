"use client"

import { useState } from "react"

type ProviderId = "ollama" | "openai" | "anthropic" | "google" | "openrouter" | "custom"

interface ProviderKey {
  id: ProviderId
  label: string
  enabled: boolean
  apiKey?: string
  baseUrl?: string
}

interface ModelRef {
  id: string
  provider: ProviderId
  family?: string
  modality: ("text" | "vision" | "audio" | "multimodal")[]
  contextWindow?: number
  supportsTools?: boolean
  notes?: string
}

type GroupPurpose = "planner" | "retriever" | "reasoner" | "coder" | "judge" | "custom"
type GroupStrategy = "fallback" | "round_robin" | "weighted" | "majority_judge"

interface ModelGroup {
  id: string
  name: string
  purpose: GroupPurpose
  description?: string
  routing: {
    strategy: GroupStrategy
    maxParallel?: number
    timeoutsMs?: number
  }
  members: Array<{
    modelId: string
    role?: "primary" | "fallback" | "judge" | "tool-caller"
    weight?: number
  }>
  metadata?: Record<string, unknown>
}

interface AiSettings {
  providerKeys: ProviderKey[]
  models: ModelRef[]
  modelGroups: ModelGroup[]
  lastUpdated: string
}

const STORAGE_KEY = "ai_settings_v1"

const defaultSettings: AiSettings = {
  providerKeys: [
    { id: "ollama", label: "Ollama", enabled: true },
    { id: "openai", label: "OpenAI", enabled: false },
    { id: "anthropic", label: "Anthropic", enabled: false },
    { id: "google", label: "Google AI", enabled: false },
    { id: "openrouter", label: "OpenRouter", enabled: false },
  ],
  models: [
    {
      id: "llama3.1:8b",
      provider: "ollama",
      family: "llama",
      modality: ["text"],
      contextWindow: 8,
      supportsTools: true,
      notes: "Fast and efficient",
    },
    {
      id: "mistral:7b",
      provider: "ollama",
      family: "mistral",
      modality: ["text"],
      contextWindow: 7,
      supportsTools: true,
      notes: "Good for general tasks",
    },
  ],
  modelGroups: [],
  lastUpdated: new Date().toISOString(),
}

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(defaultSettings)

  const loadSettings = () => {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to parse settings:", error)
      }
    }
  }

  const saveSettings = (newSettings: AiSettings) => {
    const updated = {
      ...newSettings,
      lastUpdated: new Date().toISOString(),
    }
    setSettings(updated)

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    settings,
    loadSettings,
    saveSettings,
    resetSettings,
  }
}
