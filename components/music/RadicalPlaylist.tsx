"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import dynamic from "next/dynamic";
import "./playlist.css";
import Image from "next/image";
import { Headphones, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";

const MediaPlayer = dynamic(() => import("react-player"), { ssr: false });

function clockTime(seconds: number) {
  return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
}

const radicalSong = "/assets/mp3/radical-music.mp3";

type Track = { title: string; artist: string; videoId?: string };

const tracks: Track[] = [
  { title: "Canción de Radical", artist: "RadicalCamp" },
  { title: "No hay lugar más alto", artist: "Miel San Marcos y Christine D’Clario", videoId: "wb99ILqk2dc" },
  { title: "Jesucristo basta", artist: "Un Corazón", videoId: "eYTIdVFdQXw" },
  { title: "Como dijiste", artist: "Christine D’Clario", videoId: "3uUJCvdbH3k" },
  { title: "La bendición", artist: "Elevation Worship", videoId: "pVb8rGuIkag" },
  { title: "Danzo en el río", artist: "Miel San Marcos", videoId: "A_41_4qgmig" },
  { title: "Todo va a estar bien", artist: "Redimi2 y Evan Craft", videoId: "5QqP7Cyc0nw" },
];

export function RadicalPlaylist() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<{ pointerId: number; y: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOutsideHero, setIsOutsideHero] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const track = tracks[selectedIndex ?? 0];
  const videoId = track.videoId;

  useEffect(() => {
    const hero = document.getElementById("inicio");
    if (!hero) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsOutsideHero(!entry.isIntersecting);
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    function openPanel() {
      if (!dialog) return;
      if (dialog.open) dialog.close();
      if (mobile.matches) dialog.showModal();
      else dialog.show();
    }
    openPanel();
    mobile.addEventListener("change", openPanel);
    return () => {
      mobile.removeEventListener("change", openPanel);
      dialog.close();
    };
  }, [isOpen]);

  function selectTrack(index: number) {
    setAudioFailed(false);
    setTime(0);
    setDuration(0);
    setAttempt(value => value + 1);
    setPlaying(true);
    setSelectedIndex(index);
    contentRef.current?.scrollTo({ top: 0 });
  }

  function togglePlayback() {
    if (selectedIndex === null || audioFailed) {
      selectTrack(selectedIndex ?? 0);
    } else {
      setPlaying(!playing);
    }
  }

  function closePlayer() {
    setIsOpen(false);
    setTime(0);
    setDuration(0);
    setPlaying(false);
    setSelectedIndex(null);
    setAudioFailed(false);
    triggerRef.current?.focus();
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const dialog = dialogRef.current;
    if (!dialog?.matches(":modal") || !event.isPrimary || event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest("button")) return;
    swipeStart.current = { pointerId: event.pointerId, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    dialog.dataset.dragging = "true";
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const offset = Math.max(0, event.clientY - start.y);
    dialogRef.current?.style.setProperty("--sheet-offset", offset + "px");
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    const dialog = dialogRef.current;
    if (!start || start.pointerId !== event.pointerId || !dialog) return;
    swipeStart.current = null;
    delete dialog.dataset.dragging;
    dialog.style.removeProperty("--sheet-offset");
    if (event.type === "pointerup" && event.clientY - start.y > Math.min(112, dialog.offsetHeight * 0.28)) {
      closePlayer();
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[101] flex justify-end lg:inset-x-6 lg:bottom-23" onKeyDown={(event) => { if (isOpen && event.key === "Escape") closePlayer(); }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Playlist Radical"
        aria-expanded={isOpen}
        aria-controls={isOpen ? "playlist-radical" : undefined}
        disabled={!isOutsideHero}
        onClick={() => isOpen ? closePlayer() : setIsOpen(true)}
        className={`grid size-14 place-items-center rounded-full bg-amarillo text-azul-profundo shadow-[0_8px_24px_rgba(11,45,54,0.25)] transition-[opacity,transform,background-color] duration-200 hover:bg-crema focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-turquesa motion-reduce:transition-none ${isOutsideHero ? "pointer-events-auto opacity-100" : "translate-y-2 opacity-0"}`}
      >
        <Headphones aria-hidden="true" className="size-6" />
      </button>

      <dialog ref={dialogRef}
        onCancel={event => { event.preventDefault(); closePlayer(); }}
        onClick={event => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientY < rect.top || event.clientY > rect.bottom || event.clientX < rect.left || event.clientX > rect.right) closePlayer();
        }}
        id="playlist-radical" inert={!isOpen} data-open={isOpen} aria-labelledby="playlist-heading" className="radical-player-panel pointer-events-auto absolute right-0 bottom-[calc(100%+0.75rem)] flex max-h-[min(38rem,calc(100dvh-10rem-env(safe-area-inset-bottom)))] w-full max-w-[25rem] flex-col overflow-hidden rounded-2xl bg-azul-profundo text-crema shadow-[0_14px_40px_rgba(11,45,54,0.36)]">
          <div className="radical-sheet-header flex shrink-0 items-center justify-between gap-3 border-b border-crema/20 px-4 py-2"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
          >
            <h2 id="playlist-heading" className="font-radical-display text-2xl leading-none sm:text-3xl">Playlist Radical</h2>
            <button type="button" aria-label="Cerrar reproductor" onClick={closePlayer} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amarillo">
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div ref={contentRef} className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:var(--radical-teal)_var(--radical-blue)] [scrollbar-width:thin]">
            <div className="p-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-radical-dark">
                {!videoId && <Image src="/assets/activities/live-worship.jpg" alt="" fill sizes="368px" className="object-cover" />}
                {isOpen && selectedIndex !== null && (
                  <MediaPlayer key={attempt} ref={mediaRef}
                    src={videoId ? `https://www.youtube.com/watch?v=${videoId}` : radicalSong}
                    className={videoId ? "absolute inset-0" : "invisible absolute size-px"}
                    style={{ width: videoId ? "100%" : 1, height: videoId ? "100%" : 1 }}
                    playing={playing} playsInline controls={false}
                    onPlaying={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onTimeUpdate={() => setTime(mediaRef.current?.currentTime || 0)}
                    onDurationChange={() => {
                      const length = mediaRef.current?.duration;
                      setDuration(length && Number.isFinite(length) ? length : 0);
                    }}
                    onEnded={() => {
                      if (selectedIndex < tracks.length - 1) selectTrack(selectedIndex + 1);
                      else setPlaying(false);
                    }}
                    onError={() => { setAudioFailed(true); setPlaying(false); }}
                  />
                )}
              </div>
            </div>

            <div className="border-t border-crema/20 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <Headphones aria-hidden="true" className="size-4 text-turquesa" /> Lista de canciones
              </h3>
              <ol className="divide-y divide-crema/15">
                {tracks.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <li key={item.title}>
                      <button
                        type="button"
                        onClick={() => isSelected ? togglePlayback() : selectTrack(index)}
                        aria-current={isSelected ? "true" : undefined}
                        className={`flex min-h-12 w-full items-center gap-3 px-2 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amarillo ${isSelected ? "bg-white/10 text-amarillo" : ""}`}
                      >
                        <span aria-hidden="true" className="w-5 shrink-0 text-center text-xs tabular-nums">{isSelected ? <Play className="mx-auto size-3 fill-current" /> : index + 1}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">{item.title}</span>
                          <span className="block text-xs text-crema/80">{item.artist}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
          <footer className="shrink-0 border-t border-crema/20 bg-azul-profundo px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <div key={track.title} className="radical-track-title min-w-0" aria-live="polite">
                <p className="font-bebas text-xl leading-none">{track.title}</p>
                <p className="mt-1 text-xs text-crema/80">{track.artist}</p>
              </div>
              <div className="radical-transport flex items-center shrink-0 justify-center gap-0.5">
                <button type="button" aria-label="Canción anterior" onClick={() => selectTrack(((selectedIndex ?? 0) - 1 + tracks.length) % tracks.length)}><SkipBack /></button>
                <button type="button" aria-label={playing ? "Pausar" : "Reproducir"} className="bg-amarillo text-azul-profundo" onClick={togglePlayback}>{playing ? <Pause /> : <Play />}</button>
                <button type="button" aria-label="Canción siguiente" onClick={() => selectTrack(((selectedIndex ?? 0) + 1) % tracks.length)}><SkipForward /></button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs tabular-nums text-crema/80">
              <span className="min-w-8">{clockTime(time)}</span>
                <input type="range" aria-label="Posición de reproducción" aria-valuetext={clockTime(time)}
                  className="h-5 min-w-0 flex-1 cursor-pointer accent-turquesa" min={0} max={duration || 1} step={0.1}
                  disabled={!duration} value={Math.min(time, duration)}
                  onChange={event => {
                    const seconds = event.currentTarget.valueAsNumber;
                    if (mediaRef.current) mediaRef.current.currentTime = seconds;
                    setTime(seconds);
                  }}
                />
              <span className="min-w-8 text-right">{duration ? clockTime(duration) : "—"}</span>
            </div>
            {audioFailed && <p role="status" className="mt-3 text-sm text-amarillo">No pudimos cargar la canción. Pulsa reproducir para reintentar.</p>}
          </footer>
      </dialog>
    </div>
  );
}
