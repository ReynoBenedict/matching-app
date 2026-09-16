'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Lebar eksplisit berupa nilai arbitrary, mis. max-w-[560px]. */
  maxWidth?: string;
}

/**
 * Dialog bersama untuk semua peran (penugasan, dataset, verifikasi).
 * Dirender lewat portal ke document.body agar tidak terpotong oleh elemen induk.
 * Gunakan lebar arbitrary: skala `spacing` kustom membuat `max-w-2xl` hanya 48px.
 * Tutup lewat klik latar atau tombol Escape.
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

  // Portal butuh DOM; dialog hanya dirender setelah interaksi pengguna.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      {/* Pembungkus perataan tengah; overlay tetap bisa digulir di layar pendek. */}
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

          {/* Isi */}
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
