'use client';

import { motion } from 'framer-motion';
import { ReactNode, useRef, useEffect } from 'react';

interface SlideTabsProps {
  index: number;
  children: ReactNode[];
}

export default function SlideTabs({ index, children }: SlideTabsProps) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {children.map((child, i) => {
        const isActive = i === index;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={
              isFirstRender.current
                ? { duration: 0 }
                : { duration: 0.3, ease: 'easeInOut' }
            }
            className={`absolute w-full h-full top-0 left-0 ${
              !isActive ? 'pointer-events-none' : ''
            }`}
            style={{ zIndex: isActive ? 10 : 0 }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
