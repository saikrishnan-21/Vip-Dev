import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
