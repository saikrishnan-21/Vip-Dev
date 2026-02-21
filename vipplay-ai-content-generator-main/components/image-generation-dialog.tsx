"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2, Image as ImageIcon } from "lucide-react"

interface ImageGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (imageCount: number, imageStyle: string) => Promise<void>
  hasImages: boolean
}

export function ImageGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
  hasImages,
}: ImageGenerationDialogProps) {
  const [imageCount, setImageCount] = useState<number>(2)
  const [imageStyle, setImageStyle] = useState<string>("auto")
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await onGenerate(imageCount, imageStyle)
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in parent component
      console.error("Image generation error:", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-[100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {hasImages ? "Regenerate Images" : "Generate Images"}
          </DialogTitle>
          <DialogDescription>
            {hasImages
              ? "Generate new images for this article. Existing images will be replaced."
              : "Generate and embed images into your article based on its content."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="image-count">Number of Images</Label>
            <Select
              value={imageCount.toString()}
              onValueChange={(value) => setImageCount(parseInt(value))}
              disabled={generating}
            >
              <SelectTrigger id="image-count">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                <SelectItem value="1">1 Image</SelectItem>
                <SelectItem value="2">2 Images</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select how many images to generate (1-2)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-style">Image Style</Label>
            <Select
              value={imageStyle}
              onValueChange={setImageStyle}
              disabled={generating}
            >
              <SelectTrigger id="image-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                <SelectItem value="auto">Auto (AI decides)</SelectItem>
                <SelectItem value="cartoon">Cartoon</SelectItem>
                <SelectItem value="realistic">Realistic</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the style for generated images
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate Images
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

