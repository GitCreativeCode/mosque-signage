'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface ImageLightboxProps {
  readonly src: string;
  readonly alt: string;
  readonly caption?: string | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
}

export function ImageLightbox({
  src,
  alt,
  caption,
  width = 960,
  height = 540,
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setIsZoomed(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsZoomed(false);
  };

  const modalRef = useFocusTrap({ isActive: isOpen, onEscape: handleClose });

  return (
    <figure className="my-6 space-y-2">
      {/* Thumbnail / Embedded View with Click-to-Zoom Indicator */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        className="group relative rounded-2xl overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)] cursor-zoom-in transition-all hover:border-green-600/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-600/40"
        title="Click to view full-resolution schematic"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white text-xs font-semibold backdrop-blur-[2px]">
          <Maximize2 className="w-4 h-4 text-green-400" />
          <span>Click to expand full schematic</span>
        </div>
      </div>

      {caption && (
        <figcaption className="text-center text-[11px] text-[var(--admin-text-muted)] italic leading-normal px-2">
          {caption}
        </figcaption>
      )}

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            ref={modalRef}
            className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center justify-center space-y-3"
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between text-white/80 px-2">
              <p className="text-xs font-medium truncate max-w-md">
                {caption || alt}
              </p>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title={isZoomed ? 'Zoom Out' : 'Zoom In'}
                >
                  {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Close Fullscreen View (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Full-Res Canvas */}
            <div
              className={`w-full overflow-auto rounded-2xl border border-white/10 bg-neutral-950 flex items-center justify-center p-2 sm:p-4 ${
                isZoomed ? 'cursor-zoom-out max-h-[82vh]' : 'cursor-zoom-in max-h-[82vh]'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <Image
                src={src}
                alt={alt}
                width={width * (isZoomed ? 1.5 : 1)}
                height={height * (isZoomed ? 1.5 : 1)}
                className={`transition-all duration-200 object-contain ${
                  isZoomed ? 'max-w-none w-[140%]' : 'max-h-[75vh] w-auto'
                }`}
                priority
              />
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}

