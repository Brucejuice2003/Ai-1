import React from 'react';
import { cn } from '../../lib/utils';

export function BorderBeam({
  className,
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = '#bc13fe',
  colorTo = '#00f3ff',
  borderWidth = 1.5,
}) {
  return (
    <div
      style={{
        '--size': `${size}px`,
        '--duration': `${duration}s`,
        '--delay': `-${delay}s`,
        '--color-from': colorFrom,
        '--color-to': colorTo,
        '--border-width': `${borderWidth}px`,
      }}
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        '[mask-clip:padding-box,border-box] [mask-composite:intersect]',
        '[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
        'after:absolute after:aspect-square after:w-[var(--size)]',
        'after:animate-border-beam',
        'after:[animation-delay:var(--delay)]',
        'after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)]',
        'after:[offset-anchor:calc(var(--size)/2)_50%]',
        'after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)/2))]',
        className
      )}
    />
  );
}

// We need to add the animation to index.css:
// @keyframes border-beam {
//   100% { offset-distance: 100%; }
// }

export default BorderBeam;
