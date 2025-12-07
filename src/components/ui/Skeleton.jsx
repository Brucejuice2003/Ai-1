import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton', className)}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className, ...props }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4 skeleton-text',
            i === lines - 1 && 'w-3/4' // Last line is shorter
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className, ...props }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      className={cn('skeleton-avatar', sizes[size], className)}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }) {
  return (
    <div
      className={cn(
        'card p-6 space-y-4',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonButton({ size = 'md', className, ...props }) {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return (
    <Skeleton
      className={cn('rounded-lg', sizes[size], className)}
      {...props}
    />
  );
}

// Skeleton for stat cards
export function SkeletonStatCard({ className, ...props }) {
  return (
    <div className={cn('card p-6', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

// Skeleton for list items
export function SkeletonListItem({ className, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 border-b border-border-subtle',
        className
      )}
      {...props}
    >
      <SkeletonAvatar size="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export default Skeleton;
