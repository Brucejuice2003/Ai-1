import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { cn } from '../../lib/utils';

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  duration = 1,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const springValue = useSpring(direction === 'up' ? 0 : value, {
    damping: 60,
    stiffness: 100,
    duration: duration * 1000,
  });

  const displayValue = useTransform(springValue, (current) =>
    decimalPlaces > 0
      ? current.toFixed(decimalPlaces)
      : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timer = setTimeout(() => {
        springValue.set(direction === 'up' ? value : 0);
        setHasAnimated(true);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, delay, value, direction, springValue, hasAnimated]);

  // Update when value changes after initial animation
  useEffect(() => {
    if (hasAnimated) {
      springValue.set(value);
    }
  }, [value, hasAnimated, springValue]);

  return (
    <motion.span
      ref={ref}
      className={cn('tabular-nums tracking-tight', className)}
    >
      {displayValue}
    </motion.span>
  );
}

// Variant for displaying Hz, BPM, etc with units
export function NumberTickerWithUnit({
  value,
  unit,
  className,
  unitClassName,
  ...props
}) {
  return (
    <span className={cn('inline-flex items-baseline gap-1', className)}>
      <NumberTicker value={value} {...props} />
      {unit && (
        <span className={cn('text-text-secondary text-sm', unitClassName)}>
          {unit}
        </span>
      )}
    </span>
  );
}

export default NumberTicker;
