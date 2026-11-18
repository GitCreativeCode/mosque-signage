'use client';

import { useRef } from 'react';
import type { MultiAssetStudioModalProps, SelectedEntity } from '@/lib/posters/studio-types';
import type { PosterCanvasSticker, PosterTextOverlay, SlotFitMode } from '@/types/index';
import { deleteLayerKeysFromScene } from '@/lib/posters/studio-layers';
import { useStudioSceneHistory } from './useStudioSceneHistory';
import { useStudioSelection } from './useStudioSelection';
import { useStudioLifecycle } from './useStudioLifecycle';
import { useStudioPointerEngine } from './useStudioPointerEngine';
import { useStudioLayerActions } from './useStudioLayerActions';
import { useStudioAssetActions } from './useStudioAssetActions';
import { useStudioKeyboardShortcuts } from './useStudioKeyboardShortcuts';

/** Composes all Multi-Asset Studio state, selection, history, pointer, layer, and persistence hooks. */
export function useMultiAssetStudio(props: MultiAssetStudioModalProps) {
  const { isOpen, onClose, onSaved, initialPoster, initialFiles, initialNotice } = props;
  const resetPointerRef = useRef<() => void>(() => {});

  const historyState = useStudioSceneHistory();
  const selection = useStudioSelection(historyState.scene);

  const lifecycle = useStudioLifecycle({
    isOpen, initialPoster, initialFiles, initialNotice,
    scene: historyState.scene,
    isDirtyRef: historyState.isDirtyRef,
    resetHistoryWithSnapshot: historyState.resetHistoryWithSnapshot,
    commitSlots: historyState.commitSlots,
    setSelectedSlotIndex: selection.setSelectedSlotIndex,
    setSelectedStickerIndex: selection.setSelectedStickerIndex,
    setSelectedCompoundId: selection.setSelectedCompoundId,
    setSelectedLayerKeys: selection.setSelectedLayerKeys,
    resetPointerSessions: () => resetPointerRef.current(),
    onSaved, onClose,
  });

  const pointer = useStudioPointerEngine({
    scene: historyState.scene,
    archetype: lifecycle.archetype,
    isAspectLocked: lifecycle.isAspectLocked,
    selectedLayerKeys: selection.selectedLayerKeys,
    canvasRef: lifecycle.canvasRef,
    isItemLocked: selection.isItemLocked,
    toggleLayerSelection: selection.toggleLayerSelection,
    selectSlot: selection.selectSlot,
    selectSticker: selection.selectSticker,
    selectText: selection.selectText,
    selectCompound: selection.selectCompound,
    setSlots: historyState.setSlots,
    setStickers: historyState.setStickers,
    setTextOverlays: historyState.setTextOverlays,
    setCompoundLayers: historyState.setCompoundLayers,
    commitSlots: historyState.commitSlots,
    recordStudioSnapshot: historyState.recordStudioSnapshot,
    isDirtyRef: historyState.isDirtyRef,
  });
  resetPointerRef.current = pointer.resetPointerSessions;

  const handleUndo = () => historyState.stepHistory(-1, selection.deselectAll);
  const handleRedo = () => historyState.stepHistory(1, selection.deselectAll);

  const layerActions = useStudioLayerActions({
    scene: historyState.scene,
    selectedLayerKeys: selection.selectedLayerKeys,
    setSelectedLayerKeys: selection.setSelectedLayerKeys,
    setSelectedSlotIndex: selection.setSelectedSlotIndex,
    selectSticker: selection.selectSticker,
    selectText: selection.selectText,
    selectCompound: selection.selectCompound,
    deselectAll: selection.deselectAll,
    commitScene: historyState.commitScene,
    commitSlots: historyState.commitSlots,
    setSlots: historyState.setSlots,
    setStickers: historyState.setStickers,
    setTextOverlays: historyState.setTextOverlays,
    setCompoundLayers: historyState.setCompoundLayers,
    setFolders: historyState.setFolders,
    isDirtyRef: historyState.isDirtyRef,
  });

  const assetActions = useStudioAssetActions({
    scene: historyState.scene,
    selectedSlotIndex: selection.selectedSlotIndex,
    frameApplyScope: lifecycle.frameApplyScope,
    fileInputRef: lifecycle.fileInputRef,
    canvasDropInputRef: lifecycle.canvasDropInputRef,
    setIsUploading: lifecycle.setIsUploading,
    setError: lifecycle.setError,
    setSelectedSlotIndex: selection.setSelectedSlotIndex,
    setSelectedTextIndex: selection.setSelectedTextIndex,
    setActiveTab: lifecycle.setActiveTab,
    selectSticker: selection.selectSticker,
    commitScene: historyState.commitScene,
    commitSlots: historyState.commitSlots,
    setTextOverlays: historyState.setTextOverlays,
    isDirtyRef: historyState.isDirtyRef,
  });

  useStudioKeyboardShortcuts({
    isOpen, showDiscardConfirm: lifecycle.showDiscardConfirm, scene: historyState.scene,
    selectedSlotIndex: selection.selectedSlotIndex,
    selectedEntity: selection.selectedEntity,
    selectedLayerKeys: selection.selectedLayerKeys,
    setSelectedLayerKeys: selection.setSelectedLayerKeys,
    setSelectedSlotIndex: selection.setSelectedSlotIndex,
    commitScene: historyState.commitScene,
    deselectAll: selection.deselectAll, handleUndo, handleRedo,
  });

  const handlePatchEntity = (
    entity: SelectedEntity,
    patch: { flip_x?: boolean; flip_y?: boolean; rotation?: number; fit_mode?: SlotFitMode },
  ) => {
    const s = historyState.scene;
    if (entity.type === 'slot') {
      historyState.commitSlots(s.slots.map((slot) => (slot.id === entity.id ? { ...slot, ...patch } : slot)));
      return;
    }
    if (entity.type === 'sticker') {
      const next = s.stickers.map((st) => (st.id === entity.id ? { ...st, ...patch } : st));
      historyState.commitScene({ ...s, stickers: next });
      return;
    }
    if (entity.type === 'compound') {
      const next = s.compoundLayers.map((c) => (c.id === entity.id ? { ...c, ...patch } : c));
      historyState.commitScene({ ...s, compoundLayers: next });
      return;
    }
    if (patch.rotation !== undefined) {
      const next = s.textOverlays.map((t) => (t.id === entity.id ? { ...t, rotation: patch.rotation } : t));
      historyState.commitScene({ ...s, textOverlays: next });
    }
  };

  const handleUpdateSticker = (index: number, next: PosterCanvasSticker) => {
    historyState.setStickers((p) => p.map((s, i) => (i === index ? next : s)));
    historyState.isDirtyRef.current = true;
  };

  const handleDeleteSticker = (index: number) => {
    const target = historyState.stickers[index];
    if (!target) return;
    historyState.commitScene(deleteLayerKeysFromScene(historyState.scene, [`sticker:${target.id}`]));
    selection.selectSticker(null);
  };

  const handlePatchTextOverlay = (index: number, patch: Partial<PosterTextOverlay>) => {
    historyState.setTextOverlays((p) => p.map((t, i) => (i === index ? { ...t, ...patch } : t)));
    historyState.isDirtyRef.current = true;
  };

  return {
    historyState, selection, lifecycle, pointer, layerActions, assetActions,
    handleUndo, handleRedo, handlePatchEntity, handleUpdateSticker,
    handleDeleteSticker, handlePatchTextOverlay,
  };
}
