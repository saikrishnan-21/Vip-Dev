"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter } from "lucide-react"

interface FilterPopoverProps {
  onFilterChange?: (filters: any) => void
}

export function FilterPopover({ onFilterChange }: FilterPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="border-border bg-transparent">
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-card border-border" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-3">Filter Articles</h4>
          </div>

          <div>
            <Label className="text-foreground text-sm mb-2 block">Status</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-border" defaultChecked />
                <span className="text-sm text-foreground">Approved</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-border" />
                <span className="text-sm text-foreground">Rejected</span>
              </label>
            </div>
          </div>

          <div>
            <Label className="text-foreground text-sm mb-2 block">Category</Label>
            <select className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option>All Categories</option>
              <option>Fantasy Football</option>
              <option>College Football</option>
              <option>NFL Draft</option>
              <option>Varsity Sports</option>
            </select>
          </div>

          <div>
            <Label className="text-foreground text-sm mb-2 block">Date Range</Label>
            <select className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option>All Time</option>
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 border-border bg-transparent">
              Reset
            </Button>
            <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
