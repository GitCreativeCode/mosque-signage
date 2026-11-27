'use client';

import React, { useState, useRef, useLayoutEffect } from 'react';
import type { PosterTextOverlay } from '@/types/index';
import type { ResizeHandle, ResizeSession } from '@/lib/posters/studio-types';
import { resolveTextClasses } from '@/lib/posters/overlay-styles';
import { SteppedTextLines } from '@/components/common/SteppedTextLines';
import { StudioTransformHandles } from './StudioTransformHandles';

/** Selects all text contents across every row of an editable text banner element. */
export function selectEditableContents(el: HTMLElement | null | undefined): boolean {
  if (!el || typeof document === 'undefined' || typeof window === 'undefined') return false;
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  } catch {
    return false;
  }
}

export interface TextResizeInitialProps {
  pos_x: number;
  pos_y: number;
  width_percent: number;
  height_percent: number;
  font_size?: number | undefined;
  scale_x?: number | undefined;
  scale_y?: number | undefined;
  rotation?: number | undefined;
}

export interface StudioTextBannerItemProps {
  readonly ov: PosterTextOverlay;
  readonly ovIdx: number;
  readonly isSelected: boolean;
  readonly isMultiSelected: boolean;
  readonly isDraggingThis: boolean;
  readonly isEditing: boolean;
  readonly isAspectLocked: boolean;
  readonly locked: boolean;
  readonly editDivRef: React.RefObject<HTMLElement | null>;
  readonly onTextPointerDown: (e: React.PointerEvent, textId: string) => void;
  readonly onStartEditing: (e: React.MouseEvent, ov: PosterTextOverlay, locked: boolean) => void;
  readonly onCancelEditing: (ov: PosterTextOverlay) => void;
  readonly onCommit: (ov: PosterTextOverlay) => void;
  readonly onStartResizing: (e: React.PointerEvent, type: ResizeSession['type'], id: string, handle: ResizeHandle, p: TextResizeInitialProps) => void;
}

