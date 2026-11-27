'use client';

import React from 'react';
import type { DropIndicatorState, LayerItemTarget, SelectedEntity } from '@/lib/posters/studio-types';
import type { StudioLayerRowItem } from '@/lib/posters/studio-layer-items';
import { createCompactDragGhost } from './drag-ghost';
import { Check, Eye, EyeOff, GripVertical, Lock, MoreVertical, Ungroup } from 'lucide-react';
import { StudioDropIndicatorLine, StudioLayerRowThumbnail } from './StudioDropIndicatorLine';
import { StudioLayerDropdownMenu } from './StudioLayerDropdownMenu';

interface StudioLayerRowProps {
  readonly item: StudioLayerRowItem;
  readonly isNested?: boolean | undefined;
  readonly selectedLayerKeys: readonly string[];
  readonly selectedEntity: SelectedEntity | null;
  readonly draggedLayerKey: string | null;
  readonly dropIndicator: DropIndicatorState | null;
  readonly openLayerMenuKey: string | null;
  readonly renamingLayerKey: string | null;
  readonly renameLayerText: string;
  readonly onSetDraggedLayerKey: (k: string | null) => void;
  readonly onSetDropIndicator: React.Dispatch<React.SetStateAction<DropIndicatorState | null>>;
  readonly onSetOpenMenuKey: (k: string | null) => void;
  readonly onSetRenamingKey: (k: string | null) => void;
  readonly onSetRenameText: (txt: string) => void;
  readonly onCommitRename: (item: StudioLayerRowItem, trimmed: string) => void;
  readonly onReorderLayers: (src: string, target: string, pos: 'before' | 'after' | 'inside') => void;
  readonly onRowClick: (e: React.MouseEvent, item: StudioLayerRowItem) => void;
  readonly onOpenContextMenu: (e: React.MouseEvent, item: StudioLayerRowItem) => void;
  readonly onToggleHidden: (item: StudioLayerRowItem) => void;
  readonly onUnmergeCompound: (id: string) => void;
  readonly onMoveUp: (target: LayerItemTarget) => void;
  readonly onMoveDown: (target: LayerItemTarget) => void;
  readonly onToggleLock: (target: LayerItemTarget) => void;
  readonly onDuplicate: (target: LayerItemTarget) => void;
  readonly onDelete: (target: LayerItemTarget) => void;
}

