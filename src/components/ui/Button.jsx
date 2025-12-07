import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'bg-error/20 text-error border border-error/30 hover:bg-error/30',
  success: 'bg-success/20 text-success border border-success/30 hover:bg-success/30',
};

const buttonSizes = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  leftIcon,
  rightIcon,
  ...props
}) {
  return (
    <button
      className={cn(
        'btn',
        buttonVariants[variant],
        buttonSizes[size],
        loading && 'opacity-70 cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// Icon-only button variant
export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <button
      className={cn(
        'btn',
        buttonVariants[variant],
        iconSizes[size],
        'p-0 rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
