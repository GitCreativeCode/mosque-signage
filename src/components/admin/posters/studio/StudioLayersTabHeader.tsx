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
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">Layers</h3>
        <p className="text-[10px] text-[var(--admin-text-muted)]">
          Click to select, Shift+Click for range, Right-Click for options
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          disabled={isUploading}
          onClick={onPickMedia}
          className="flex items-center gap-1 px-2 py-1 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium cursor-pointer"
          title="Add Media Slot"
        >
          <Plus className="w-3.5 h-3.5 opacity-70" />
          <span>Media</span>
        </button>
        <button
          type="button"
          onClick={onAddNotice}
          className="flex items-center gap-1 px-2 py-1 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium cursor-pointer"
          title="Add Notice Slot"
        >
          <Plus className="w-3.5 h-3.5 opacity-70" />
          <span>Notice</span>
        </button>
        <button
          type="button"
          onClick={onAddText}
          className="flex items-center gap-1 px-2 py-1 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium cursor-pointer"
          title="Add Text Banner"
        >
          <Plus className="w-3.5 h-3.5 opacity-70" />
          <span>Text</span>
        </button>
        <button
          type="button"
          onClick={onAddFolder}
          className="flex items-center gap-1 px-2 py-1 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium cursor-pointer"
          title="Add Folder"
        >
          <FolderPlus className="w-3.5 h-3.5 opacity-70" />
          <span>Folder</span>
        </button>
      </div>
    </div>
  );
}

