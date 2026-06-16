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

export function SkeletonClassroomCard() {
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
