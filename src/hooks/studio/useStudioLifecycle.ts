'use client';

import { useState, useEffect, useRef } from 'react';
import type {
  CanvasBackgroundPreset,
  LayoutGridGap,
  Poster,
  PosterLayoutArchetype,
  PosterLayoutConfig,
  QrPosition,
} from '@/types/index';
import type { MultiAssetStudioModalProps, StudioHistorySnapshot, StudioSceneState, StudioTab } from '@/lib/posters/studio-types';
import {
  buildInitialNoticeSnapshot,
  buildInitialStateFromPoster,
  createEmptyStudioSnapshot,
  uploadInitialFilesToSlots,
} from '@/lib/posters/studio-init';
import { saveMultiAssetPoster, uploadLayoutAsset } from '@/lib/actions/multi-asset-posters';
import { duplicatePoster } from '@/lib/actions/posters';
import { toLocalDatetimeString } from '@/lib/utils/time';

interface UseStudioLifecycleParams {
  readonly isOpen: boolean;
  readonly initialPoster?: Poster | null | undefined;
  readonly initialFiles?: File[] | undefined;
  readonly initialNotice?: MultiAssetStudioModalProps['initialNotice'];
  readonly scene: StudioSceneState;
  readonly isDirtyRef: React.MutableRefObject<boolean>;
  readonly resetHistoryWithSnapshot: (snap: StudioHistorySnapshot) => void;
  readonly commitSlots: (slots: StudioSceneState['slots']) => void;
  readonly setSelectedSlotIndex: (idx: number | null) => void;
  readonly setSelectedStickerIndex: (idx: number | null) => void;
  readonly setSelectedCompoundId: (id: string | null) => void;
  readonly setSelectedLayerKeys: (keys: string[]) => void;
  readonly resetPointerSessions: () => void;
  readonly onSaved: () => void;
  readonly onClose: () => void;
}

