import React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  default: 'bg-surface-3 text-text-secondary border border-border-default',
};

const badgeSizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'badge',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            variant === 'success' && 'bg-success',
            variant === 'warning' && 'bg-warning',
            variant === 'error' && 'bg-error',
            variant === 'primary' && 'bg-primary',
            variant === 'secondary' && 'bg-secondary',
            variant === 'default' && 'bg-text-muted'
          )}
        />
      )}
      {children}
    </span>
  );
}

// Live indicator badge
export function LiveBadge({ className, ...props }) {
  return (
    <Badge
      variant="error"
      size="sm"
      className={cn('gap-1.5', className)}
      {...props}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
      </span>
      LIVE
    </Badge>
  );
}

// Pro/Premium badge
export function ProBadge({ className, ...props }) {
  return (
    <Badge
      className={cn(
        'bg-gradient-to-r from-primary to-accent text-white border-none font-semibold',
        className
      )}
      size="sm"
      {...props}
    >
      PRO
    </Badge>
  );
}

// Status badge with auto color
export function StatusBadge({ status, className, ...props }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    error: { variant: 'error', label: 'Error' },
    success: { variant: 'success', label: 'Success' },
    processing: { variant: 'primary', label: 'Processing' },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge
      variant={config.variant}
      dot
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
}

export default Badge;
