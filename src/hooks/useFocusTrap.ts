'use client';

import { useEffect, useRef } from 'react';

export interface UseFocusTrapOptions {
  /**
   * Whether focus trapping is currently active.
   */
  readonly isActive: boolean;
  /**
   * Callback fired when user presses the Escape key.
   */
  readonly onEscape?: (() => void) | undefined;
  /**
   * Optional reference to element that should receive initial focus.
   */
  readonly initialFocusRef?: React.RefObject<HTMLElement | null> | undefined;
  /**
   * Optional reference to element that should receive focus when modal closes.
   */
  readonly returnFocusRef?: React.RefObject<HTMLElement | null> | undefined;
}

export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Pure helper: computes the target element when pressing Tab / Shift+Tab inside a trapped modal.
 */
export function resolveNextTabFocusTarget<T>(
  focusable: readonly T[],
  currentActive: T | null,
  shiftKey: boolean,
  isInsideContainer: boolean
): T | null {
  if (focusable.length === 0) return null;
  const firstElement = focusable[0] ?? null;
  const lastElement = focusable[focusable.length - 1] ?? null;

  if (shiftKey) {
    if (currentActive === firstElement || !isInsideContainer) return lastElement;
    return null;
  }
  if (currentActive === lastElement || !isInsideContainer) return firstElement;
  return null;
}

/**
 * Returns true when another active aria-modal dialog is still mounted, preventing trigger focus steal.
 */
export function hasActiveAriaModalInDocument(doc: Pick<Document, 'querySelectorAll'>): boolean {
  return (
    doc.querySelectorAll('[role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]')
      .length > 0
  );
}

/**
 * useFocusTrap
 * Strict WCAG 2.1 AA focus trapping hook for modal dialogs and alerts.
 * Traps Tab and Shift+Tab navigation strictly within the container,
 * prevents keyboard leaks to background inputs, manages Escape dismissal,
 * and restores focus to trigger elements upon modal close.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isActive,
  onEscape,
  initialFocusRef,
  returnFocusRef,
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Keep callback and ref options fresh across renders without triggering effect re-execution
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  const initialFocusRefInternal = useRef(initialFocusRef);
  initialFocusRefInternal.current = initialFocusRef;

  const returnFocusRefInternal = useRef(returnFocusRef);
  returnFocusRefInternal.current = returnFocusRef;

  useEffect(() => {
    if (!isActive) return;

    // Capture the trigger element that had focus right before modal opened
    if (typeof document !== 'undefined') {
      triggerElementRef.current =
        returnFocusRefInternal.current?.current || (document.activeElement as HTMLElement) || null;
    }

    const container = containerRef.current;
    let focusTimeout: ReturnType<typeof setTimeout> | null = null;

    if (container) {
      // Shift initial focus into the dialog after DOM paint
      focusTimeout = setTimeout(() => {
        const activeContainer = containerRef.current || container;
        if (initialFocusRefInternal.current?.current) {
          initialFocusRefInternal.current.current.focus();
        } else if (activeContainer) {
          const focusableElements = activeContainer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
          if (focusableElements.length > 0) {
            focusableElements[0]?.focus();
          } else {
            activeContainer.focus();
          }
        }
      }, 40);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onEscapeRef.current) {
          event.preventDefault();
          event.stopPropagation();
          onEscapeRef.current();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const currentContainer = containerRef.current || container;
      if (!currentContainer) return;

      const focusable = Array.from(
        currentContainer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => {
        // Exclude elements hidden via display:none or visibility:hidden
        return el.offsetParent !== null || el.getClientRects().length > 0;
      });

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const currentActive = document.activeElement as HTMLElement | null;
      const nextTarget = resolveNextTabFocusTarget(
        focusable,
        currentActive,
        event.shiftKey,
        Boolean(currentActive && currentContainer.contains(currentActive))
      );
      if (nextTarget) {
        event.preventDefault();
        nextTarget.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      if (focusTimeout !== null) {
        clearTimeout(focusTimeout);
      }
      window.removeEventListener('keydown', handleKeyDown, true);

      // Restore focus to trigger element only if no nested modal dialog remains open
      const trigger = triggerElementRef.current;
      if (trigger && typeof trigger.focus === 'function') {
        setTimeout(() => {
          if (hasActiveAriaModalInDocument(document)) return;
          if (document.contains(trigger)) {
            trigger.focus();
          }
        }, 50);
      }
    };
  }, [isActive]);

  return containerRef;
}
