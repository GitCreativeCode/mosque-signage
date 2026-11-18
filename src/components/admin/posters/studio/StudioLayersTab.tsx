'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { PosterLayerFolder, PosterSlotMedia } from '@/types/index';
import type { DropIndicatorState, LayerItemTarget, SelectedEntity, StudioSceneState } from '@/lib/posters/studio-types';
import { ensureRootOrder } from '@/lib/posters/studio-zindex';
import { buildStudioLayerItems, getVisibleOrderedLayerKeys, sortFolderChildren, type StudioLayerRowItem } from '@/lib/posters/studio-layer-items';
import { renameLayerItemInScene, toggleLayerVisibilityInScene } from '@/lib/posters/studio-layers';
import { SlotInspectorToolbar } from '../SlotInspectorToolbar';
import { StudioLayerRow } from './StudioLayerRow';
import { StudioLayerFolderCard } from './StudioLayerFolderCard';
import { StudioLayerContextMenu } from './StudioLayerContextMenu';
import { StudioLayersTabHeader } from './StudioLayersTabHeader';

interface StudioLayersTabProps {
  readonly scene: StudioSceneState;
  readonly isUploading: boolean;
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedSlotIndex: number | null;
  readonly selectedLayerKeys: readonly string[];
  readonly lastClickedLayerKey: string | null;
  readonly setSelectedLayerKeys: React.Dispatch<React.SetStateAction<string[]>>;
  readonly setLastClickedLayerKey: (k: string | null) => void;
  readonly setSlots: React.Dispatch<React.SetStateAction<PosterSlotMedia[]>>;
  readonly setStickers: React.Dispatch<React.SetStateAction<StudioSceneState['stickers']>>;
  readonly setTextOverlays: React.Dispatch<React.SetStateAction<StudioSceneState['textOverlays']>>;
  readonly setCompoundLayers: React.Dispatch<React.SetStateAction<StudioSceneState['compoundLayers']>>;
  readonly setFolders: React.Dispatch<React.SetStateAction<PosterLayerFolder[]>>;
  readonly setRootOrder: React.Dispatch<React.SetStateAction<string[]>>;
  readonly commitSlots: (slots: PosterSlotMedia[]) => void;
  readonly selectSlot: (idx: number | null) => void;
  readonly selectSticker: (idx: number | null) => void;
  readonly selectText: (idx: number | null) => void;
  readonly selectCompound: (id: string | null) => void;
  readonly deselectAll: () => void;
  readonly isDirtyRef: React.MutableRefObject<boolean>;
  readonly onPickMedia: () => void;
  readonly onAddNotice: () => void;
  readonly onAddText: () => void;
  readonly onReplaceSlotFile: (file: File) => void;
  readonly onGroupSelected: () => void;
  readonly onMergeSelected: () => void;
  readonly onLockSelected: () => void;
  readonly onDeleteSelected: () => void;
  readonly onReorderLayers: (src: string, target: string, pos: 'before' | 'after' | 'inside') => void;
  readonly onUnmergeCompound: (id: string) => void;
  readonly onMoveUp: (t: LayerItemTarget) => void;
  readonly onMoveDown: (t: LayerItemTarget) => void;
  readonly onToggleLock: (t: LayerItemTarget) => void;
  readonly onDuplicate: (t: LayerItemTarget) => void;
  readonly onDelete: (t: LayerItemTarget) => void;
  readonly onMoveFolder: (id: string, dir: -1 | 1) => void;
  readonly onToggleFolderLock: (id: string) => void;
  readonly onDuplicateFolder: (id: string) => void;
  readonly onUngroupFolder: (id: string) => void;
  readonly onDeleteFolderAndContents: (id: string) => void;
}

