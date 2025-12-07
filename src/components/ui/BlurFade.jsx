import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const blurFadeVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
};

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.4,
  yOffset = 8,
  blur = '8px',
  inView = true,
  inViewMargin = '-100px',
  ...props
}) {
  const variants = {
    hidden: {
      opacity: 0,
      y: yOffset,
      filter: `blur(${blur})`,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate={inView ? 'visible' : undefined}
      whileInView={inView ? undefined : 'visible'}
      viewport={{ once: true, margin: inViewMargin }}
      variants={variants}
      transition={{
        delay,
        duration,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Staggered children variant
export function BlurFadeStagger({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0,
  ...props
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <BlurFade
          delay={initialDelay + index * staggerDelay}
          {...props}
        >
          {child}
        </BlurFade>
      ))}
    </div>
  );
}

export default BlurFade;
