import Image from "next/image";

export function HeroDivider() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full z-20 -mt-6 sm:-mt-8 md:-mt-10 lg:-mt-12 pointer-events-none select-none leading-none overflow-hidden"
    >
      <Image
        src="/assets/textures/Teal and Gold Brushstroke Wave Divider.png"
        alt=""
        width={2172}
        height={155}
        priority
        sizes="100vw"
        className="w-full h-auto block"
      />
    </div>
  );
}
