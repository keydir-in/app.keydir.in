'use client';

/**
 * Animated big up-arrow. Lifts (y -4) on hover, settles back on hover end.
 * Stroke scaled from a 24-unit basis to the 24-unit viewBox.
 */

import { forwardRef, useImperativeHandle } from 'react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types';
import { motion, useAnimate } from 'motion/react';

const ArrowBigUpIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = 'currentColor', strokeWidth = 2, className = '' },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = async () => {
      animate('.arrow', { y: -4 }, { duration: 0.3, ease: 'easeOut' });
    };

    const stop = () => {
      animate('.arrow', { y: 0 }, { duration: 0.2, ease: 'easeInOut' });
    };

    useImperativeHandle(ref, () => ({
      startAnimation: start,
      stopAnimation: stop,
    }));

    return (
      <motion.svg
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`cursor-pointer ${className}`}
      >
        <motion.path
          className="arrow"
          d="M9 13a1 1 0 0 0-1-1H5.061a1 1 0 0 1-.75-1.811l6.836-6.835a1.207 1.207 0 0 1 1.707 0l6.835 6.835a1 1 0 0 1-.75 1.811H16a1 1 0 0 0-1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z"
        />
      </motion.svg>
    );
  },
);

ArrowBigUpIcon.displayName = 'ArrowBigUpIcon';

export default ArrowBigUpIcon;
