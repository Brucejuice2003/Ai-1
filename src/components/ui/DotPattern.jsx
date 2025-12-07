import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/20',
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <circle cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// Variant with fade effect at edges
export function DotPatternFade({
  className,
  fadeDirection = 'bottom',
  ...props
}) {
  const fadeClasses = {
    top: '[mask-image:linear-gradient(to_bottom,white,transparent)]',
    bottom: '[mask-image:linear-gradient(to_top,white,transparent)]',
    left: '[mask-image:linear-gradient(to_right,white,transparent)]',
    right: '[mask-image:linear-gradient(to_left,white,transparent)]',
    center: '[mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]',
  };

  return (
    <DotPattern
      className={cn(fadeClasses[fadeDirection], className)}
      {...props}
    />
  );
}

export default DotPattern;
