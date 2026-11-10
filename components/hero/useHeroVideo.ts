"use client";

import { useEffect, useRef, useState } from "react";
import media from "./hero-media.json";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export function useHeroVideo() {
  const hostRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const userPausedRef = useRef(false);
  const manualRequestedRef = useRef(false);
  const updatePlaybackRef = useRef<() => void>(() => {});

  useEffect(() => {
    const host = hostRef.current;
    const poster = posterRef.current;
    const video = videoRef.current;
    if (!host || !poster || !video) return;

    const desktop = window.matchMedia("(min-width: 768px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    let disposed = false;
    let inView = false;
    let posterReady = false;
    let source: "webm" | "mp4" | null = null;
    let failed = false;
    let generation = 0;
    let cancelScheduled: (() => void) | undefined;
    let cancelFrame: (() => void) | undefined;

    const allowed = () => manualRequestedRef.current || (!reducedMotion.matches && !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType ?? ""));
    const currentMedia = () => desktop.matches ? media.desktop : media.mobile;

    function cancelPending() {
      cancelScheduled?.();
      cancelScheduled = undefined;
      cancelFrame?.();
      cancelFrame = undefined;
    }

    function unload() {
      generation++;
      cancelPending();
      video!.pause();
      video!.removeAttribute("src");
      video!.load();
      source = null;
      setIsPlaying(false);
    }

    function play() {
      if (!video!.paused) return;
      const version = generation;
      void video!.play().catch(() => {
        // Autoplay may be blocked (for example, by low-power mode).
        if (!disposed && version === generation) setIsPlaying(false);
      });
    }

    function updatePlayback() {
      if (disposed) return;
      if (!allowed()) {
        if (source) unload();
        else cancelPending();
        return;
      }
      if (!inView || document.hidden || userPausedRef.current) {
        cancelPending();
        video!.pause();
        return;
      }
      if ((!posterReady && !manualRequestedRef.current) || failed) return;
      if (source) {
        play();
        return;
      }
      if (cancelScheduled) return;

      const start = () => {
        cancelScheduled = undefined;
        if (disposed || !inView || document.hidden || userPausedRef.current || !allowed()) return;
        // Prefer hardware-friendly H.264 on phones; VP9 remains the desktop choice.
        source = desktop.matches && video!.canPlayType('video/webm; codecs="vp9"') ? "webm" : "mp4";
        video!.muted = true;
        video!.defaultMuted = true;
        video!.playsInline = true;
        video!.src = currentMedia()[source];
        video!.load();
        play();
      };
      if (manualRequestedRef.current) {
        start(); // Keep play() inside the user's tap when autoplay was blocked.
      } else if ("requestIdleCallback" in window) {
        const id = window.requestIdleCallback(start, { timeout: 1500 });
        cancelScheduled = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(start, 250);
        cancelScheduled = () => clearTimeout(id);
      }
    }

    function imageLoaded() {
      if (!poster!.complete || !poster!.naturalWidth) return;
      const version = generation;
      // Wait for the selected responsive poster to decode before fetching video.
      void poster!.decode().catch(() => {}).then(() => {
        if (disposed || version !== generation) return;
        posterReady = true;
        updatePlayback();
      });
    }

    function breakpointChanged() {
      unload();
      failed = false;
      posterReady = false;
      // Allow <picture> to select its new source before decoding it.
      const id = requestAnimationFrame(() => {
        cancelScheduled = undefined;
        imageLoaded();
      });
      cancelScheduled = () => cancelAnimationFrame(id);
    }

    function playing() {
      cancelFrame?.();
      const version = generation;
      const reveal = () => {
        cancelFrame?.();
        cancelFrame = undefined;
        if (!disposed && version === generation && !video!.paused && allowed()) setIsPlaying(true);
      };
      // Some mobile browsers throttle frame callbacks on transparent video.
      // The playing event + HAVE_CURRENT_DATA also establishes a usable frame.
      let cancelCompositor: () => void;
      if (typeof video!.requestVideoFrameCallback === "function") {
        const id = video!.requestVideoFrameCallback(reveal);
        cancelCompositor = () => video!.cancelVideoFrameCallback(id);
      } else {
        const id = requestAnimationFrame(reveal);
        cancelCompositor = () => cancelAnimationFrame(id);
      }
      const timeout = setTimeout(() => {
        if (video!.readyState >= 2) reveal();
      }, 200);
      cancelFrame = () => {
        cancelCompositor();
        clearTimeout(timeout);
      };
    }

    function error() {
      if (!source || disposed) return;
      setIsPlaying(false);
      if (source === "webm" && allowed() && inView && !document.hidden) {
        generation++;
        cancelPending();
        source = "mp4";
        video!.src = currentMedia().mp4;
        video!.load();
        play();
      } else {
        failed = true;
        unload();
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePlayback();
    });
    updatePlaybackRef.current = () => {
      failed = false;
      updatePlayback();
    };
    observer.observe(host);
    poster.addEventListener("load", imageLoaded);
    document.addEventListener("visibilitychange", updatePlayback);
    desktop.addEventListener("change", breakpointChanged);
    reducedMotion.addEventListener("change", updatePlayback);
    connection?.addEventListener("change", updatePlayback);
    video.addEventListener("playing", playing);
    video.addEventListener("error", error);
    imageLoaded();

    return () => {
      disposed = true;
      updatePlaybackRef.current = () => {};
      generation++;
      cancelPending();
      observer.disconnect();
      poster.removeEventListener("load", imageLoaded);
      document.removeEventListener("visibilitychange", updatePlayback);
      desktop.removeEventListener("change", breakpointChanged);
      reducedMotion.removeEventListener("change", updatePlayback);
      connection?.removeEventListener("change", updatePlayback);
      video.removeEventListener("playing", playing);
      video.removeEventListener("error", error);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  function togglePlayback() {
    if (!isPlaying) manualRequestedRef.current = true;
    userPausedRef.current = isPlaying ? !userPausedRef.current : false;
    setUserPaused(userPausedRef.current);
    updatePlaybackRef.current();
  }

  return { hostRef, posterRef, videoRef, isPlaying, userPaused, togglePlayback };
}
