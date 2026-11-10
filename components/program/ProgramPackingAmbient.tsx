"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";

const birds = [
  { src: "elem-flying-bird-single-1.webp", width: 170, height: 81, position: "left-[49%] top-[6%] w-14", pose: "", delay: 0.36, fromX: 0, fromY: -22, entryRotate: 0 },
  { src: "elem-flying-bird-single-2.webp", width: 137, height: 62, position: "left-[46%] top-[12%] w-10", pose: "-rotate-12", delay: 0.48, fromX: -34, fromY: 12, entryRotate: -12 },
  { src: "elem-flying-bird-single-3.webp", width: 151, height: 64, position: "left-[52%] top-[12%] w-9", pose: "rotate-6", delay: 0.56, fromX: 34, fromY: 12, entryRotate: 12 },
  { src: "elem-flying-bird-single-4.webp", width: 154, height: 71, position: "left-[45%] top-[16%] w-8", pose: "rotate-12", delay: 0.66, fromX: -42, fromY: 16, entryRotate: -16 },
  { src: "elem-flying-bird-single-2.webp", width: 137, height: 62, position: "left-[54%] top-[16%] w-7", pose: "-rotate-12", delay: 0.74, fromX: 42, fromY: 16, entryRotate: 16 },
  { src: "elem-flying-bird-single-3.webp", width: 151, height: 64, position: "left-[8%] top-[28%] w-8", pose: "rotate-6 opacity-40", delay: 0.88, fromX: -38, fromY: 9, entryRotate: -11 },
  { src: "elem-flying-bird-single-1.webp", width: 170, height: 81, position: "left-[11%] top-[24%] w-11", pose: "-rotate-12 opacity-45", delay: 0.98, fromX: -48, fromY: 13, entryRotate: -14 },
  { src: "elem-flying-bird-single-2.webp", width: 137, height: 62, position: "left-[14%] top-[30%] w-6", pose: "rotate-12 opacity-35", delay: 1.08, fromX: -34, fromY: 17, entryRotate: -9 },
  { src: "elem-flying-bird-single-4.webp", width: 154, height: 71, position: "right-[7%] top-[25%] w-9", pose: "-rotate-6 opacity-40", delay: 1.2, fromX: 38, fromY: 9, entryRotate: 11 },
  { src: "elem-flying-bird-single-1.webp", width: 170, height: 81, position: "right-[11%] top-[21%] w-12", pose: "rotate-12 opacity-45", delay: 1.3, fromX: 48, fromY: 13, entryRotate: 14 },
  { src: "elem-flying-bird-single-2.webp", width: 137, height: 62, position: "right-[14%] top-[27%] w-7", pose: "-rotate-12 opacity-35", delay: 1.4, fromX: 34, fromY: 17, entryRotate: 9 },
] as const;

type VegetationAssetProps = {
  src: string;
  width: number;
  height: number;
  position: string;
  imageClass?: string;
  entry: "base" | "leaf" | "palm" | "flower";
  delay: number;
  fromSide?: -1 | 1;
  reduceMotion: boolean;
  sceneIsInView: boolean;
};

