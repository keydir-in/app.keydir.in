'use client';

/**
 * Animated rupee (₹) icon. On every hover the line then the main stroke
 * draw themselves in sequence, then the symbol scales up. Replay is driven
 * by remounting the symbol group with a fresh key, so the animation runs
 * on every hover (not just the first).
 */

import { forwardRef, useImperativeHandle, useState } from 'react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types';
import { motion } from 'motion/react';

const CurrencyRupeeIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  (
    { size = 24, color = 'currentColor', strokeWidth = 2, className = '' },
    ref,
  ) => {
    const [played, setPlayed] = useState(false);
    const [playKey, setPlayKey] = useState(0);

    const handleHoverStart = () => {
      setPlayed(true);
      setPlayKey((k) => k + 1);
    };

    const hidden = played ? { pathLength: 0, opacity: 0 } : false;

    useImperativeHandle(ref, () => ({
      startAnimation: handleHoverStart,
      stopAnimation: () => {},
    }));

    return (
      <motion.svg
        onHoverStart={handleHoverStart}
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
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />

        <motion.g
          key={playKey}
          style={{ transformOrigin: '50% 50%' }}
          initial={played ? { scale: 0.96 } : false}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut', delay: 0.6 }}
        >
          <motion.path
            className="rupee-main"
            d="M18 5h-11h3a4 4 0 0 1 0 8h-3l6 6"
            initial={hidden}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.25 }}
          />

          <motion.path
            className="rupee-line"
            d="M7 9l11 0"
            initial={hidden}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </motion.g>
      </motion.svg>
    );
  },
);

CurrencyRupeeIcon.displayName = 'CurrencyRupeeIcon';

export default CurrencyRupeeIcon;