/** Hierarchical layer stack panel supporting drag reordering, folders, context menu, and slot toolbar. */
export function StudioLayersTab(props: StudioLayersTabProps) {
  const { scene, selectedEntity, selectedSlotIndex, selectedLayerKeys, lastClickedLayerKey } = props;
  const [draggedLayerKey, setDraggedLayerKey] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorState | null>(null);
  const [openLayerMenuKey, setOpenLayerMenuKey] = useState<string | null>(null);
  const [renamingLayerKey, setRenamingLayerKey] = useState<string | null>(null);
  const [renameLayerText, setRenameLayerText] = useState('');
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderText, setRenameFolderText] = useState('');
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!openLayerMenuKey && !openFolderMenuId && !contextMenuPos) return;
    const onOutside = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-layer-menu="true"]') && !target?.closest('[data-folder-menu="true"]') && !target?.closest('[data-context-menu="true"]')) {
        setOpenLayerMenuKey(null);
        setOpenFolderMenuId(null);
        setContextMenuPos(null);
      }
    };
    document.addEventListener('pointerdown', onOutside, true);
    return () => document.removeEventListener('pointerdown', onOutside, true);
  }, [openLayerMenuKey, openFolderMenuId, contextMenuPos]);

  const allItems = useMemo(() => buildStudioLayerItems(scene), [scene]);
  const { effectiveRootOrder, visibleKeys } = useMemo(() => getVisibleOrderedLayerKeys(scene, allItems), [scene, allItems]);

  const handleRowSelectionClick = (e: React.MouseEvent, key: string, entityType: 'slot' | 'sticker' | 'text' | 'compound' | 'folder', entityId: string, itemIdx?: number) => {
    if (e.shiftKey && lastClickedLayerKey) {
      const i1 = visibleKeys.indexOf(lastClickedLayerKey);
      const i2 = visibleKeys.indexOf(key);
      if (i1 !== -1 && i2 !== -1) { props.setSelectedLayerKeys(visibleKeys.slice(Math.min(i1, i2), Math.max(i1, i2) + 1)); return; }
    }
    if (e.ctrlKey || e.metaKey) {
      props.setSelectedLayerKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
      props.setLastClickedLayerKey(key);
      return;
    }
    props.setSelectedLayerKeys([key]);
    props.setLastClickedLayerKey(key);
    if (entityType === 'slot' && itemIdx !== undefined) props.selectSlot(itemIdx);
    else if (entityType === 'sticker' && itemIdx !== undefined) props.selectSticker(itemIdx);
    else if (entityType === 'text' && itemIdx !== undefined) props.selectText(itemIdx);
    else if (entityType === 'compound') props.selectCompound(entityId);
  };

  const applyScenePatch = (patch: ReturnType<typeof renameLayerItemInScene>) => {
    if (patch.slots) { props.commitSlots(patch.slots); return; }
    if (patch.stickers) props.setStickers(patch.stickers);
    if (patch.textOverlays) props.setTextOverlays(patch.textOverlays);
    if (patch.compoundLayers) props.setCompoundLayers(patch.compoundLayers);
    props.isDirtyRef.current = true;
  };

  const renderRow = (item: StudioLayerRowItem, isNested = false) => (
    <StudioLayerRow
      key={item.key} item={item} isNested={isNested} selectedLayerKeys={selectedLayerKeys} selectedEntity={selectedEntity}
      draggedLayerKey={draggedLayerKey} dropIndicator={dropIndicator} openLayerMenuKey={openLayerMenuKey}
      renamingLayerKey={renamingLayerKey} renameLayerText={renameLayerText}
      onSetDraggedLayerKey={setDraggedLayerKey} onSetDropIndicator={setDropIndicator}
      onSetOpenMenuKey={setOpenLayerMenuKey} onSetRenamingKey={setRenamingLayerKey} onSetRenameText={setRenameLayerText}
      onCommitRename={(it, txt) => applyScenePatch(renameLayerItemInScene(scene, it, txt))} onReorderLayers={props.onReorderLayers}
      onRowClick={(e, it) => handleRowSelectionClick(e, it.key, it.type, it.id, it.itemIdx)}
      onOpenContextMenu={(e, it) => { e.preventDefault(); e.stopPropagation(); if (!selectedLayerKeys.includes(it.key)) handleRowSelectionClick(e, it.key, it.type, it.id, it.itemIdx); setContextMenuPos({ x: e.clientX, y: e.clientY }); }}
      onToggleHidden={(it) => applyScenePatch(toggleLayerVisibilityInScene(scene, it))} onUnmergeCompound={props.onUnmergeCompound}
      onMoveUp={props.onMoveUp} onMoveDown={props.onMoveDown} onToggleLock={props.onToggleLock} onDuplicate={props.onDuplicate} onDelete={props.onDelete}
    />
  );

  const activeSlot = selectedSlotIndex !== null ? scene.slots[selectedSlotIndex] : undefined;

  return (
    <div className="space-y-4" onContextMenu={(e) => { e.preventDefault(); setContextMenuPos({ x: e.clientX, y: e.clientY }); }}>
      <StudioLayersTabHeader
        isUploading={props.isUploading}
        onPickMedia={props.onPickMedia}
        onAddNotice={props.onAddNotice}
        onAddText={props.onAddText}
        onAddFolder={() => {
          const id = `folder-${Date.now()}`;
          const root = ensureRootOrder(scene.rootOrder, scene.folders, scene.slots, scene.stickers, scene.textOverlays, scene.compoundLayers);
          props.setFolders((p) => [...p, { id, name: `Folder ${p.length + 1}`, is_collapsed: false, child_keys: [] }]);
          props.setRootOrder([`folder:${id}`, ...root]);
          props.isDirtyRef.current = true;
        }}
      />

      <StudioLayerContextMenu
        position={contextMenuPos}
        selectedCount={selectedLayerKeys.length}
        onGroupSelected={props.onGroupSelected}
        onMergeSelected={props.onMergeSelected}
        onLockSelected={props.onLockSelected}
        onDeleteSelected={props.onDeleteSelected}
        onClose={() => setContextMenuPos(null)}
      />

      {effectiveRootOrder.length === 0 ? (
        <div className="p-4 rounded-2xl bg-[var(--admin-surface)] border border-dashed border-[var(--admin-border)] text-center text-xs text-[var(--admin-text-muted)] space-y-2"><p>No layers added yet.</p></div>
      ) : (
        <div className="space-y-1.5">
          {effectiveRootOrder.map((entryKey) => {
            if (entryKey.startsWith('folder:')) {
              const folder = scene.folders.find((f) => f.id === entryKey.replace('folder:', ''));
              if (!folder) return null;
              return (
                <StudioLayerFolderCard
                  key={folder.id} folder={folder} orderedChildren={sortFolderChildren(folder, allItems)}
                  selectedLayerKeys={selectedLayerKeys} draggedLayerKey={draggedLayerKey} dropIndicator={dropIndicator}
                  openFolderMenuId={openFolderMenuId} renamingFolderId={renamingFolderId} renameFolderText={renameFolderText}
                  onSetDraggedLayerKey={setDraggedLayerKey} onSetDropIndicator={setDropIndicator}
                  onSetOpenMenuId={setOpenFolderMenuId} onSetRenamingId={setRenamingFolderId} onSetRenameText={setRenameFolderText}
                  onToggleCollapse={(id) => props.setFolders((p) => p.map((f) => (f.id === id ? { ...f, is_collapsed: !f.is_collapsed } : f)))}
                  onToggleHidden={(id) => { props.setFolders((p) => p.map((f) => (f.id === id ? { ...f, is_hidden: !f.is_hidden } : f))); props.isDirtyRef.current = true; }}
                  onCommitRename={(id, name) => { props.setFolders((p) => p.map((f) => (f.id === id ? { ...f, name } : f))); props.isDirtyRef.current = true; }}
                  onFolderClick={(e, id) => handleRowSelectionClick(e, `folder:${id}`, 'folder', id)}
                  onReorderLayers={props.onReorderLayers} onMoveFolder={props.onMoveFolder} onToggleFolderLock={props.onToggleFolderLock}
                  onDuplicateFolder={props.onDuplicateFolder} onUngroupFolder={props.onUngroupFolder} onDeleteFolderAndContents={props.onDeleteFolderAndContents}
                  renderChildRow={(child) => renderRow(child, true)}
                />
              );
            }
            const item = allItems.find((it) => it.key === entryKey);
            return item ? renderRow(item, false) : null;
          })}

          <div
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dropIndicator?.targetKey !== 'root-drop-target') setDropIndicator({ targetKey: 'root-drop-target', position: 'after' }); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropIndicator((p) => (p?.targetKey === 'root-drop-target' ? null : p)); }}
            onDrop={(e) => { e.preventDefault(); const src = e.dataTransfer.getData('text/x-layer-key') || draggedLayerKey; setDropIndicator(null); setDraggedLayerKey(null); if (src) props.onReorderLayers(src, 'root-drop-target', 'after'); }}
            className={`py-2.5 px-3 rounded-xl border border-dashed text-center text-[10px] transition-all cursor-pointer ${
              dropIndicator?.targetKey === 'root-drop-target' ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/50 shadow-md' : 'border-[var(--admin-border)] hover:border-amber-400/60 bg-[var(--admin-surface)]/30 hover:bg-amber-500/5 text-[var(--admin-text-muted)] hover:text-amber-300'
            }`}
          >
            Drag layer here to move out of folder to Root
          </div>
        </div>
      )}

      {selectedEntity?.type === 'slot' && activeSlot && selectedSlotIndex !== null && (
        <SlotInspectorToolbar
          slot={activeSlot} slotIndex={selectedSlotIndex} totalSlots={scene.slots.length} isUploading={props.isUploading}
          onUpdateSlot={(updated) => { const n = [...scene.slots]; n[selectedSlotIndex] = updated; props.commitSlots(n); }}
          onRemoveSlot={() => { props.commitSlots(scene.slots.filter((_, i) => i !== selectedSlotIndex)); props.deselectAll(); }}
          onReplaceFile={props.onReplaceSlotFile}
        />
      )}
    </div>
  );
}
