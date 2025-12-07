import React from 'react';
import { cn } from '../../lib/utils';

const cardVariants = {
  default: 'card',
  glass: 'glass-panel',
  elevated: 'card-elevated',
  glow: 'card-glow',
  static: 'glass-panel-static',
};

export function Card({
  children,
  variant = 'default',
  className,
  padding = 'md',
  ...props
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        cardVariants[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 className={cn('text-lg font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-sm text-text-secondary mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div className={cn('mt-4 pt-4 border-t border-border-default', className)} {...props}>
      {children}
    </div>
  );
}

// Stat card for displaying metrics
export function StatCard({
  label,
  value,
  icon,
  trend,
  trendDirection,
  className,
  glowing = false,
}) {
  return (
    <Card
      variant={glowing ? 'glow' : 'default'}
      padding="md"
      className={cn('relative overflow-hidden', className)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-xs font-medium',
                trendDirection === 'up' ? 'text-success' : 'text-error'
              )}
            >
              {trendDirection === 'up' ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default Card;
