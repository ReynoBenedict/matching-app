'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Explicit width class — do not use the named max-w-* scale (see note below). */
  maxWidth?: string;
}

/**
 * Dialog shell for the assignment workflow.
 *
 * Rendered through a portal into document.body so that no ancestor stack
 * (table, flex/grid, overflow container) can constrain or clip the panel.
 *
 * NOTE: widths are passed as explicit arbitrary values (e.g. max-w-[560px]).
 * This project overrides `spacing` in tailwind.config.ts, which makes the
 * named scale collide with the spacing scale — `.max-w-2xl` resolves to
 * `max-width: 48px` here, collapsing the dialog into a thin column.
 *
 * Closes on backdrop click and on Escape.
 */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-[560px]',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Portals need a DOM; this dialog only mounts on user interaction anyway.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      {/* Centering wrapper — min-h-full keeps the panel vertically centered
          while still allowing the overlay to scroll on short viewports. */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`relative flex w-full ${maxWidth} max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-lg`}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-md rounded-t-xl border-b border-outline-variant bg-surface-bright p-lg">
            <div className="min-w-0">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
              {subtitle && <p className="text-body-sm text-on-surface-variant mt-xs">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 overflow-y-auto p-lg">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex shrink-0 flex-wrap justify-end gap-sm rounded-b-xl border-t border-outline-variant bg-surface-bright p-md">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
