'use client';

import { motion } from 'framer-motion';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface SlideTabsProps {
  index: number;
  children: ReactNode[];
}

export default function SlideTabs({ index, children }: SlideTabsProps) {
  const prevIndexRef = useRef(index);
  const isFirstRender = useRef(true);
  const [prevIndex, setPrevIndex] = useState(index);
  const [isAnimating, setIsAnimating] = useState(false);

  const direction = index > prevIndex ? -1 : 1;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setPrevIndex(index); // update immediately without animating
      return;
    }

    if (index !== prevIndexRef.current) {
      setIsAnimating(true);

      const timeout = setTimeout(() => {
        setPrevIndex(index);
        setIsAnimating(false);
        prevIndexRef.current = index;
      }, 300); // match animation duration

      return () => clearTimeout(timeout);
    }
  }, [index, prevIndex]);

  const current = children[index];
  const previous = children[prevIndex];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* OUTGOING tab (only shown during transition) */}
      {isAnimating && (
        <motion.div
          key={`prev-${prevIndex}`}
          initial={{ x: '0%' }}
          animate={{ x: `${100 * direction}%` }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute w-full h-full top-0 left-0 z-10"
        >
          {previous}
        </motion.div>
      )}

      {/* INCOMING tab */}
      <motion.div
        key={`curr-${index}`}
        initial={isFirstRender.current ? false : { x: `${-100 * direction}%` }}
        animate={{ x: '0%' }}
        transition={{ duration: isFirstRender.current ? 0 : 0.3, ease: 'easeInOut' }}
        className="absolute w-full h-full top-0 left-0 z-20"
      >
        {current}
      </motion.div>
    </div>
  );
}
