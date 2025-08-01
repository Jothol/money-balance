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
      setPrevIndex(index);
      return;
    }

    if (index !== prevIndexRef.current) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setPrevIndex(index);
        setIsAnimating(false);
        prevIndexRef.current = index;
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [index, prevIndex]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {children.map((child, i) => {
        const isActive = i === index;
        const isPrevious = i === prevIndex;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={
              isActive
                ? { x: '0%', opacity: 1, zIndex: 20 }
                : isAnimating && isPrevious
                ? { x: `${100 * direction}%`, opacity: 0, zIndex: 10 }
                : { opacity: 0, zIndex: 0 }
            }
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`absolute w-full h-full top-0 left-0 ${
              !isActive && !isPrevious ? 'pointer-events-none' : ''
            }`}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
