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
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddWebsiteDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function AddWebsiteDialog({ children, onSuccess }: AddWebsiteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [crawlFrequency, setCrawlFrequency] = useState("360")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setError("Authentication required. Please log in again.")
        setLoading(false)
        return
      }

      const response = await fetch("/api/sources/website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          websiteUrl: url,
          description: description || undefined,
          crawlFrequency: parseInt(crawlFrequency),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to add website")
        setLoading(false)
        return
      }

      // Success
      toast({
        title: "Website Added",
        description: `Successfully added ${name}`,
      })

      // Reset form
      setName("")
      setUrl("")
      setDescription("")
      setCrawlFrequency("360")
      setOpen(false)
      setLoading(false)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error adding website:", err)
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
          <Button className="bg-primary hover:bg-primary/90">Add Website</Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Website to Monitor</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a website to monitor for new content
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
              <Label htmlFor="website-name" className="text-foreground">
                Website Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="website-name"
                placeholder="ESPN Fantasy Football"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border mt-1.5"
                required
                minLength={2}
              />
            </div>

            <div>
              <Label htmlFor="website-url" className="text-foreground">
                Website URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="website-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-background border-border mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="website-description" className="text-foreground">
                Description <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Textarea
                id="website-description"
                placeholder="Latest fantasy football news and analysis"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border mt-1.5 resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="crawl-frequency" className="text-foreground">
                Crawl Frequency (minutes)
              </Label>
              <select
                id="crawl-frequency"
                value={crawlFrequency}
                onChange={(e) => setCrawlFrequency(e.target.value)}
                className="w-full mt-1.5 h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="60">Every hour</option>
                <option value="180">Every 3 hours</option>
                <option value="360">Every 6 hours</option>
                <option value="720">Every 12 hours</option>
                <option value="1440">Daily</option>
              </select>
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
                "Add Website"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