/** Single interactive text banner layer with tight edge-to-edge outline and undistorted resize/stretch handles. */
export function StudioTextBannerItem(props: StudioTextBannerItemProps) {
  const {
    ov, ovIdx, isSelected, isMultiSelected, isDraggingThis, isEditing, isAspectLocked, locked,
    editDivRef, onTextPointerDown, onStartEditing, onCancelEditing, onCommit, onStartResizing,
  } = props;
  const layerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const isHugLines = ov.box_fit === 'hug_lines';
  const showSingleRing = (isSelected || isDraggingThis) && !isEditing && !isMultiSelected;
  const topPct = ov.pos_y !== undefined ? ov.pos_y : ov.position === 'top_banner' ? 12 : 85;
  const leftPct = ov.pos_x !== undefined ? ov.pos_x : 50;
  const s = resolveTextClasses(ov);
  const isCustomW = ov.width_mode === 'custom' && Boolean(ov.width_percent);
  const isStretched = (s.scaleX !== 1 || s.scaleY !== 1) && !isEditing;

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const syncSize = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) setNaturalSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    syncSize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(syncSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ov.text, s.fontSizeCss, ov.font_family, ov.is_bold, ov.is_italic, ov.box_fit, ov.width_mode, ov.width_percent, isEditing]);

  const baseBg = s.isTransparentBg ? 'transparent' : s.customBgColor || (ov.bg_style === 'emerald' ? '#064e3b' : ov.bg_style === 'gold' ? '#78350f' : '#000000');
  const effectiveBg = s.isTransparentBg ? 'transparent' : baseBg;
  const containerBg = isHugLines ? 'transparent' : effectiveBg;
  const useMeasuredBox = isStretched && naturalSize !== null;
  const maxContentW = isCustomW ? `${ov.width_percent}cqw` : '95cqw';

  const handleResizePointerDown = (e: React.PointerEvent, h: ResizeHandle) => {
    const el = layerRef.current;
    const canvasEl = el?.closest('[data-studio-canvas="true"]') as HTMLElement | null;
    const wPct = el && canvasEl && canvasEl.offsetWidth > 0 ? (el.offsetWidth / canvasEl.offsetWidth) * 100 : isCustomW && ov.width_percent ? ov.width_percent : 20;
    const hPct = el && canvasEl && canvasEl.offsetHeight > 0 ? (el.offsetHeight / canvasEl.offsetHeight) * 100 : 8;
    onStartResizing(e, 'text', ov.id, h, {
      pos_x: leftPct, pos_y: topPct, width_percent: wPct, height_percent: hPct,
      font_size: s.fontSizePx, scale_x: s.scaleX, scale_y: s.scaleY, rotation: ov.rotation ?? 0,
    });
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onCancelEditing(ov); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onCommit(ov); }
  };

  const handleEditMouseDown = (e: React.MouseEvent) => {
    if (isEditing && e.detail >= 4) {
      e.preventDefault();
      e.stopPropagation();
      selectEditableContents(editDivRef.current);
    }
  };

  const assignEditRef = (node: HTMLElement | null) => {
    if (isEditing && editDivRef) (editDivRef as React.MutableRefObject<HTMLElement | null>).current = node;
  };

  const textStyleClasses = `${s.fontFamilyClass} ${ov.is_bold ?? true ? 'font-bold' : 'font-normal'} ${ov.is_italic ? 'italic' : ''} ${ov.is_underline ? 'underline' : ''}`;

  return (
    <div
      ref={layerRef}
      data-studio-layer="true"
      data-layer-id={ov.id}
      data-layer-type="text"
      data-layer-index={ovIdx}
      onPointerDown={(e) => {
        if (isEditing || e.button !== 0) {
          e.stopPropagation();
          return;
        }
        onTextPointerDown(e, ov.id);
      }}
      onDoubleClick={(e) => onStartEditing(e, ov, locked)}
      style={{
        position: 'absolute',
        top: `${topPct}%`,
        left: `${leftPct}%`,
        transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg)`,
        width: useMeasuredBox ? `${naturalSize.w * s.scaleX}px` : isCustomW ? `${ov.width_percent}%` : 'max-content',
        height: useMeasuredBox ? `${naturalSize.h * s.scaleY}px` : 'fit-content',
        maxWidth: useMeasuredBox ? undefined : maxContentW,
        touchAction: 'none',
        zIndex: isDraggingThis ? 999 : isEditing ? 1000 : isSelected ? Math.max(900, (ov.z_index ?? 50) + 500) : ov.z_index ?? ovIdx + 50,
        opacity: (ov.bg_opacity ?? 100) / 100,
      }}
      className={`absolute select-none p-0 m-0 ${
        locked ? 'cursor-default' : isEditing ? 'cursor-text' : 'cursor-move'
      } ${
        showSingleRing
          ? 'ring-2 ring-amber-400 ring-offset-0 shadow-2xl'
          : isEditing ? '' : 'hover:ring-1 hover:ring-white/50'
      }`}
    >
      {isSelected && !locked && !isEditing && !isMultiSelected && (
        <StudioTransformHandles accent="amber" isAspectLocked={isAspectLocked} onResizeStart={handleResizePointerDown} />
      )}

      <div
        style={
          isStretched
            ? {
                position: 'absolute', top: '50%', left: '50%',
                transform: `translate(-50%, -50%) scale(${s.scaleX}, ${s.scaleY})`, transformOrigin: 'center center',
                width: isCustomW ? maxContentW : 'max-content', maxWidth: maxContentW,
              }
            : { width: isCustomW ? '100%' : 'max-content', maxWidth: isCustomW ? undefined : maxContentW, height: 'fit-content' }
        }
      >
        <div
          ref={(node) => { contentRef.current = node; if (!isHugLines) assignEditRef(node); }}
          contentEditable={isEditing && !isHugLines ? 'plaintext-only' : false}
          suppressContentEditableWarning
          onPointerDown={(e) => { if (isEditing && !isHugLines) e.stopPropagation(); }}
          onMouseDown={!isHugLines ? handleEditMouseDown : undefined}
          onKeyDown={!isHugLines ? handleEditKeyDown : undefined}
          onBlur={!isHugLines ? () => onCommit(ov) : undefined}
          className={`block ${isCustomW ? 'w-full' : 'w-max'} h-fit leading-[1.15] m-0 ${
            isHugLines ? `p-0 bg-transparent border-0 shadow-none ${s.textAlignClass}` : `${s.bgClass} ${s.textAlignClass} ${textStyleClasses}`
          } ${isEditing && !isHugLines ? 'outline-none select-text min-w-[2ch]' : ''}`}
          style={{
            color: ov.text_color || '#ffffff', backgroundColor: containerBg, fontSize: s.fontSizeCss,
            lineHeight: isEditing && isHugLines ? 1.43 : 1.15, padding: isHugLines ? 0 : '0.22em 0.6em',
            maxWidth: isCustomW ? undefined : maxContentW, whiteSpace: isCustomW ? 'normal' : 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {isEditing && isHugLines ? (
            <span
              ref={assignEditRef}
              contentEditable="plaintext-only"
              suppressContentEditableWarning
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={handleEditMouseDown}
              onKeyDown={handleEditKeyDown}
              onBlur={() => onCommit(ov)}
              className={`inline outline-none select-text min-w-[2ch] ${textStyleClasses}`}
              style={{
                backgroundColor: effectiveBg, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
                padding: '0.14em 0.45em', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >
              {ov.text}
            </span>
          ) : isEditing ? (
            ov.text
          ) : isHugLines ? (
            <SteppedTextLines
              text={ov.text} align={ov.text_align} backgroundColor={effectiveBg} containerClassName="-space-y-0.5"
              lineClassName={`inline-block font-inherit leading-[1.15] whitespace-pre-wrap rounded-none ${textStyleClasses}`}
              lineStyle={{ padding: '0.14em 0.45em' }}
            />
          ) : (
            <span className="inline-block whitespace-pre-wrap leading-[1.15]">{ov.text}</span>
          )}
        </div>
      </div>
    </div>
  );
}
