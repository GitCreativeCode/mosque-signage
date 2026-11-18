'use client';

import React from 'react';
import type { PosterLayerFolder } from '@/types/index';
import type { DropIndicatorState } from '@/lib/posters/studio-types';
import type { StudioLayerRowItem } from '@/lib/posters/studio-layer-items';
import { createCompactDragGhost } from './drag-ghost';
import { Check, ChevronDown, ChevronRight, Eye, EyeOff, Folder, FolderOpen, GripVertical, Lock, MoreVertical } from 'lucide-react';
import { StudioDropIndicatorLine } from './StudioDropIndicatorLine';
import { StudioLayerDropdownMenu } from './StudioLayerDropdownMenu';

interface StudioLayerFolderCardProps {
  readonly folder: PosterLayerFolder;
  readonly orderedChildren: readonly StudioLayerRowItem[];
  readonly selectedLayerKeys: readonly string[];
  readonly draggedLayerKey: string | null;
  readonly dropIndicator: DropIndicatorState | null;
  readonly openFolderMenuId: string | null;
  readonly renamingFolderId: string | null;
  readonly renameFolderText: string;
  readonly onSetDraggedLayerKey: (k: string | null) => void;
  readonly onSetDropIndicator: React.Dispatch<React.SetStateAction<DropIndicatorState | null>>;
  readonly onSetOpenMenuId: (id: string | null) => void;
  readonly onSetRenamingId: (id: string | null) => void;
  readonly onSetRenameText: (txt: string) => void;
  readonly onToggleCollapse: (folderId: string) => void;
  readonly onToggleHidden: (folderId: string) => void;
  readonly onCommitRename: (folderId: string, trimmed: string) => void;
  readonly onFolderClick: (e: React.MouseEvent, folderId: string) => void;
  readonly onReorderLayers: (src: string, target: string, pos: 'before' | 'after' | 'inside') => void;
  readonly onMoveFolder: (folderId: string, dir: -1 | 1) => void;
  readonly onToggleFolderLock: (folderId: string) => void;
  readonly onDuplicateFolder: (folderId: string) => void;
  readonly onUngroupFolder: (folderId: string) => void;
  readonly onDeleteFolderAndContents: (folderId: string) => void;
  readonly renderChildRow: (item: StudioLayerRowItem) => React.ReactNode;
}