/** Single draggable row in the Studio Layers hierarchy stack. */
export function StudioLayerRow(props: StudioLayerRowProps) {
  const {
    item, isNested = false, selectedLayerKeys, selectedEntity, draggedLayerKey, dropIndicator,
    openLayerMenuKey, renamingLayerKey, renameLayerText,
  } = props;

  const isSelected =
    selectedLayerKeys.includes(item.key) ||
    (selectedEntity?.type === item.type && selectedEntity.id === item.id);
  const target: LayerItemTarget = { type: item.type, id: item.id, itemIdx: item.itemIdx };
  const isBeingDragged =
    draggedLayerKey === item.key ||
    Boolean(draggedLayerKey && selectedLayerKeys.includes(draggedLayerKey) && selectedLayerKeys.includes(item.key));

  return (
    <div
      draggable={!item.isLocked}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/x-layer-key', item.key);
        e.dataTransfer.effectAllowed = 'move';
        props.onSetDraggedLayerKey(item.key);
        const ghost = createCompactDragGhost(item.label || 'Layer');
        try { e.dataTransfer.setDragImage(ghost, 15, 12); } catch {}
        setTimeout(() => ghost.remove(), 0);
      }}
      onDragOver={(e) => {
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
        if (dropIndicator?.targetKey !== item.key || dropIndicator?.position !== pos) {
          props.onSetDropIndicator({ targetKey: item.key, position: pos });
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          props.onSetDropIndicator((prev) => (prev?.targetKey === item.key ? null : prev));
        }
      }}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation();
        const sourceKey = e.dataTransfer.getData('text/x-layer-key') || draggedLayerKey;
        const pos = dropIndicator?.targetKey === item.key ? dropIndicator.position : 'before';
        props.onSetDropIndicator(null);
        props.onSetDraggedLayerKey(null);
        if (sourceKey && sourceKey !== item.key) props.onReorderLayers(sourceKey, item.key, pos);
      }}
      onDragEnd={() => { props.onSetDraggedLayerKey(null); props.onSetDropIndicator(null); }}
      onClick={(e) => props.onRowClick(e, item)}
      onContextMenu={(e) => props.onOpenContextMenu(e, item)}
      className={`relative w-full flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
        isBeingDragged ? 'opacity-40 border-dashed border-amber-400' : ''
      } ${isNested ? 'ml-4 w-[calc(100%-1rem)] border-l-2 border-l-amber-500/50' : ''} ${
        isSelected
          ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] ring-1 ring-[var(--admin-tab-active-border)] shadow-sm'
          : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:bg-[var(--admin-card)]'
      }`}
    >
      <StudioDropIndicatorLine dropIndicator={dropIndicator} targetKey={item.key} />

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="cursor-grab active:cursor-grabbing text-[var(--admin-text-muted)] hover:text-white p-0.5 shrink-0" title="Drag to reorder row">
          <GripVertical className="w-3.5 h-3.5 opacity-60" />
        </div>
        <StudioLayerRowThumbnail item={item} />

        {renamingLayerKey === item.key ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (renameLayerText.trim()) props.onCommitRename(item, renameLayerText.trim());
              props.onSetRenamingKey(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 flex-1 min-w-0 pr-1"
          >
            <input
              type="text"
              autoFocus
              value={renameLayerText}
              onChange={(e) => props.onSetRenameText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') props.onSetRenamingKey(null); }}
              className="flex-1 min-w-0 px-2 py-0.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-tab-active-border)] text-xs text-[var(--admin-text-primary)] focus:outline-none"
            />
            <button type="submit" className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40">
              <Check className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium block truncate">{item.label}</span>
              {item.isLocked && <span title="Layer is locked"><Lock className="w-3 h-3 text-amber-400 shrink-0" /></span>}
            </div>
            <span className="text-[10px] text-[var(--admin-text-muted)] block truncate">{item.sublabel}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
        {item.type === 'compound' && (
          <button
            type="button"
            onClick={() => props.onUnmergeCompound(item.id)}
            className="px-2 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
            title="Unmerge into independent layers"
          >
            <Ungroup className="w-3 h-3" />
            <span>Unmerge</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => props.onToggleHidden(item)}
          className={`p-1 rounded-lg text-xs cursor-pointer ${item.isHidden ? 'text-amber-400 bg-amber-400/10' : 'text-[var(--admin-text-muted)] hover:text-white'}`}
          title={item.isHidden ? 'Show Layer' : 'Hide Layer'}
        >
          {item.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        <div className="relative shrink-0" data-layer-menu="true">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              props.onSetOpenMenuKey(openLayerMenuKey === item.key ? null : item.key);
            }}
            className="p-1 rounded-lg text-[var(--admin-text-muted)] hover:text-white hover:bg-[var(--admin-card)] cursor-pointer"
            title="Layer Actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {openLayerMenuKey === item.key && (
            <StudioLayerDropdownMenu
              isLocked={item.isLocked}
              lockLabel={item.isLocked ? 'Unlock Layer' : 'Lock Layer'}
              onRename={() => { props.onSetRenamingKey(item.key); props.onSetRenameText(item.label); }}
              onMoveUp={() => props.onMoveUp(target)}
              onMoveDown={() => props.onMoveDown(target)}
              onToggleLock={() => props.onToggleLock(target)}
              onDuplicate={() => props.onDuplicate(target)}
              onDelete={() => props.onDelete(target)}
              onClose={() => props.onSetOpenMenuKey(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
