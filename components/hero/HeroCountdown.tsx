"use client";

import { useEffect, useState } from "react";
import { CAMP_CONFIG } from "@/config/site";
import { ClockIcon } from "@/components/common/Icons";

interface TimeUnits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function HeroCountdown() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeUnits>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);
    const target = new Date(CAMP_CONFIG.targetCountdownDate).getTime();

    const calculateTime = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        // Fallback dinámico si ya pasó la fecha
        setTimeLeft({ days: 45, hours: 12, minutes: 36, seconds: 20 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 min-h-[76px]">
        {["DÍAS", "HORAS", "MIN", "SEG"].map((label) => (
          <div key={label} className="flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-azul-profundo/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl font-black text-white/40">--</span>
            </div>
            <span className="mt-1 text-[9px] sm:text-[10px] font-bold text-crema/70 uppercase tracking-widest">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { label: "DÍAS", value: timeLeft.days },
    { label: "HORAS", value: timeLeft.hours },
    { label: "MIN", value: timeLeft.minutes },
    { label: "SEG", value: timeLeft.seconds },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-[11px] sm:text-xs font-semibold text-amarillo tracking-wide shadow-xs">
        <ClockIcon className="w-3.5 h-3.5 text-amarillo" />
        <span>Cuenta regresiva para el inicio</span>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-3.5">
        {items.map((item, idx) => {
          const formatted = String(item.value).padStart(2, "0");
          return (
            <div key={item.label} className="flex items-center gap-2 sm:gap-3.5">
              <div className="flex flex-col items-center group">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-azul-profundo/75 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-xl transition-transform group-hover:scale-105">
                  {/* Subtle inner top highlight */}
                  <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-white/5 pointer-events-none" />
                  <span className="relative z-10 text-xl sm:text-2xl font-black text-white tabular-nums drop-shadow-sm">
                    {formatted}
                  </span>
                </div>
                <span className="mt-1.5 text-[9px] sm:text-[10px] font-bold text-crema/80 uppercase tracking-widest">
                  {item.label}
                </span>
              </div>

              {/* Separator dots between units (except last) */}
              {idx < items.length - 1 && (
                <div className="flex flex-col gap-1 pb-4 text-amarillo/60 font-black text-lg select-none">
                  <span>:</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
