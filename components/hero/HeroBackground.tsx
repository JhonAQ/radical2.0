"use client";

import { Pause, Play } from "lucide-react";
import media from "./hero-media.json";
import { useHeroVideo } from "./useHeroVideo";

export function HeroBackground() {
  const { hostRef, posterRef, videoRef, isPlaying, userPaused, togglePlayback } = useHeroVideo();

  return (
    <>
      <div ref={hostRef} aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <picture>
          <source media="(max-width: 767px)" srcSet={media.mobile.poster} width={media.mobile.width} height={media.mobile.height} />
          {/* Pre-encoded responsive posters: one request, selected before hydration. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={posterRef} src={media.desktop.poster} alt="" width={media.desktop.width} height={media.desktop.height} fetchPriority="high" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center" />
        </picture>
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          width={media.desktop.width}
          height={media.desktop.height}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out motion-reduce:transition-none ${isPlaying ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-azul-profundo/60 via-transparent to-azul-profundo/80 md:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-azul-profundo/40 via-transparent to-azul-profundo/30 md:block" />
        <div className="absolute inset-0 hidden opacity-40 mix-blend-multiply md:block" style={{ backgroundImage: "radial-gradient(circle at 50% 40%, transparent 40%, rgba(11, 45, 54, 0.7) 100%)" }} />
      </div>
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={userPaused || !isPlaying ? "Reproducir video de fondo" : "Pausar video de fondo"}
        aria-pressed={userPaused}
        title={userPaused || !isPlaying ? "Reproducir fondo" : "Pausar fondo"}
        className="absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-azul-profundo/45 text-white backdrop-blur-sm transition-colors hover:bg-azul-profundo/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:bottom-6 sm:right-6"
      >
        {userPaused || !isPlaying ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
      </button>
    </>
  );
}
