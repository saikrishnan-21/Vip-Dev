"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddTopicDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function AddTopicDialog({ children, onSuccess }: AddTopicDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const { toast } = useToast()

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed])
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword))
  }

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate keywords
    if (keywords.length === 0) {
      setError("At least one keyword is required")
      setLoading(false)
      return
    }

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("Authentication required. Please log in again.")
        setLoading(false)
        return
      }

      const response = await fetch("/api/sources/topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          topicKeywords: keywords,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to add topic")
        setLoading(false)
        return
      }

      // Success
      toast({
        title: "Topic Added",
        description: `Successfully added ${name}`,
      })

      // Reset form
      setName("")
      setDescription("")
      setKeywords([])
      setKeywordInput("")
      setOpen(false)
      setLoading(false)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error adding topic:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="bg-primary hover:bg-primary/90">Add Topic</Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Topic</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new topic to track for content generation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="topic-name" className="text-foreground">
                Topic Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="topic-name"
                placeholder="e.g., Fantasy Football Sleepers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border mt-1.5"
                required
                minLength={2}
              />
            </div>

            <div>
              <Label htmlFor="topic-description" className="text-foreground">
                Description <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Textarea
                id="topic-description"
                placeholder="Describe what this topic covers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border mt-1.5 resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="topic-keywords" className="text-foreground">
                Keywords <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="topic-keywords"
                  placeholder="Type a keyword and press Enter"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  className="bg-background border-border"
                />
                <Button
                  type="button"
                  onClick={handleAddKeyword}
                  className="bg-primary hover:bg-primary/90"
                >
                  Add
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="hover:bg-primary/20 rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                At least one keyword is required
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Topic"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
