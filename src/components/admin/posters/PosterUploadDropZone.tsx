'use client';

import React from 'react';
import type { QrPosition } from '@/types/index';
import { Upload, Columns } from 'lucide-react';
import { PosterLivePreview } from './PosterLivePreview';

interface PosterUploadDropZoneProps {
  readonly file: File | null;
  readonly previewUrl: string | null;
  readonly thumbnailPreviewUrl: string | null;
  readonly isVideo: boolean;
  readonly videoLoopCount: number;
  readonly title: string;
  readonly activeTotalDwell: number;
  readonly hasQr: boolean;
  readonly isEligibleForQr: boolean;
  readonly qrUrl: string;
  readonly qrLabel: string;
  readonly qrPosition: QrPosition;
  readonly onPickFile: () => void;
  readonly onFilesDropped: (files: FileList | null) => void;
  readonly onOpenStudio: () => void;
}

/** Renders either the 16:9 drag-and-drop media zone or live media preview with Studio entry callout. */
export function PosterUploadDropZone({
  file,
  previewUrl,
  thumbnailPreviewUrl,
  isVideo,
  videoLoopCount,
  title,
  activeTotalDwell,
  hasQr,
  isEligibleForQr,
  qrUrl,
  qrLabel,
  qrPosition,
  onPickFile,
  onFilesDropped,
  onOpenStudio,
}: PosterUploadDropZoneProps) {
  return (
    <>
      {!previewUrl && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
            Live Display Preview (16:9 Broadcast)
          </label>
          <span className="text-[var(--admin-text-muted)] font-mono text-[11px]">
            1920 × 1080 Aspect Ratio
          </span>
        </div>
      )}

      {previewUrl ? (
        <PosterLivePreview
          imageUrl={previewUrl}
          thumbnailUrl={thumbnailPreviewUrl}
          isVideo={isVideo}
          videoLoopCount={videoLoopCount}
          title={title}
          durationSeconds={activeTotalDwell}
          hasQr={hasQr && isEligibleForQr}
          qrUrl={qrUrl}
          qrLabel={qrLabel}
          qrPosition={qrPosition}
          onReplaceImage={onPickFile}
          onAddMore={file ? onOpenStudio : undefined}
        />
      ) : (
        <div
          onClick={onPickFile}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFilesDropped(e.dataTransfer.files);
          }}
          className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-dashed border-[var(--admin-border)] hover:border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] cursor-pointer flex flex-col items-center justify-center p-6 text-center transition group shadow-inner"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center justify-center mb-3 group-hover:scale-105 group-hover:border-[var(--admin-tab-active-border)] text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text-primary)] transition shadow-sm">
            <Upload className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-[var(--admin-text-primary)]">
            Click or drop poster flyers or video clips here
          </span>
          <div className="text-xs text-[var(--admin-text-muted)] mt-2 space-y-1">
            <p>
              <span className="text-[var(--admin-text-secondary)] font-medium">Images:</span> PNG, JPG, WebP{' '}
              <span className="font-mono text-[var(--admin-text-muted)]">(Max 15MB)</span>
              <span className="mx-2 opacity-30">•</span>
              <span className="text-[var(--admin-text-secondary)] font-medium">Videos:</span> MP4, WebM, MOV, OGG{' '}
              <span className="font-mono text-[var(--admin-text-muted)]">(Max 50MB, up to 60s)</span>
            </p>
            <p className="text-[11px] text-[var(--admin-text-muted)] font-mono">
              16:9 widescreen recommended (1920 × 1080) • Select multiple files for Split Screen
            </p>
          </div>
        </div>
      )}

      {/* Multi-Asset Studio Entry Point Callout */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-xs">
        <div className="flex items-center gap-2">
          <Columns className="w-4 h-4 text-[var(--admin-text-muted)] shrink-0" />
          <span className="text-[var(--admin-text-secondary)]">
            Want to combine multiple images, side-by-side videos, or community notices?
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="px-3 py-1.5 rounded-lg border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] font-semibold transition cursor-pointer shrink-0"
        >
          {file ? 'Open in Layout Studio' : 'Multi-Asset Layout Studio'}
        </button>
      </div>
    </>
  );
}

