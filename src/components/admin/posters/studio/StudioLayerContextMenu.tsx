'use client';

import React from 'react';
import { FolderPlus, Layers, Lock, Trash2 } from 'lucide-react';

interface StudioLayerContextMenuProps {
  readonly position: { x: number; y: number } | null;
  readonly selectedCount: number;
  readonly onGroupSelected: () => void;
  readonly onMergeSelected: () => void;
  readonly onLockSelected: () => void;
  readonly onDeleteSelected: () => void;
  readonly onClose: () => void;
}

/** Floating right-click context menu for batch grouping, merging, locking, and deleting layers. */
export function StudioLayerContextMenu({
  position,
  selectedCount,
  onGroupSelected,
  onMergeSelected,
  onLockSelected,
  onDeleteSelected,
  onClose,
}: StudioLayerContextMenuProps) {
  if (!position) return null;

  return (
    <div
      data-context-menu="true"
      style={{
        position: 'fixed',
        left: Math.min(window.innerWidth - 190, position.x),
        top: Math.min(window.innerHeight - 220, position.y),
        zIndex: 9999,
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-44 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl shadow-2xl p-1.5 text-xs text-[var(--admin-text-primary)] animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
    >
      {selectedCount > 0 && (
        <button
          type="button"
          onClick={() => { onGroupSelected(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-[var(--admin-surface)] cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
          <span>Group Selected</span>
        </button>
      )}
      {selectedCount > 1 && (
        <button
          type="button"
          onClick={() => { onMergeSelected(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-[var(--admin-surface)] cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Merge Selected</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => { onLockSelected(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-[var(--admin-surface)] cursor-pointer"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>Toggle Lock</span>
      </button>
      {selectedCount > 0 && (
        <>
          <div className="w-full h-[1px] bg-[var(--admin-border)] my-1" />
          <button
            type="button"
            onClick={() => { onDeleteSelected(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-rose-400 hover:bg-rose-950/40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        </>
      )}
    </div>
  );
}

