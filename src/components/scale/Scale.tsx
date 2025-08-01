'use client';

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef
} from 'react';
import Image from 'next/image';
import Bar from './Bar';
import Cup, { CupHandle } from './Cup';

export interface ScaleHandle {
  setBalance: (share1: number, share2: number, direct1: number, direct2: number) => void;
  updateBalance: (share1: number, share2: number, direct1: number, direct2: number) => void;
}

const Scale = forwardRef<ScaleHandle>((_, ref) => {
  const balanceSize = 300;
  const cupSize = balanceSize/3;
  const barLength = balanceSize - cupSize;

  const [angle, setAngle] = useState(0);
  const leftCupRef = useRef<CupHandle>(null);
  const rightCupRef = useRef<CupHandle>(null);

  const prevCounts = useRef({
    leftGold: 0,
    leftSilver: 0,
    rightGold: 0,
    rightSilver: 0,
  });

  const updateAngle = () => {
    const leftCount = leftCupRef.current?.getWeightCount() ?? 0;
    const rightCount = rightCupRef.current?.getWeightCount() ?? 0;
    const delta = rightCount - leftCount;
    const newAngle = Math.max(-25, Math.min(25, delta * 5));
    setAngle(newAngle);
  };

  const applyWeights = (
    leftGold: number,
    leftSilver: number,
    rightGold: number,
    rightSilver: number,
    seed: number
  ) => {
    function mulberry32(a: number) {
      return function () {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const rand = mulberry32(seed);
    const options = ['leftGold', 'leftSilver', 'rightGold', 'rightSilver'] as const;

    while (leftGold > 0 || leftSilver > 0 || rightGold > 0 || rightSilver > 0) {
      const choice = options[Math.floor(rand() * options.length)];
      switch (choice) {
        case 'leftGold':
          if (leftGold > 0) {
            leftCupRef.current?.addWeight('gold');
            leftGold--;
          }
          break;
        case 'leftSilver':
          if (leftSilver > 0) {
            leftCupRef.current?.addWeight('silver');
            leftSilver--;
          }
          break;
        case 'rightGold':
          if (rightGold > 0) {
            rightCupRef.current?.addWeight('gold');
            rightGold--;
          }
          break;
        case 'rightSilver':
          if (rightSilver > 0) {
            rightCupRef.current?.addWeight('silver');
            rightSilver--;
          }
          break;
      }
    }
  };

  useImperativeHandle(ref, () => ({
    setBalance: (share1, share2, direct1, direct2) => {
      leftCupRef.current?.clearWeight();
      rightCupRef.current?.clearWeight();

      const leftGold = Math.floor(share1 / 80);
      const leftSilver = Math.floor(direct1 / 40);
      const rightGold = Math.floor(share2 / 80);
      const rightSilver = Math.floor(direct2 / 40);
      const seed = share1 + share2 + direct1 + direct2;

      applyWeights(leftGold, leftSilver, rightGold, rightSilver, seed);

      prevCounts.current = { leftGold, leftSilver, rightGold, rightSilver };

      requestAnimationFrame(() => requestAnimationFrame(updateAngle));

    },

    updateBalance: (share1, share2, direct1, direct2) => {
      const newLeftGold = Math.floor(share1 / 80);
      const newLeftSilver = Math.floor(direct1 / 40);
      const newRightGold = Math.floor(share2 / 80);
      const newRightSilver = Math.floor(direct2 / 40);
      const seed = share1 + share2 + direct1 + direct2;

      const deltaLeftGold = newLeftGold - prevCounts.current.leftGold;
      const deltaLeftSilver = newLeftSilver - prevCounts.current.leftSilver;
      const deltaRightGold = newRightGold - prevCounts.current.rightGold;
      const deltaRightSilver = newRightSilver - prevCounts.current.rightSilver;

      applyWeights(
        Math.max(0, deltaLeftGold),
        Math.max(0, deltaLeftSilver),
        Math.max(0, deltaRightGold),
        Math.max(0, deltaRightSilver),
        seed
      );

      for (let i = 0; i < -deltaLeftGold; i++) leftCupRef.current?.removeWeight('gold');
      for (let i = 0; i < -deltaLeftSilver; i++) leftCupRef.current?.removeWeight('silver');
      for (let i = 0; i < -deltaRightGold; i++) rightCupRef.current?.removeWeight('gold');
      for (let i = 0; i < -deltaRightSilver; i++) rightCupRef.current?.removeWeight('silver');

      prevCounts.current = {
        leftGold: newLeftGold,
        leftSilver: newLeftSilver,
        rightGold: newRightGold,
        rightSilver: newRightSilver,
      };

      requestAnimationFrame(() => requestAnimationFrame(updateAngle));

    },
  }));

  return (
    <div
        className="relative mt-8"
        style={{ width: `${balanceSize}px`, height: `${balanceSize}px`}}
    >
        {/* Stand image (behind bar and cups) */}
        <Image
            src="/images/stand.png"
            alt="Stand"
            fill
            style={{
            objectFit: 'contain',
            objectPosition: 'bottom',
            }}
            priority
        />

        {/* Bar and Cups (on top of stand) */}
        <Bar angle={angle} barLength={barLength} />
        <Cup
        ref={leftCupRef}
        angle={angle}
        cupSize={cupSize}
        barLength={barLength}
        side="left"
        />
        <Cup
        ref={rightCupRef}
        angle={angle}
        cupSize={cupSize}
        barLength={barLength}
        side="right"
        />
    </div>
    );
});

Scale.displayName = 'Scale';

export default Scale;