/** Manages Studio modal settings state, initialization hydration, scroll lock, save, and slide duplication. */
export function useStudioLifecycle(params: UseStudioLifecycleParams) {
  const {
    isOpen, initialPoster, initialFiles, initialNotice, scene, isDirtyRef,
    resetHistoryWithSnapshot, commitSlots, setSelectedSlotIndex, setSelectedStickerIndex,
    setSelectedCompoundId, setSelectedLayerKeys, resetPointerSessions, onSaved, onClose,
  } = params;

  const [activeTab, setActiveTab] = useState<StudioTab>('layout');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(20);
  const [archetype, setArchetype] = useState<PosterLayoutArchetype>('split_vertical');
  const [splitRatio, setSplitRatio] = useState(50);
  const [gridGap, setGridGap] = useState<LayoutGridGap>('normal');
  const [canvasBackground, setCanvasBackground] = useState<CanvasBackgroundPreset>('black');
  const [canvasBackgroundCustom, setCanvasBackgroundCustom] = useState<string>('');
  const [customBadgeText, setCustomBadgeText] = useState('SPECIAL PROGRAM');
  const [customBadgeVariant, setCustomBadgeVariant] = useState<'red' | 'gold' | 'emerald' | 'blue' | 'purple' | 'amber'>('gold');
  const [isAspectLocked, setIsAspectLocked] = useState<boolean>(true);
  const [frameApplyScope, setFrameApplyScope] = useState<'selected' | 'all'>('selected');
  const [hasQr, setHasQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrLabel, setQrLabel] = useState('Scan to Register');
  const [qrPosition, setQrPosition] = useState<QrPosition>('bottom-left');
  const [startAt, setStartAt] = useState<string>(() => toLocalDatetimeString(new Date()));
  const [endAt, setEndAt] = useState<string>('');
  const [isIndefinite, setIsIndefinite] = useState(true);
  const [recurringSchedule, setRecurringSchedule] = useState<string | null>(null);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [showPreviewQr, setShowPreviewQr] = useState(true);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasDropInputRef = useRef<HTMLInputElement>(null);
  const slotReplaceInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const initializedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, [isOpen]);

  const noticeHeadline = initialNotice?.headline ?? '';
  const noticeDescription = initialNotice?.description ?? '';
  const noticeTheme = initialNotice?.theme ?? '';

  useEffect(() => {
    if (!isOpen) {
      initializedSignatureRef.current = null;
      return;
    }

    const sessionSig = `${initialPoster?.id ?? 'new'}::${initialFiles?.length ?? 0}::${noticeHeadline}::${noticeDescription}::${noticeTheme}`;
    if (initializedSignatureRef.current === sessionSig) return;
    initializedSignatureRef.current = sessionSig;

    setError(null); setActiveTab('layout'); setShowPreviewQr(true);
    setSelectedStickerIndex(null); setSelectedCompoundId(null); setSelectedLayerKeys([]);
    resetPointerSessions();

    if (initialPoster) {
      const p = buildInitialStateFromPoster(initialPoster);
      if (p) {
        setTitle(p.title); setDuration(p.duration); setQrUrl(p.qrUrl); setHasQr(p.hasQr); setQrLabel(p.qrLabel);
        setQrPosition(p.qrPosition); setStartAt(p.startAt); setEndAt(p.endAt); setIsIndefinite(p.isIndefinite);
        setRecurringSchedule(p.recurringSchedule);
        setArchetype(p.archetype); setSplitRatio(p.splitRatio); setGridGap(p.gridGap);
        setCanvasBackground(p.canvasBackground); setCanvasBackgroundCustom(p.canvasBackgroundCustom);
        resetHistoryWithSnapshot(p.snapshot); setSelectedSlotIndex(0);
        return;
      }
    }

    setTitle('Community Multi-Program Slide'); setDuration(20); setIsIndefinite(true); setRecurringSchedule(null);
    if (initialFiles && initialFiles.length > 0) {
      setIsUploading(true);
      uploadInitialFilesToSlots(initialFiles, uploadLayoutAsset)
        .then((res) => { setArchetype(res.archetype); resetHistoryWithSnapshot(res.snapshot); setSelectedSlotIndex(0); })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed uploading files.'))
        .finally(() => setIsUploading(false));
      return;
    }
    if (initialNotice) {
      setTitle(initialNotice.headline || 'Community Announcement'); setArchetype('single'); setGridGap('normal');
      resetHistoryWithSnapshot(buildInitialNoticeSnapshot(initialNotice)); setSelectedSlotIndex(0);
      return;
    }
    setArchetype('split_vertical'); setGridGap('normal');
    resetHistoryWithSnapshot(createEmptyStudioSnapshot()); setSelectedSlotIndex(0);
  }, [isOpen, initialPoster, initialFiles, noticeHeadline, noticeDescription, noticeTheme]);

  const handleDuplicateSlide = async () => {
    if (!initialPoster?.id) {
      setTitle((prev) => `${prev} (Copy)`);
      commitSlots(scene.slots.map((s) => ({ ...s, id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })));
      return;
    }
    setIsSubmitting(true);
    try {
      await duplicatePoster(initialPoster.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate slide');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setError('Slide title is required.'); return; }
    if (scene.slots.length === 0 && scene.compoundLayers.length === 0) {
      setError('Please add at least one media slot or merged layer.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const layoutConfig: PosterLayoutConfig = {
      version: 1, archetype, split_ratio: splitRatio, grid_gap: gridGap,
      slots: scene.slots, text_overlays: scene.textOverlays, stickers: scene.stickers,
      folders: scene.folders.length > 0 ? scene.folders : undefined,
      compound_layers: scene.compoundLayers.length > 0 ? scene.compoundLayers : undefined,
      canvas_background: canvasBackground, canvas_background_custom: canvasBackgroundCustom || undefined,
      root_order: scene.rootOrder.length > 0 ? scene.rootOrder : undefined,
    };
    try {
      await saveMultiAssetPoster({
        id: initialPoster?.id, title: title.trim(), layout_config: layoutConfig,
        start_at: new Date(startAt).toISOString(),
        end_at: isIndefinite || !endAt ? null : new Date(endAt).toISOString(),
        duration_seconds: duration,
        qr_url: hasQr && qrUrl.trim() ? qrUrl.trim() : undefined,
        qr_label: hasQr && qrLabel.trim() ? qrLabel.trim() : undefined,
        qr_position: hasQr ? qrPosition : undefined,
        allow_audio: false,
        recurring_schedule: recurringSchedule,
      });
      isDirtyRef.current = false;
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save slide.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeTab, setActiveTab, title, setTitle, duration, setDuration,
    archetype, setArchetype, splitRatio, setSplitRatio, gridGap, setGridGap,
    canvasBackground, setCanvasBackground, canvasBackgroundCustom, setCanvasBackgroundCustom,
    customBadgeText, setCustomBadgeText, customBadgeVariant, setCustomBadgeVariant,
    isAspectLocked, setIsAspectLocked, frameApplyScope, setFrameApplyScope,
    hasQr, setHasQr, qrUrl, setQrUrl, qrLabel, setQrLabel, qrPosition, setQrPosition,
    startAt, setStartAt, endAt, setEndAt, isIndefinite, setIsIndefinite,
    recurringSchedule, setRecurringSchedule,
    showSafeZone, setShowSafeZone, showPreviewQr, setShowPreviewQr,
    showShortcutsModal, setShowShortcutsModal, isUploading, setIsUploading,
    isSubmitting, error, setError, showDiscardConfirm, setShowDiscardConfirm,
    fileInputRef, canvasDropInputRef, slotReplaceInputRef, canvasRef,
    handleDuplicateSlide, handleSave,
    handleRequestClose: () => (isDirtyRef.current ? setShowDiscardConfirm(true) : onClose()),
  };
}
