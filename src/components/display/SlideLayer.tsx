'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Poster, PosterFitMode, PosterLayoutConfig, PosterTransitionType } from '@/types/index';
import { resolveSlideAnimationClass } from '@/lib/posters/slide-transition';
import { validateLayoutConfig } from '@/lib/posters/layout-engine';
import { MultiAssetStageCanvas } from './MultiAssetStageCanvas';

export interface SlideLayerProps {
  readonly poster: Poster | null;
  readonly role: 'incoming' | 'outgoing' | 'static';
  readonly transition: PosterTransitionType;
  readonly fitMode: PosterFitMode;
  readonly mosqueName?: string | undefined;
  readonly isDrawerOpen?: boolean;
  readonly slideIndex?: number | undefined;
}

function EmptyStageFallback({ mosqueName }: { mosqueName?: string | undefined }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-emerald-950/40">
      <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">
        {mosqueName?.trim() || 'Islamic Community Center'}
      </h2>
      <p className="text-xl text-neutral-400 font-medium">
        Welcome to the house of Allah • Check back shortly for upcoming programs
      </p>
    </div>
  );
}

export function SlideLayer({
  poster,
  role,
  transition,
  fitMode,
  mosqueName,
  isDrawerOpen = false,
  slideIndex,
}: SlideLayerProps) {
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopIterationRef = useRef<number>(1);
  const isVideo = poster?.media_type === 'video';
  const targetLoops = poster?.video_loop_count ?? 1;

  const parsedLayout = useMemo(() => {
    if (!poster?.layout_config) return null;
    try {
      const candidate: unknown = JSON.parse(poster.layout_config);
      if (!validateLayoutConfig(candidate).valid) return null;
      return candidate as PosterLayoutConfig;
    } catch {
      return null;
    }
  }, [poster?.layout_config]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !isVideo || role === 'outgoing') return;
    videoEl.muted = !poster?.allow_audio || isDrawerOpen;
    videoEl.currentTime = 0;
    loopIterationRef.current = 1;
    videoEl.play()?.catch(() => {
      videoEl.muted = true;
      videoEl.play().catch(() => setHasPlaybackError(true));
    });
    return () => {
      try { videoEl.pause(); } catch { /* safe disposal */ }
    };
  }, [poster?.id, isVideo, role === 'outgoing', slideIndex]);

  useEffect(() => {
    if (videoRef.current && isVideo) videoRef.current.muted = !poster?.allow_audio || isDrawerOpen;
  }, [poster?.allow_audio, isDrawerOpen, isVideo]);

  useEffect(() => {
    if (role === 'outgoing' && videoRef.current) {
      try { videoRef.current.pause(); } catch { /* ignore */ }
    }
  }, [role]);

  if (!poster) return <EmptyStageFallback mosqueName={mosqueName} />;

  const isCover = fitMode === 'cover';
  const showCrossFade = isCover && !isVideo;
  const isBackdropVisible = fitMode === 'contain' || isDrawerOpen;
  const { animClass, zIndexClass } = resolveSlideAnimationClass(role, transition);
  const backdropSrc = poster.thumbnail_path || poster.image_path;

  const handleVideoEnded = () => {
    if (loopIterationRef.current >= targetLoops || !videoRef.current) return;
    loopIterationRef.current += 1;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch((err) => console.warn('Video replay loop failed:', err));
  };

  return (
    <div className={`absolute inset-0 overflow-hidden transform-gpu ${zIndexClass} ${animClass}`}>
      {/* Ambient Blurred Backdrop Composite (active in contain mode or when drawer is open) */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-3xl brightness-40 saturate-125 scale-110 pointer-events-none transform-gpu transition-opacity duration-500 ease-in-out"
        style={{
          backgroundImage: `url(${backdropSrc})`,
          backgroundColor: '#0a0a0a',
          opacity: isBackdropVisible ? 1 : 0,
        }}
      />

      {parsedLayout ? (
        <MultiAssetStageCanvas poster={poster} layout={parsedLayout} isDrawerOpen={isDrawerOpen} fitMode={fitMode} mosqueName={mosqueName} slideIndex={slideIndex} />
      ) : (
        <div className="relative w-full h-[calc(100%-4px)] flex items-center justify-center overflow-hidden">
          {isVideo && !hasPlaybackError ? (
            <video
              ref={videoRef}
              src={poster.image_path}
              poster={poster.thumbnail_path ?? undefined}
              muted={!poster.allow_audio || isDrawerOpen}
              playsInline
              autoPlay
              preload="auto"
              onEnded={handleVideoEnded}
              onError={() => setHasPlaybackError(true)}
              className={`${isDrawerOpen ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'} shadow-2xl transition-all duration-500 ease-in-out`}
            />
          ) : showCrossFade ? (
            <>
              {/* Full-bleed cover layer: smoothly fades out when drawer opens */}
              <img
                src={backdropSrc}
                alt={poster.title}
                className="absolute inset-0 w-full h-full object-cover shadow-2xl transition-opacity duration-500 ease-in-out pointer-events-none"
                style={{ opacity: isDrawerOpen ? 0 : 1 }}
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
              {/* Contained layer: preserves 100% of flyer and text without cropping, smoothly fades in when drawer opens */}
              <img
                src={backdropSrc}
                alt={poster.title}
                className="max-w-full max-h-full object-contain shadow-2xl transition-opacity duration-500 ease-in-out"
                style={{ opacity: isDrawerOpen ? 1 : 0 }}
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            </>
          ) : (
            <img
              src={backdropSrc}
              alt={poster.title}
              className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-500 ease-in-out"
              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            />
          )}
        </div>
      )}
    </div>
  );
}

