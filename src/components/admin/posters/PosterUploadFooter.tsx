'use client';

import React from 'react';
import { Columns, Loader2 } from 'lucide-react';

interface PosterUploadFooterProps {
  readonly hasFile: boolean;
  readonly isVideo: boolean;
  readonly isSubmitting: boolean;
  readonly isSmallScreen?: boolean | undefined;
  readonly onOpenStudio: () => void;
  readonly onCancel: () => void;
}

/** Action bar for PosterUploadModal with Layout Studio handoff, cancel, and upload buttons. */
export function PosterUploadFooter({
  hasFile,
  isVideo,
  isSubmitting,
  isSmallScreen = false,
  onOpenStudio,
  onCancel,
}: PosterUploadFooterProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-[var(--admin-border)]">
      <button
        type="button"
        disabled={isSmallScreen}
        onClick={onOpenStudio}
        className={`min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl border font-medium text-xs transition shadow-sm flex items-center justify-center space-x-1.5 sm:mr-auto ${
          isSmallScreen
            ? 'border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)] opacity-60 cursor-not-allowed'
            : 'border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer'
        }`}
        title={
          isSmallScreen
            ? 'Multi-Asset Studio requires a tablet or computer'
            : 'Design with frames, custom backgrounds, and overlays in Layout Studio'
        }
      >
        <Columns className="w-3.5 h-3.5 opacity-70" />
        <span>{hasFile ? 'Customize in Studio' : 'Design in Studio'}</span>
        {isSmallScreen && (
          <span className="px-1.5 py-0.5 rounded bg-[var(--admin-card)] border border-[var(--admin-border)] text-[9px] font-bold uppercase">
            Tablet / PC
          </span>
        )}
      </button>
      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer font-medium text-xs transition shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !hasFile}
          className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] active:scale-[0.98] cursor-pointer disabled:opacity-50 font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition"
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>
            {isSubmitting ? 'Uploading Media...' : isVideo ? 'Upload Video Poster' : 'Upload Poster Slide'}
          </span>
        </button>
      </div>
    </div>
  );
}

