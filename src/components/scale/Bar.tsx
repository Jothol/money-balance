'use client';

import { useMemo } from 'react';
import Image from 'next/image';

interface BarProps {
  angle: number; // degrees
  barLength: number;
}

export default function Bar({ angle, barLength }: BarProps) {
  const rotationStyle = useMemo(
    () => ({ transform: `translate(-50%, -50%) rotate(${angle}deg)` }),
    [angle]
  );

  return (
    <div
      className="absolute left-1/2 top-1/6 origin-center"
      style={{ width: `${barLength*1.015}px`, height: 'auto', ...rotationStyle }}
    >
      <Image
        src="/images/bar.png"
        alt="Bar"
        width={barLength}
        height={barLength / 10}
        style={{ width: '100%', height: 'auto' }}
        priority
      />
    </div>
  );
}
