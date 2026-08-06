'use client';

/**
 * Animated outline bookmark icon. Squishes (scaleY .9) on hover, restores
 * on hover end. Stroke scaled from a 24-unit basis to the 48-unit viewBox.
 */

import { forwardRef, useImperativeHandle } from 'react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types';
import { scaledStrokeWidth } from './types';
import { motion, useAnimate } from 'motion/react';

const BookmarkIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = 'currentColor', strokeWidth = 2, fill = 'none', className = '' },
    ref,
  ) => {
    const [scope, animate] = useAnimate();

    const start = async () => {
      await animate(
        '.bookmark-body',
        {
          scaleY: 0.9,
          y: 2,
        },
        {
          duration: 0.18,
          ease: 'easeOut',
        },
      );
    };

    const stop = async () => {
      await animate(
        '.bookmark-body',
        {
          scaleY: 1,
          y: 0,
        },
        {
          duration: 0.18,
          ease: 'easeInOut',
        },
      );
    };

    useImperativeHandle(ref, () => {
      return {
        startAnimation: start,
        stopAnimation: stop,
      };
    });

    return (
      <motion.div
        ref={scope}
        onHoverStart={start}
        onHoverEnd={stop}
        className={`inline-flex cursor-pointer ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill={fill}
          stroke={color}
          strokeWidth={scaledStrokeWidth(strokeWidth, 48)}
          strokeMiterlimit="10"
          strokeLinecap="square"
        >
          <motion.path
            className="bookmark-body"
            style={{ transformOrigin: '50% 20%' }}
            d="M24 34L41 44V8C41 5.23858 38.7614 3 36 3H12C9.23858 3 7 5.23858 7 8V44L24 34Z"
          />
        </svg>
      </motion.div>
    );
  },
);

BookmarkIcon.displayName = 'BookmarkIcon';

export default BookmarkIcon;
