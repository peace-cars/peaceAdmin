import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-border-subtle/40", className)}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4 w-full",
            i === lines - 1 && lines > 1 ? "w-2/3" : ""
          )} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface-card rounded-2xl p-5 border border-border-subtle/30", className)}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4 border-b border-border-subtle/30", className)}>
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="w-20 h-8 rounded-lg shrink-0" />
    </div>
  );
}

export function SkeletonKpi({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface-card rounded-2xl p-5 border border-border-subtle/30 flex flex-col justify-between", className)}>
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}
