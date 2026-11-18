/**
 * Browser-only HTML5 drag ghost pill helper for Studio layer trees.
 * MosqueSignage (TV)
 */

export function createCompactDragGhost(label: string): HTMLElement {
  const el = document.createElement('div');
  el.textContent = label;
  Object.assign(el.style, {
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
    padding: '5px 12px',
    borderRadius: '8px',
    background: '#18181b',
    color: '#fafafa',
    fontSize: '11px',
    fontWeight: '600',
    fontFamily: 'sans-serif',
    boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
    border: '1px solid #f59e0b',
    whiteSpace: 'nowrap',
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });
  document.body.appendChild(el);
  return el;
}

