"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2 } from "lucide-react"

interface GenerationProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleCount: number
  jobId?: string // Job ID from API response
  onJobComplete?: (jobId: string) => void // Callback when job completes
  onJobFailed?: (jobId: string, error: string) => void // Callback when job fails
}

export function GenerationProgressDialog({ 
  open, 
  onOpenChange, 
  articleCount, 
  jobId,
  onJobComplete,
  onJobFailed 
}: GenerationProgressDialogProps) {
  const [progress, setProgress] = useState(0)
  const [currentArticle, setCurrentArticle] = useState(1)
  const [completed, setCompleted] = useState(false)
  const [status, setStatus] = useState<string>("queued")
  const [error, setError] = useState<string | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [message, setMessage] = useState<string>("")
  const [isBulk, setIsBulk] = useState(false)

  // Poll job status from API - continue polling even when dialog is closed
  // This ensures background processing continues and we can notify user when complete
  useEffect(() => {
    if (!jobId) {
      setProgress(0)
      setCurrentArticle(1)
      setCompleted(false)
      setStatus("queued")
      setError(null)
      setCompletedCount(0)
      setFailedCount(0)
      setMessage("")
      setIsBulk(false)
      return
    }

    // Poll job status every 2 seconds - continue even if dialog is closed
    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem("auth_token")
        if (!token) {
          setError("Authentication required")
          clearInterval(pollInterval)
          return
        }

        // Fetch specific job by ID
        const response = await fetch(`/api/content/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()
        if (data.success && data.data) {
          const currentJob = data.data
          
          setStatus(currentJob.status)
          
          // Check if this is a bulk job
          if (currentJob.mode === "bulk" || currentJob.articleCount > 1) {
            setIsBulk(true)
            if (currentJob.completedCount !== undefined) {
              setCompletedCount(currentJob.completedCount)
            }
            if (currentJob.failedCount !== undefined) {
              setFailedCount(currentJob.failedCount)
            }
          }
          
          // Update message if available
          if (currentJob.message) {
            setMessage(currentJob.message)
          }
          
          // Update progress based on job status
          if (currentJob.progress !== undefined && typeof currentJob.progress === 'number') {
            setProgress(currentJob.progress)
          } else {
            // Estimate progress based on status
            if (currentJob.status === "queued") {
              setProgress(0)
            } else if (currentJob.status === "processing") {
              // For bulk jobs, calculate progress from completed count
              if (isBulk && currentJob.articleCount > 0) {
                const bulkProgress = Math.floor((currentJob.completedCount / currentJob.articleCount) * 100)
                setProgress(bulkProgress > 0 ? bulkProgress : 10)
              } else {
                setProgress(50) // Mid-way for single jobs
              }
            } else if (currentJob.status === "completed") {
              setProgress(100)
              setCompleted(true)
              clearInterval(pollInterval)
              // Notify parent that job completed (even if dialog is closed)
              if (onJobComplete && jobId) {
                onJobComplete(jobId)
              }
            } else if (currentJob.status === "failed") {
              const errorMessage = currentJob.error || currentJob.message || "Generation failed"
              setError(errorMessage)
              clearInterval(pollInterval)
              // Notify parent that job failed (even if dialog is closed)
              if (onJobFailed && jobId) {
                onJobFailed(jobId, errorMessage)
              }
            }
          }

          // Update current article count if available
          if (currentJob.currentArticle !== undefined) {
            setCurrentArticle(currentJob.currentArticle)
          } else if (isBulk && currentJob.completedCount !== undefined) {
            setCurrentArticle(currentJob.completedCount + 1)
          } else {
            // Estimate based on progress
            setCurrentArticle(Math.floor((progress / 100) * articleCount) + 1)
          }

          // Stop polling if job is completed or failed (handled above)
          // This is a safety check
          if (currentJob.status === "completed" || currentJob.status === "failed") {
            clearInterval(pollInterval)
          }
        } else if (response.status === 404) {
          // Job not found - might have been deleted
          setError("Job not found")
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error("Error polling job status:", err)
        // Don't stop polling on error, just log it
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
    // NOTE: 'open' is intentionally excluded from dependencies
    // This ensures polling continues even when dialog is closed, allowing background progress tracking
  }, [jobId, articleCount, progress, isBulk, onJobComplete, onJobFailed])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {completed ? "Generation Complete!" : "Generating Articles..."}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-lg font-semibold text-foreground mb-2">Generation Failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : completed ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-2">
                {isBulk ? (
                  <>
                    {completedCount} of {articleCount} Articles Generated
                    {failedCount > 0 && <span className="text-red-500 text-sm ml-2">({failedCount} failed)</span>}
                  </>
                ) : (
                  <>{articleCount} {articleCount === 1 ? "Article" : "Articles"} Generated Successfully</>
                )}
              </p>
              <p className="text-sm text-muted-foreground">Your articles are ready for review in the Review Queue</p>
              {message && <p className="text-xs text-muted-foreground mt-2">{message}</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground text-lg">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">Status: {status}</span>
                  <span className="text-muted-foreground">
                    {isBulk ? (
                      <>{completedCount} of {articleCount} articles completed</>
                    ) : (
                      <>{currentArticle} of {articleCount} articles</>
                    )}
                  </span>
                </div>
                {status === "queued" && message && message.includes("position") && (
                  <div className="p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-500 font-medium text-center">
                      {message.includes("position") ? message : "Waiting in queue (FIFO order)"}
                    </p>
                  </div>
                )}
                {status === "processing" && (
                  <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-green-500 font-medium text-center">
                      Processing in FIFO order (First In, First Out)
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg bg-background border border-border">
                <p className="text-sm text-muted-foreground">
                  {message ? message : (
                    <>
                      {status === "queued" && "Job queued, waiting to start..."}
                      {status === "processing" && (isBulk 
                        ? "Processing articles in parallel with AI agents..." 
                        : "Generating SEO-optimized content with images and metadata...")}
                      {status === "completed" && "Generation complete!"}
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
