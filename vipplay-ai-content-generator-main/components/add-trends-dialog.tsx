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

interface AddTrendsDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

// Common regions for Google Trends
const REGIONS = [
  { code: "", name: "Global (Worldwide)" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
]

// Common categories
const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
  { value: "business", label: "Business" },
  { value: "technology", label: "Technology" },
  { value: "health", label: "Health" },
  { value: "politics", label: "Politics" },
  { value: "science", label: "Science" },
]

export function AddTrendsDialog({ children, onSuccess }: AddTrendsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [region, setRegion] = useState("")
  const [category, setCategory] = useState("")
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

      const response = await fetch("/api/sources/trends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || undefined,
          trendRegion: region || undefined,
          trendCategory: category || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to add trend source")
        setLoading(false)
        return
      }

      // Success
      toast({
        title: "Trend Source Added",
        description: `Successfully added ${name}`,
      })

      // Reset form
      setName("")
      setDescription("")
      setRegion("")
      setCategory("")
      setOpen(false)
      setLoading(false)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error("Error adding trend source:", err)
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
          <Button className="bg-primary hover:bg-primary/90">Add Trends</Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Google Trends Source</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Track trending topics from Google Trends
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
              <Label htmlFor="trend-name" className="text-foreground">
                Trend Source Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="trend-name"
                placeholder="e.g., US Sports Trends"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border mt-1.5"
                required
                minLength={2}
              />
            </div>

            <div>
              <Label htmlFor="trend-description" className="text-foreground">
                Description <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Textarea
                id="trend-description"
                placeholder="Describe what trends you're tracking..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border mt-1.5 resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="trend-region" className="text-foreground">
                Region <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <select
                id="trend-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full mt-1.5 h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="trend-category" className="text-foreground">
                Category <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <select
                id="trend-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1.5 h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
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
                "Add Trend Source"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
