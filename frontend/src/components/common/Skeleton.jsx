import { cn } from "../../utils/cn";

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-[8px] bg-surface-sunken border border-border/50", className)}
      {...props}
    />
  );
}

export function SkeletonText({ className, lines = 1, ...props }) {
  return (
    <div className="space-y-2.5 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4 w-full",
            i === lines - 1 && lines > 1 ? "w-[85%]" : "",
            className
          )}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-[20px] border border-border bg-surface p-5 space-y-3">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-1/3" />
    </div>
  );
}

export function SkeletonClassroomCard({ layout = "default" }) {
  if (layout === "tile") {
    return (
      <div className="eg-card min-h-[220px] space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <SkeletonText lines={2} className="h-3.5" />
        </div>
        <div className="border-t border-border pt-4">
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="eg-card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-7 w-2/3" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 w-36" />
        <Skeleton className="h-11 w-32" />
      </div>
    </div>
  );
}

export function SkeletonExamCard() {
  return (
    <div className="eg-card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-7 w-1/2" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-11 w-32" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = "md", className }) {
  const sizeClass = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24 md:h-28 md:w-28",
  }[size] || "h-12 w-12";

  return <Skeleton className={cn("rounded-full", sizeClass, className)} />;
}

export function SkeletonForm({ fields = 3, className }) {
  return (
    <div className={cn("space-y-4 w-full", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }) {
  return (
    <div className={cn("w-full border border-border/50 rounded-[20px] overflow-hidden bg-surface", className)}>
      {/* Table Header */}
      <div className="bg-surface-sunken border-b border-border/50 px-6 py-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1 rounded-md" />
        ))}
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`r-${r}`} className="px-6 py-4 flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={`c-${c}`} className="h-4 flex-1 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 4, className }) {
  return (
    <div className={cn("space-y-3 w-full", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-[18px] border border-border/40 bg-surface">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
