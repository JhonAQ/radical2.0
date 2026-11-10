"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

type AnimatedSeabirdProps = {
  src: string;
  style: CSSProperties;
  revealed: boolean;
  active: boolean;
  seed: number;
  rotate?: number;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
};

export function AnimatedSeabird({ src, style, revealed, active, seed, rotate = 0, width = 170, height = 81, className = "", sizes }: AnimatedSeabirdProps) {
  const reduceMotion = Boolean(useReducedMotion());
  const direction = seed % 2 === 0 ? -1 : 1;
  const fromX = direction * (32 + (seed % 3) * 9);
  const fromY = seed % 3 === 0 ? -22 : 16;
  const delay = 0.1 + (seed % 4) * 0.17;
  const entryDuration = 1.05 + (seed % 3) * 0.08;
  const drift = 6 + (seed % 3) * 2;
  const lift = 4 + (seed % 4);
  const show = revealed || reduceMotion;

  return (
    <div className={`absolute ${className}`} style={style}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: fromX, y: fromY, rotate: direction * 12, scale: 0.84 }}
        animate={reduceMotion ? { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 } : show ? { opacity: [0, 0.9, 1], x: [fromX, fromX * 0.25, 0], y: [fromY, -5, 0], rotate: [direction * 12, -direction * 2, 0], scale: [0.84, 1.01, 1] } : { opacity: 0, x: fromX, y: fromY, rotate: direction * 12, scale: 0.84 }}
        transition={{ duration: reduceMotion ? 0 : entryDuration, delay: reduceMotion ? 0 : delay, times: [0, 0.65, 1], ease: "easeOut" }}
      >
        <motion.div
          animate={active && !reduceMotion ? {
            x: [0, direction * drift, direction * drift * 0.4, -direction * drift * 0.6, 0],
            y: [0, -lift, -lift * 0.3, lift * 0.5, 0],
            rotate: [0, -direction * 2.8, direction * 0.8, direction * 1.8, 0],
          } : { x: 0, y: 0, rotate: 0 }}
          transition={{ duration: reduceMotion ? 0 : 6.4 + (seed % 5) * 0.73, delay: reduceMotion ? 0 : delay + entryDuration, repeat: reduceMotion ? 0 : Infinity, times: [0, 0.27, 0.5, 0.77, 1], ease: "easeInOut" }}
        >
          <Image src={src} alt="" width={width} height={height} sizes={sizes ?? `${typeof style.width === "number" ? style.width : 48}px`} className="!static block h-auto !w-full" style={{ transform: `rotate(${rotate}deg)` }} />
        </motion.div>
      </motion.div>
    </div>
  );
}
