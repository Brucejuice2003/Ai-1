import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({
  className,
  type = 'text',
  icon,
  error,
  ...props
}, ref) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          {icon}
        </div>
      )}
      <input
        type={type}
        className={cn(
          'input',
          icon && 'input-with-icon',
          error && 'border-error focus:border-error focus:ring-error/25',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Search input variant
export const SearchInput = forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        className={cn(
          'input input-with-icon',
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

// Textarea
export const Textarea = forwardRef(({
  className,
  error,
  ...props
}, ref) => {
  return (
    <div>
      <textarea
        className={cn(
          'input min-h-[100px] py-3 resize-none',
          error && 'border-error focus:border-error focus:ring-error/25',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select dropdown
export const Select = forwardRef(({
  className,
  children,
  error,
  ...props
}, ref) => {
  return (
    <div>
      <select
        className={cn(
          'input appearance-none cursor-pointer pr-10',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2371717a\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")]',
          'bg-[length:20px] bg-[right_12px_center] bg-no-repeat',
          error && 'border-error focus:border-error',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Label component
export function Label({ children, htmlFor, required, className, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-sm font-medium text-text-secondary mb-2',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  );
}

// Form group wrapper
export function FormGroup({ children, className, ...props }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
}

export default Input;
