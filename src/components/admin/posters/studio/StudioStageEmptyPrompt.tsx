'use client';

import React from 'react';
import { Columns, FileText, Upload } from 'lucide-react';

interface StudioStageEmptyPromptProps {
  readonly onPickUploadFiles: () => void;
  readonly onAddNotice: () => void;
}

/** Placeholder card displayed when the 16:9 canvas stage contains no media or text layers. */
export function StudioStageEmptyPrompt({ onPickUploadFiles, onAddNotice }: StudioStageEmptyPromptProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
        <Columns className="w-8 h-8 opacity-70" />
      </div>
      <h3 className="text-xl font-bold mb-1">Add Media to Start Building</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6">Drop images or videos here, right-click anywhere, or choose an option below.</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPickUploadFiles}
          className="px-4 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Images / Videos</span>
        </button>
        <button
          type="button"
          onClick={onAddNotice}
          className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Add Notice Card</span>
        </button>
      </div>
    </div>
  );
}

