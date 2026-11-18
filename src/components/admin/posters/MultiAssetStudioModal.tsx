'use client';

import React from 'react';
import type { MultiAssetStudioModalProps } from '@/lib/posters/studio-types';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useMultiAssetStudio } from '@/hooks/studio/useMultiAssetStudio';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { StudioHeaderBar } from './studio/StudioHeaderBar';
import { StudioToolDock } from './studio/StudioToolDock';
import { StudioInspectorDrawer } from './studio/StudioInspectorDrawer';
import { StudioCanvasStage } from './studio/StudioCanvasStage';
import { StudioShortcutsModal } from './studio/StudioShortcutsModal';

export type { MultiAssetStudioModalProps } from '@/lib/posters/studio-types';

/** Interactive 3-zone Creative Layout Studio modal for composite slides, split screens, and freeform canvases. */
export function MultiAssetStudioModal(props: MultiAssetStudioModalProps) {
  const studio = useMultiAssetStudio(props);
  const { historyState, selection, lifecycle, pointer, layerActions, assetActions } = studio;

  const trapRef = useFocusTrap<HTMLDivElement>({
    isActive: props.isOpen && !lifecycle.showDiscardConfirm,
    onEscape: lifecycle.handleRequestClose,
  });

  if (!props.isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 overscroll-contain"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-modal-title"
      >
        <div
          ref={trapRef}
          className="relative w-full max-w-[96vw] xl:max-w-7xl h-[94vh] flex flex-col bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-3xl shadow-2xl overflow-hidden text-[var(--admin-text-primary)]"
        >
          <StudioHeaderBar
            slotCount={historyState.slots.length}
            compoundCount={historyState.compoundLayers.length}
            archetype={lifecycle.archetype}
            activeTab={lifecycle.activeTab}
            hasQr={lifecycle.hasQr}
            showSafeZone={lifecycle.showSafeZone}
            showPreviewQr={lifecycle.showPreviewQr}
            historyIndex={historyState.historyIndex}
            historyLength={historyState.history.length}
            isSubmitting={lifecycle.isSubmitting}
            isUploading={lifecycle.isUploading}
            error={lifecycle.error}
            onToggleSafeZone={() => lifecycle.setShowSafeZone((p) => !p)}
            onTogglePreviewQr={() => lifecycle.setShowPreviewQr((p) => !p)}
            onUndo={studio.handleUndo}
            onRedo={studio.handleRedo}
            onDuplicateSlide={lifecycle.handleDuplicateSlide}
            onSave={lifecycle.handleSave}
            onClose={lifecycle.handleRequestClose}
            onClearError={() => lifecycle.setError(null)}
          />

          <input ref={lifecycle.fileInputRef} type="file" multiple accept="image/*,video/*" onChange={assetActions.handleAddMediaFiles} className="hidden" />
          <input ref={lifecycle.canvasDropInputRef} type="file" multiple accept="image/*,video/*" onChange={assetActions.handleAddMediaFiles} className="hidden" />
          <input
            ref={lifecycle.slotReplaceInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) assetActions.handleReplaceSlotFile(f);
              if (lifecycle.slotReplaceInputRef.current) lifecycle.slotReplaceInputRef.current.value = '';
            }}
            className="hidden"
          />

          <div className="flex-1 flex overflow-hidden">
            <StudioToolDock
              activeTab={lifecycle.activeTab}
              onSelectTab={lifecycle.setActiveTab}
              onShowShortcuts={() => lifecycle.setShowShortcutsModal(true)}
            />
            <StudioInspectorDrawer studio={studio} />
            <StudioCanvasStage
              canvasRef={lifecycle.canvasRef}
              scene={historyState.scene}
              archetype={lifecycle.archetype}
              splitRatio={lifecycle.splitRatio}
              gridGap={lifecycle.gridGap}
              canvasBackground={lifecycle.canvasBackground}
              canvasBackgroundCustom={lifecycle.canvasBackgroundCustom}
              hasQr={lifecycle.hasQr}
              qrUrl={lifecycle.qrUrl}
              qrLabel={lifecycle.qrLabel}
              qrPosition={lifecycle.qrPosition}
              showPreviewQr={lifecycle.showPreviewQr}
              showSafeZone={lifecycle.showSafeZone}
              selectedSlotIndex={selection.selectedSlotIndex}
              selectedEntity={selection.selectedEntity}
              selectedLayerKeys={selection.selectedLayerKeys}
              isAspectLocked={lifecycle.isAspectLocked}
              draggingFreeformSlotId={pointer.draggingFreeformSlotId}
              draggingStickerId={pointer.draggingStickerId}
              draggingCompoundId={pointer.draggingCompoundId}
              draggingTextId={pointer.draggingTextId}
              isSnappedCenterX={pointer.isSnappedCenterX}
              isSnappedCenterY={pointer.isSnappedCenterY}
              groupBounds={pointer.groupBounds}
              isItemLocked={selection.isItemLocked}
              onCanvasPointerMove={pointer.handleCanvasPointerMove}
              onCanvasPointerUp={pointer.handleCanvasPointerUp}
              onDropFiles={(files) => assetActions.handleAddMediaFiles({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>)}
              onPickUploadFiles={() => lifecycle.canvasDropInputRef.current?.click()}
              onAddNotice={assetActions.handleAddNoticeSlot}
              onDeselectAll={selection.deselectAll}
              onSelectSlot={selection.selectSlot}
              onToggleLayerSelection={selection.toggleLayerSelection}
              onReorderSlot={layerActions.handleReorderSlot}
              onCommitSlots={historyState.commitSlots}
              onRequestReplaceSlot={(idx) => {
                selection.setSelectedSlotIndex(idx);
                lifecycle.slotReplaceInputRef.current?.click();
              }}
              onFreeformSlotPointerDown={pointer.handleFreeformSlotPointerDown}
              onStickerPointerDown={pointer.handleStickerPointerDown}
              onCompoundPointerDown={pointer.handleCompoundPointerDown}
              onTextPointerDown={pointer.handleTextPointerDown}
              onStartResizing={pointer.handleStartResizing}
              onMultiDragStart={pointer.handleMultiDragStart}
              onStartMultiResizing={pointer.handleStartMultiResizing}
              onGroupIntoFolder={layerActions.handleGroupSelectedIntoFolder}
              onMergeIntoCompound={layerActions.handleMergeSelectedIntoCompound}
              onToggleLockSelected={layerActions.handleLockSelectedLayers}
              onDeleteSelected={layerActions.handleDeleteSelectedLayers}
              onMoveUp={layerActions.handleMoveLayerUp}
              onMoveDown={layerActions.handleMoveLayerDown}
              onToggleLock={layerActions.toggleItemLock}
              onDuplicate={layerActions.handleDuplicateLayer}
              onDelete={layerActions.handleDeleteLayer}
              onUnmergeCompound={layerActions.handleUnmergeCompound}
              onPatchEntity={studio.handlePatchEntity}
              onChangeSplitRatio={(val) => {
                lifecycle.setSplitRatio(val);
                historyState.isDirtyRef.current = true;
              }}
              onHidePreviewQr={() => lifecycle.setShowPreviewQr(false)}
            />
          </div>
        </div>
      </div>

      <StudioShortcutsModal isOpen={lifecycle.showShortcutsModal} onClose={() => lifecycle.setShowShortcutsModal(false)} />

      <ConfirmationModal
        isOpen={lifecycle.showDiscardConfirm}
        title="Discard Unsaved Layout Changes?"
        message="You have unsaved layout partitions, frames, or text. Discarding will lose all recent edits."
        confirmLabel="Discard Changes"
        cancelLabel="Continue Editing"
        variant="danger"
        onConfirm={() => {
          lifecycle.setShowDiscardConfirm(false);
          historyState.isDirtyRef.current = false;
          props.onClose();
        }}
        onCancel={() => lifecycle.setShowDiscardConfirm(false)}
      />
    </>
  );
}
