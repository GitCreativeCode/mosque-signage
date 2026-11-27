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
  readonly isSmallScreen?: boolean | undefined;
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
  isSmallScreen = false,
  onPickFile,
  onFilesDropped,
  onOpenStudio,
}: PosterUploadDropZoneProps) {
  return (
    <>
      {!previewUrl && (
        <div className="mb-2">
          <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
            Live Display Preview
          </label>
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
        />
      ) : (
        <div
          onClick={onPickFile}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFilesDropped(e.dataTransfer.files);
          }}
          className="relative min-h-[210px] sm:min-h-0 sm:aspect-video w-full rounded-2xl overflow-hidden border-2 border-dashed border-[var(--admin-border)] hover:border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] cursor-pointer flex flex-col items-center justify-center px-4 py-7 sm:p-6 text-center transition group shadow-inner"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] flex items-center justify-center mb-3 group-hover:scale-105 group-hover:border-[var(--admin-tab-active-border)] text-[var(--admin-text-muted)] group-hover:text-[var(--admin-text-primary)] transition shadow-sm">
            <Upload className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-[var(--admin-text-primary)]">
            Click or drop poster flyers or video clips here
          </span>
          <div className="text-xs text-[var(--admin-text-muted)] mt-2.5 space-y-1.5 leading-relaxed">
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span>
                <span className="text-[var(--admin-text-secondary)] font-medium">Images:</span> PNG, JPG, WebP{' '}
                <span className="font-mono text-[var(--admin-text-muted)]">(Max 15MB)</span>
              </span>
              <span className="hidden sm:inline opacity-30">•</span>
              <span>
                <span className="text-[var(--admin-text-secondary)] font-medium">Videos:</span> MP4, WebM, MOV, OGG{' '}
                <span className="font-mono text-[var(--admin-text-muted)]">(Max 50MB, up to 60s)</span>
              </span>
            </p>
            <p className="text-[11px] text-[var(--admin-text-muted)] font-mono">
              16:9 widescreen recommended
              {!isSmallScreen && ' • Select multiple files for Split Screen'}
            </p>
          </div>
        </div>
      )}

      {/* Multi-Asset Studio Entry Point Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-xs">
        <div className="flex items-start sm:items-center gap-2">
          <Columns className="w-4 h-4 text-[var(--admin-text-muted)] shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-[var(--admin-text-secondary)]">
            {isSmallScreen
              ? 'Multi-Asset Split-Screen Studio is available on tablets and computers.'
              : 'Want to combine multiple images, side-by-side videos, or community notices?'}
          </span>
        </div>
        <button
          type="button"
          disabled={isSmallScreen}
          onClick={onOpenStudio}
          title={isSmallScreen ? 'Requires a tablet or computer screen' : undefined}
          className={`min-h-[40px] px-3 py-1.5 rounded-lg border font-semibold transition shrink-0 flex items-center justify-center gap-1.5 w-full sm:w-auto ${
            isSmallScreen
              ? 'border-[var(--admin-border)] bg-[var(--admin-card)]/60 text-[var(--admin-text-muted)] opacity-60 cursor-not-allowed'
              : 'border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] cursor-pointer'
          }`}
        >
          <span>{file ? '+ Add Split Screen Asset' : 'Multi-Asset Layout Studio'}</span>
          {isSmallScreen && (
            <span className="px-1.5 py-0.5 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[9px] font-bold uppercase tracking-wider">
              Tablet / PC
            </span>
          )}
        </button>
      </div>
    </>
  );
}

