'use client';

import React from 'react';
import { Columns, Loader2 } from 'lucide-react';

interface PosterUploadFooterProps {
  readonly hasFile: boolean;
  readonly isVideo: boolean;
  readonly isSubmitting: boolean;
  readonly onOpenStudio: () => void;
  readonly onCancel: () => void;
}

/** Action bar for PosterUploadModal with Layout Studio handoff, cancel, and upload buttons. */
export function PosterUploadFooter({
  hasFile,
  isVideo,
  isSubmitting,
  onOpenStudio,
  onCancel,
}: PosterUploadFooterProps) {
  return (
    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--admin-border)]">
      <button
        type="button"
        onClick={onOpenStudio}
        className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer font-medium text-xs transition shadow-sm flex items-center space-x-1.5 mr-auto"
        title="Design with frames, custom backgrounds, and overlays in Layout Studio"
      >
        <Columns className="w-3.5 h-3.5 opacity-70" />
        <span>{hasFile ? 'Customize in Studio' : 'Design in Studio'}</span>
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] active:scale-[0.98] cursor-pointer font-medium text-xs transition shadow-sm"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting || !hasFile}
        className="px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] active:scale-[0.98] cursor-pointer disabled:opacity-50 font-semibold text-xs shadow-sm flex items-center space-x-2 transition"
      >
        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <span>
          {isSubmitting ? 'Uploading Media...' : isVideo ? 'Upload Video Poster' : 'Upload Poster Slide'}
        </span>
      </button>
    </div>
  );
}

