'use client';

import React from 'react';
import { FolderPlus, Plus } from 'lucide-react';

interface StudioLayersTabHeaderProps {
  readonly isUploading: boolean;
  readonly onPickMedia: () => void;
  readonly onAddNotice: () => void;
  readonly onAddText: () => void;
  readonly onAddFolder: () => void;
}

/** Header toolbar in StudioLayersTab with quick buttons to add media, notice, text, or folder layers. */
export function StudioLayersTabHeader({
  isUploading,
  onPickMedia,
  onAddNotice,
  onAddText,
  onAddFolder,
}: StudioLayersTabHeaderProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
          Layers
        </h3>
        <span className="text-[10px] text-[var(--admin-text-muted)]">
          Shift+Click range • Right-click menu
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-xs">
        <button
          type="button"
          disabled={isUploading}
          onClick={onPickMedia}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg hover:bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] text-xs font-semibold cursor-pointer transition disabled:opacity-50"
          title="Add Media Slot"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Media</span>
        </button>

        <button
          type="button"
          onClick={onAddNotice}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg hover:bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] text-xs font-semibold cursor-pointer transition"
          title="Add Notice Slot"
        >
          <Plus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">Notice</span>
        </button>

        <button
          type="button"
          onClick={onAddText}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg hover:bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] text-xs font-semibold cursor-pointer transition"
          title="Add Text Banner"
        >
          <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">Text</span>
        </button>

        <button
          type="button"
          onClick={onAddFolder}
          className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg hover:bg-[var(--admin-card)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] text-xs font-semibold cursor-pointer transition"
          title="Add Folder"
        >
          <FolderPlus className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">Folder</span>
        </button>
      </div>
    </div>
  );
}

