import { describe, it, expect, vi } from 'vitest';
import {
  FOCUSABLE_SELECTOR,
  resolveNextTabFocusTarget,
  hasActiveAriaModalInDocument,
} from '@/hooks/useFocusTrap';

describe('useFocusTrap Mechanics & Real Focus Helpers', () => {
  it('defines WCAG-compliant FOCUSABLE_SELECTOR filtering disabled and hidden controls', () => {
    expect(FOCUSABLE_SELECTOR).toContain('a[href]');
    expect(FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
    expect(FOCUSABLE_SELECTOR).toContain('input:not([disabled]):not([type="hidden"])');
    expect(FOCUSABLE_SELECTOR).toContain('[tabindex]:not([tabindex="-1"])');
  });

  it('cycles forward Tab from the last focusable element back to the first element', () => {
    const items = ['btn-close', 'input-title', 'btn-save'];
    expect(resolveNextTabFocusTarget(items, 'btn-save', false, true)).toBe('btn-close');
    expect(resolveNextTabFocusTarget(items, 'input-title', false, true)).toBeNull();
  });

  it('cycles backward Shift+Tab from the first focusable element back to the last element', () => {
    const items = ['btn-close', 'input-title', 'btn-save'];
    expect(resolveNextTabFocusTarget(items, 'btn-close', true, true)).toBe('btn-save');
    expect(resolveNextTabFocusTarget(items, 'input-title', true, true)).toBeNull();
  });

  it('captures escaped focus when activeElement is outside the modal container', () => {
    const items = ['first', 'last'];
    expect(resolveNextTabFocusTarget(items, 'outside', false, false)).toBe('first');
    expect(resolveNextTabFocusTarget(items, 'outside', true, false)).toBe('last');
    expect(resolveNextTabFocusTarget([], 'outside', false, false)).toBeNull();
  });

  it('detects active nested aria-modal dialogs to prevent trigger focus steal on close', () => {
    const withNestedModal = {
      querySelectorAll: vi.fn((selector: string) => {
        expect(selector).toContain('[role="dialog"][aria-modal="true"]');
        expect(selector).toContain('[role="alertdialog"][aria-modal="true"]');
        return [{ id: 'confirm-modal' }] as unknown as NodeListOf<Element>;
      }),
    };
    const withoutActiveModal = {
      querySelectorAll: vi.fn(() => [] as unknown as NodeListOf<Element>),
    };

    expect(hasActiveAriaModalInDocument(withNestedModal)).toBe(true);
    expect(hasActiveAriaModalInDocument(withoutActiveModal)).toBe(false);
  });
});
