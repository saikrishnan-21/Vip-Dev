"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface AddRssDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  onOpenChange?: (open: boolean) => void
  open?: boolean
  hideTrigger?: boolean
}

export function AddRssDialog({
  children,
  onSuccess,
  onOpenChange,
  open: controlledOpen,
  hideTrigger = false,
}: AddRssDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const dialogOpen = isControlled ? controlledOpen : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    if (onOpenChange) {
      onOpenChange(newOpen)
    }
  }
  const [loading, setLoading] = useState(false)
  const [feedUrl, setFeedUrl] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token')

      const response = await fetch('/api/sources/rss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name,
          feedUrl,
          description: description || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          // Handle validation errors
          const errorMessages = data.errors.map((err: any) => err.message).join(', ')
          setError(errorMessages)
        } else {
          setError(data.message || 'Failed to add RSS feed')
        }
        return
      }

      // Success
      toast({
        title: "RSS Feed Added",
        description: `Successfully added ${name}`,
      })

      handleOpenChange(false)
      setFeedUrl("")
      setName("")
      setDescription("")

      // Call onSuccess callback to refresh data
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error adding RSS feed:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger &&
        (children ? (
          <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">Add Feed</Button>
          </DialogTrigger>
        ))}
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add RSS Feed</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new RSS feed to monitor for content updates
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="feed-name" className="text-foreground">
                Feed Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="feed-name"
                placeholder="ESPN Fantasy Football"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border mt-1.5"
                required
                minLength={2}
              />
            </div>
            <div>
              <Label htmlFor="feed-url" className="text-foreground">
                Feed URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="feed-url"
                type="url"
                placeholder="https://example.com/feed.xml"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                className="bg-background border-border mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="feed-description" className="text-foreground">
                Description <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="feed-description"
                placeholder="Latest fantasy football news and analysis"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background border-border mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-border bg-transparent"
              disabled={loading}
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
                "Add Feed"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
