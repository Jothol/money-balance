'use client';

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo
} from 'react';
import Image from 'next/image';

export interface CupHandle {
  addWeight: (type: string) => void;
  removeWeight: (type: string) => void;
  clearWeight: () => void;
  getWeightCount: () => number;
}

interface CupProps {
  angle: number;
  cupSize: number;
  barLength: number;
  side: 'left' | 'right';
}

const Cup = forwardRef<CupHandle, CupProps>(function Cup(
  { angle, cupSize, barLength, side },
  ref
) {
  const [weights, setWeights] = useState<string[]>([]);

    const weightHeight = (212 / 352) * (cupSize / 5);
    const weightLength = cupSize / 5;

    const weightLocations = useMemo(() => [
    [0, 0],
    [weightLength, 0],
    [weightLength / 2, weightHeight],
    [2 * weightLength, 0],
    [1.5 * weightLength, weightHeight],
    [weightLength, 2 * weightHeight],
    [3 * weightLength, 0],
    [2.5 * weightLength, weightHeight],
    [2 * weightLength, 2 * weightHeight],
    [1.5 * weightLength, 3 * weightHeight],
    [4 * weightLength, 0],
    [3.5 * weightLength, weightHeight],
    [3 * weightLength, 2 * weightHeight],
    [2.5 * weightLength, 3 * weightHeight],
    [2 * weightLength, 4 * weightHeight],
    ], [weightLength, weightHeight]);


  const angleRad = (angle * Math.PI) / 180;
  const radius = barLength / 2;
  const xShift = radius * Math.cos(angleRad);
  const yShift = radius * Math.sin(angleRad);
  const x = side === 'right' ? xShift : -xShift;
  const y = side === 'right' ? yShift : -yShift;

  useImperativeHandle(ref, () => ({
    addWeight: (type: string) => {
      setWeights(prev => {
        if (prev.length >= 15) return prev;
        return [...prev, type];
      });
    },
    removeWeight: (type: string) => {
      setWeights(prev => {
        const index = prev.findLastIndex(w => w === type);
        if (index === -1) return prev;
        const copy = [...prev];
        copy.splice(index, 1);
        return copy;
      });
    },
    clearWeight: () => {
      setWeights([]);
    },
    getWeightCount: () => weights.length
  }));

  return (
    <div
        className="absolute left-1/2 top-0 flex items-end justify-center"
        style={{
            transform: `translate(${-cupSize / 2}px, 0) translate(${x}px, ${y}px)`,
            width: `${cupSize}px`,
            height: `${cupSize * 0.82}px`,
        }}
    >
        <Image
            src="/images/cup.png"  // Path relative to /public
            alt="Cup"
            width={cupSize}
            height={cupSize}
            style={{
                position: 'absolute',
                bottom: 0,
                transform: `translate(0, ${weightHeight * 3}px)`,
                zIndex: 50,
            }}
        />

        {(() => {
        const length = weights.length;
        let horizontalShift = 0;

        if (length === 1) horizontalShift = (2 * cupSize) / 5;
        else if (length < 4) horizontalShift = (3 * cupSize) / 10;
        else if (length < 7) horizontalShift = cupSize / 5;
        else if (length < 11) horizontalShift = cupSize / 10;

        return weights.map((type, index) => {
            const [x, y] = weightLocations[index] ?? [0, 0];
            const imgSrc =
            type === 'gold'
                ? '/images/gold_ingot.png'
                : type === 'silver'
                ? '/images/silver_ingot.png'
                : '';

            return (
            <div
                key={index}
                className="absolute"
                style={{
                width: `${weightLength}px`,
                height: `${weightHeight}px`,
                transform: `translate(${x + horizontalShift}px, -${y}px)`,
                bottom: 0,
                left: 0,
                }}
            >
                {imgSrc && (
                <Image
                    src={imgSrc}
                    alt={`${type} ingot`}
                    width={cupSize / 5}
                    height={cupSize / 5}
                    style={{ objectFit: 'contain' }}
                />
                )}
            </div>
            );
        });
        })()}
    </div>
    );

});

export default Cup;
