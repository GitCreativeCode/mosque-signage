'use client';

import { useState, useRef, useCallback } from 'react';
import type {
  PosterSlotMedia,
  PosterTextOverlay,
  PosterCanvasSticker,
  PosterLayerFolder,
  PosterCompoundLayer,
} from '@/types/index';
import type { StudioHistorySnapshot, StudioSceneState } from '@/lib/posters/studio-types';

interface AtomicHistoryState {
  readonly history: StudioHistorySnapshot[];
  readonly index: number;
}

/** Owns the core layer arrays, dirty ref, atomic snapshot history stack, and undo/redo stepping. */
export function useStudioSceneHistory() {
  const [slots, setSlots] = useState<PosterSlotMedia[]>([]);
  const [stickers, setStickers] = useState<PosterCanvasSticker[]>([]);
  const [textOverlays, setTextOverlays] = useState<PosterTextOverlay[]>([]);
  const [compoundLayers, setCompoundLayers] = useState<PosterCompoundLayer[]>([]);
  const [folders, setFolders] = useState<PosterLayerFolder[]>([]);
  const [rootOrder, setRootOrder] = useState<string[]>([]);
  const [historyState, setHistoryState] = useState<AtomicHistoryState>({ history: [], index: -1 });
  const historyRef = useRef<AtomicHistoryState>({ history: [], index: -1 });
  const isDirtyRef = useRef(false);

  const scene: StudioSceneState = {
    slots, stickers, textOverlays, compoundLayers, folders, rootOrder,
  };
  const sceneRef = useRef<StudioSceneState>(scene);
  sceneRef.current = scene;

  const applySceneWithoutHistory = useCallback((next: StudioSceneState) => {
    setSlots(next.slots);
    setStickers(next.stickers);
    setTextOverlays(next.textOverlays);
    setCompoundLayers(next.compoundLayers);
    setFolders(next.folders);
    setRootOrder(next.rootOrder);
  }, []);

  const recordStudioSnapshot = useCallback(
    (
      newSlots: PosterSlotMedia[],
      newStickers: PosterCanvasSticker[] = sceneRef.current.stickers,
      newTexts: PosterTextOverlay[] = sceneRef.current.textOverlays,
      newCompounds: PosterCompoundLayer[] = sceneRef.current.compoundLayers,
      newFolders: PosterLayerFolder[] = sceneRef.current.folders,
      newRoot: string[] = sceneRef.current.rootOrder,
    ) => {
      isDirtyRef.current = true;
      const snapshot: StudioHistorySnapshot = {
        slots: newSlots,
        stickers: newStickers,
        textOverlays: newTexts,
        compoundLayers: newCompounds,
        folders: newFolders,
        rootOrder: newRoot,
      };
      const curr = historyRef.current;
      const nextState: AtomicHistoryState = {
        history: [...curr.history.slice(0, curr.index + 1), snapshot],
        index: curr.index + 1,
      };
      historyRef.current = nextState;
      setHistoryState(nextState);
    },
    [],
  );

  const commitScene = useCallback(
    (next: StudioSceneState) => {
      applySceneWithoutHistory(next);
      recordStudioSnapshot(
        next.slots,
        next.stickers,
        next.textOverlays,
        next.compoundLayers,
        next.folders,
        next.rootOrder,
      );
    },
    [applySceneWithoutHistory, recordStudioSnapshot],
  );

  const commitSlots = useCallback(
    (newSlots: PosterSlotMedia[]) => {
      setSlots(newSlots);
      recordStudioSnapshot(newSlots);
    },
    [recordStudioSnapshot],
  );

  const stepHistory = useCallback(
    (delta: -1 | 1, onAfterStep: () => void) => {
      const curr = historyRef.current;
      const nextIdx = curr.index + delta;
      if (nextIdx < 0 || nextIdx >= curr.history.length) return;
      const target = curr.history[nextIdx];
      if (!target) return;

      const nextState: AtomicHistoryState = { history: curr.history, index: nextIdx };
      historyRef.current = nextState;
      setHistoryState(nextState);
      applySceneWithoutHistory({
        slots: [...target.slots],
        stickers: [...target.stickers],
        textOverlays: [...target.textOverlays],
        compoundLayers: [...target.compoundLayers],
        folders: [...target.folders],
        rootOrder: [...target.rootOrder],
      });
      onAfterStep();
      isDirtyRef.current = true;
    },
    [applySceneWithoutHistory],
  );

  const resetHistoryWithSnapshot = useCallback(
    (snapshot: StudioHistorySnapshot) => {
      applySceneWithoutHistory({
        slots: [...snapshot.slots],
        stickers: [...snapshot.stickers],
        textOverlays: [...snapshot.textOverlays],
        compoundLayers: [...snapshot.compoundLayers],
        folders: [...snapshot.folders],
        rootOrder: [...snapshot.rootOrder],
      });
      const resetState: AtomicHistoryState = { history: [snapshot], index: 0 };
      historyRef.current = resetState;
      setHistoryState(resetState);
      isDirtyRef.current = false;
    },
    [applySceneWithoutHistory],
  );

  return {
    scene, slots, setSlots, stickers, setStickers, textOverlays, setTextOverlays,
    compoundLayers, setCompoundLayers, folders, setFolders, rootOrder, setRootOrder,
    history: historyState.history, historyIndex: historyState.index, isDirtyRef,
    applySceneWithoutHistory, recordStudioSnapshot, commitScene, commitSlots,
    stepHistory, resetHistoryWithSnapshot,
  };
}
