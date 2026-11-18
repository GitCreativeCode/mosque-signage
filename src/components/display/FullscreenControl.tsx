'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * Discreet Auto-Hiding Fullscreen Control
 * Provides an unobtrusive corner toggle allowing instant transition to full-screen kiosk mode
 * on desktop browsers, laptops, and connected TVs without needing a physical keyboard.
 * Fades out automatically after 3 seconds of inactivity; awakens on mouse move, touch, or keypress.
 * Also supports the standard 'F' key toggle shortcut.
 */
export function FullscreenControl() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle request was prevented:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      resetHideTimer();
    };

    const handleUserActivity = () => {
      resetHideTimer();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else {
        resetHideTimer();
      }
    };

    // Initial brief 3s display to reveal toggle location, then fade away
    resetHideTimer();

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetHideTimer, toggleFullscreen]);

  return (
    <div
      data-testid="fullscreen-control-container"
      className={`fixed top-3 right-3 z-50 transition-[transform,opacity] duration-300 transform-gpu ${
        isVisible
          ? 'opacity-100 pointer-events-auto scale-100'
          : 'opacity-0 pointer-events-none scale-95'
      }`}
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        data-testid="fullscreen-toggle-button"
        title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
        aria-label={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/85 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/15 backdrop-blur-md rounded-full shadow-2xl transition-colors cursor-pointer text-xs font-medium"
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen</span>
          </>
        ) : (
          <>
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen</span>
          </>
        )}
      </button>
    </div>
  );
}

