import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function PageContainer({
  children,
  className,
  maxWidth = '6xl',
  padding = true,
  animate = true,
  ...props
}) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  const content = (
    <div
      className={cn(
        maxWidthClasses[maxWidth],
        'mx-auto w-full',
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {content}
    </motion.div>
  );
}

// Page header component
export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
        'mb-8',
        className
      )}
      {...props}
    >
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

// Page section component
export function PageSection({
  title,
  description,
  children,
  className,
  ...props
}) {
  return (
    <section className={cn('mb-8', className)} {...props}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-text-secondary">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

// Empty state component
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'py-16 px-4 text-center',
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-3 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-text-muted" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-text-secondary max-w-sm mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export default PageContainer;