function VegetationAsset({
  src,
  width,
  height,
  position,
  imageClass = "",
  entry,
  delay,
  fromSide = -1,
  reduceMotion,
  sceneIsInView,
}: VegetationAssetProps) {
  const hidden = entry === "leaf"
    ? { opacity: 0, x: fromSide * 54, y: 8, rotate: fromSide * 10 }
    : entry === "palm"
      ? { opacity: 0, y: 38, scale: 0.96, rotate: fromSide * 5 }
      : entry === "flower"
        ? { opacity: 0, z: 220, y: -115, scale: 1.85, rotateX: 38, rotateZ: -12 }
        : { opacity: 0, x: fromSide * 22, y: 12, scale: 0.95, rotate: fromSide * 8 };
  const visible = { opacity: 1, x: 0, y: 0, scale: 1, z: 0, rotate: 0, rotateX: 0, rotateZ: 0 };
  const transition = entry === "flower"
    ? { type: "spring" as const, stiffness: 92, damping: 18, mass: 0.82, delay: reduceMotion ? 0 : delay }
    : { duration: reduceMotion ? 0 : entry === "base" ? 0.62 : entry === "palm" ? 0.84 : 0.7, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  return (
    <motion.div
      className={`absolute ${position}`}
      style={entry === "flower" ? { perspective: 720 } : undefined}
    >
      <motion.div
        initial={reduceMotion ? false : hidden}
        animate={sceneIsInView || reduceMotion ? visible : hidden}
        transition={transition}
      >
        <Image src={src} alt="" width={width} height={height} className={`block h-auto w-full ${imageClass}`} />
      </motion.div>
    </motion.div>
  );
}

export function ProgramPackingAmbient() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const sceneIsInView = useInView(sceneRef, { once: true, amount: 0.08 });
  const reduceMotion = Boolean(useReducedMotion());

  return (
    <div ref={sceneRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
      <div className="absolute inset-0 opacity-35">
        {birds.map((bird, index) => (
          <motion.div
            key={`${bird.src}-${bird.position}`}
            initial={reduceMotion ? false : { opacity: 0, x: bird.fromX, y: bird.fromY, scale: 0.82, rotate: bird.entryRotate }}
            animate={sceneIsInView || reduceMotion ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 } : { opacity: 0, x: bird.fromX, y: bird.fromY, scale: 0.82, rotate: bird.entryRotate }}
            transition={{ duration: reduceMotion ? 0 : 0.62, delay: reduceMotion ? 0 : bird.delay, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute ${bird.position}`}
          >
            <motion.div
              animate={sceneIsInView && !reduceMotion ? {
                x: [0, bird.fromX < 0 ? 5 : -5, 0, bird.fromX < 0 ? -3 : 3, 0],
                y: [0, -4, -1, 2, 0],
                rotate: [0, bird.fromX < 0 ? 1.6 : -1.6, 0, bird.fromX < 0 ? -1 : 1, 0],
              } : { x: 0, y: 0, rotate: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 5.8 + (index % 5) * 0.72,
                delay: reduceMotion ? 0 : bird.delay + 0.62 + (index % 3) * 0.12,
                repeat: reduceMotion ? 0 : Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            >
              <Image
                src={`/assets/elements/${bird.src}`}
                alt=""
                width={bird.width}
                height={bird.height}
                className={`h-auto w-full ${bird.pose}`}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 z-20 h-64 w-72 opacity-70">
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-tropical-bush-large.webp" width={343} height={337} position="-bottom-16 -left-20 w-72" entry="base" delay={0.04} />
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-palm-frond-leaf.webp" width={294} height={250} position="-bottom-16 left-12 w-56" imageClass="-rotate-12" entry="leaf" delay={0.18} fromSide={-1} />
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-tropical-leaf-green-yellow.webp" width={331} height={183} position="-bottom-4 -left-16 w-64" imageClass="rotate-[-28deg]" entry="leaf" delay={0.36} fromSide={-1} />
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-palm-tree-tall-curved.webp" width={346} height={544} position="bottom-[51px] -left-10 w-[18rem] max-w-none" imageClass="-rotate-6" entry="palm" delay={1.2} />
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-hibiscus-flower-red.webp" width={197} height={183} position="bottom-10 left-14 w-16" imageClass="rotate-12" entry="flower" delay={2.06} />
      </div>

      <div className="absolute bottom-0 right-0 z-20 h-64 w-72 opacity-70">
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-tropical-bush-large.webp" width={343} height={337} position="-bottom-16 -right-20 w-72" imageClass="scale-x-[-1]" entry="base" delay={0.12} fromSide={1} />
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-palm-frond-leaf.webp" width={294} height={250} position="-bottom-16 right-12 w-56" imageClass="rotate-12 scale-x-[-1]" entry="leaf" delay={0.28} fromSide={1} />
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-tropical-leaf-green-yellow.webp" width={331} height={183} position="-bottom-4 -right-16 w-64" imageClass="rotate-[28deg] scale-x-[-1]" entry="leaf" delay={0.46} fromSide={1} />
        <VegetationAsset reduceMotion={reduceMotion} sceneIsInView={sceneIsInView} src="/assets/elements/elem-hibiscus-flower-yellow.webp" width={214} height={197} position="bottom-10 right-14 w-16" imageClass="-rotate-12" entry="flower" delay={1.78} fromSide={1} />
      </div>
    </div>
  );
}