/** Draggable collapsible Layer Folder container with folder actions menu and nested child rows. */
export function StudioLayerFolderCard(props: StudioLayerFolderCardProps) {
  const { folder, orderedChildren, selectedLayerKeys, draggedLayerKey, dropIndicator, openFolderMenuId, renamingFolderId, renameFolderText } = props;
  const folderKey = `folder:${folder.id}`;
  const isFolderSelected = selectedLayerKeys.includes(folderKey);
  const isDroppingInside = dropIndicator?.targetKey === folderKey && dropIndicator.position === 'inside';

  return (
    <div className="space-y-1">
      <div
        draggable={!folder.is_locked}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('text/x-layer-key', folderKey);
          e.dataTransfer.effectAllowed = 'move';
          props.onSetDraggedLayerKey(folderKey);
          const ghost = createCompactDragGhost(folder.name || 'Folder');
          try { e.dataTransfer.setDragImage(ghost, 15, 12); } catch {}
          setTimeout(() => ghost.remove(), 0);
        }}
        onDragOver={(e) => {
          e.preventDefault(); e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          const rect = e.currentTarget.getBoundingClientRect();
          const relY = e.clientY - rect.top;
          let pos: 'before' | 'after' | 'inside' = 'inside';
          if ((draggedLayerKey || '').startsWith('folder:')) pos = relY < rect.height / 2 ? 'before' : 'after';
          else if (relY < rect.height * 0.25) pos = 'before';
          else if (relY > rect.height * 0.75) pos = 'after';
          if (dropIndicator?.targetKey !== folderKey || dropIndicator?.position !== pos) {
            props.onSetDropIndicator({ targetKey: folderKey, position: pos });
          }
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            props.onSetDropIndicator((prev) => (prev?.targetKey === folderKey ? null : prev));
          }
        }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          const sourceKey = e.dataTransfer.getData('text/x-layer-key') || draggedLayerKey;
          const pos = dropIndicator?.targetKey === folderKey ? dropIndicator.position : 'inside';
          props.onSetDropIndicator(null); props.onSetDraggedLayerKey(null);
          if (sourceKey && sourceKey !== folderKey) props.onReorderLayers(sourceKey, folderKey, pos);
        }}
        onDragEnd={() => { props.onSetDraggedLayerKey(null); props.onSetDropIndicator(null); }}
        onClick={(e) => props.onFolderClick(e, folder.id)}
        className={`relative w-full flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
          draggedLayerKey === folderKey ? 'opacity-40 border-dashed border-amber-400' : ''
        } ${
          isDroppingInside
            ? 'ring-2 ring-amber-400 bg-amber-500/20 text-white shadow-md'
            : isFolderSelected
            ? 'border-amber-400 bg-amber-500/10 text-white shadow-sm'
            : 'bg-[var(--admin-card)] border-[var(--admin-border)] text-[var(--admin-text-primary)] hover:border-white/30'
        }`}
      >
        <StudioDropIndicatorLine dropIndicator={dropIndicator} targetKey={folderKey} />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`p-0.5 shrink-0 ${folder.is_locked ? 'opacity-20 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing text-[var(--admin-text-muted)] hover:text-white'}`}
            title={folder.is_locked ? 'Folder is locked' : 'Drag to reorder folder'}
          >
            <GripVertical className="w-3.5 h-3.5 opacity-60" />
          </div>

          <button type="button" onClick={(e) => { e.stopPropagation(); props.onToggleCollapse(folder.id); }} className="p-0.5 text-[var(--admin-text-muted)] hover:text-white">
            {folder.is_collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {folder.is_collapsed ? <Folder className="w-4 h-4 text-amber-400 shrink-0" /> : <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />}

          {renamingFolderId === folder.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (renameFolderText.trim()) props.onCommitRename(folder.id, renameFolderText.trim());
                props.onSetRenamingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 flex-1 min-w-0 pr-1"
            >
              <input
                type="text"
                autoFocus
                value={renameFolderText}
                onChange={(e) => props.onSetRenameText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') props.onSetRenamingId(null); }}
                className="flex-1 min-w-0 px-2 py-0.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-tab-active-border)] text-xs text-[var(--admin-text-primary)] focus:outline-none"
              />
              <button type="submit" className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40">
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-xs font-bold truncate">{folder.name}</span>
              {folder.is_locked && <span title="Folder is locked"><Lock className="w-3 h-3 text-amber-400 shrink-0" /></span>}
              <span className="text-[10px] text-[var(--admin-text-muted)] font-mono shrink-0">({orderedChildren.length})</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => props.onToggleHidden(folder.id)}
            className={`p-1 rounded-lg text-xs cursor-pointer ${folder.is_hidden ? 'text-amber-400 bg-amber-400/10' : 'text-[var(--admin-text-muted)] hover:text-white'}`}
            title={folder.is_hidden ? 'Show Folder' : 'Hide Folder'}
          >
            {folder.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          <div className="relative shrink-0" data-folder-menu="true">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); props.onSetOpenMenuId(openFolderMenuId === folder.id ? null : folder.id); }}
              className="p-1 rounded-lg text-[var(--admin-text-muted)] hover:text-white hover:bg-[var(--admin-card)] cursor-pointer"
              title="Folder Actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {openFolderMenuId === folder.id && (
              <StudioLayerDropdownMenu
                isFolder
                isLocked={Boolean(folder.is_locked)}
                lockLabel={folder.is_locked ? 'Unlock Folder' : 'Lock Folder'}
                onRename={() => { props.onSetRenamingId(folder.id); props.onSetRenameText(folder.name); }}
                onMoveUp={() => props.onMoveFolder(folder.id, -1)}
                onMoveDown={() => props.onMoveFolder(folder.id, 1)}
                onToggleLock={() => props.onToggleFolderLock(folder.id)}
                onDuplicate={() => props.onDuplicateFolder(folder.id)}
                onUngroup={() => props.onUngroupFolder(folder.id)}
                onDelete={() => props.onDeleteFolderAndContents(folder.id)}
                onClose={() => props.onSetOpenMenuId(null)}
              />
            )}
          </div>
        </div>
      </div>

      {!folder.is_collapsed && orderedChildren.map((child) => props.renderChildRow(child))}
    </div>
  );
}

