import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-bg-elevated/80 border border-border/30',
        className
      )}
      aria-hidden="true"
    />
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-bg-surface/50 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          {/* Company */}
          <Skeleton className="h-3.5 w-1/4" />
          {/* Title */}
          <Skeleton className="h-6 w-3/4" />
        </div>
        {/* Status Badge */}
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>

      {/* Description */}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Tech Stack Tags */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>

      {/* Card Footer Parameters */}
      <div className="mt-auto pt-6">
        <div className="flex flex-col gap-2 rounded-2xl border border-border/40 bg-bg-elevated/20 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="section-gap">
        <Skeleton className="h-5 w-28" />
      </div>

      <div className="page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="space-y-2.5 w-full">
          <Skeleton className="h-8 w-2/3 sm:w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-md shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="panel p-6 sm:p-8 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          <div className="panel p-6 sm:p-8 space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="space-y-3.5">
              <div className="flex justify-between border-b border-border/50 pb-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between border-b border-border/50 pb-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>

          <Skeleton className="h-28 rounded-2xl w-full" />
        </div>
      </div>
    </div>
  )
}
