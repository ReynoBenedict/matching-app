'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Nilai kolom users.role: ADMIN = Superadmin, EMPLOYEE = Employee, HEAD = Kepala BPS. */
export type AppRole = 'ADMIN' | 'EMPLOYEE' | 'HEAD';

export const ROLE_HOME: Record<AppRole, string> = {
  ADMIN: '/superadmin/dashboard',
  EMPLOYEE: '/employee/dashboard',
  HEAD: '/kepala-bps/dashboard',
};

export type AccessState = 'checking' | 'ok' | 'denied';

/**
 * Penjaga peran untuk halaman klien (SRS SMD-NF-03).
 *
 * API sudah membatasi data per peran, tetapi tanpa penjaga ini sebuah halaman
 * (beserta sidebar perannya) tetap dapat dibuka oleh peran lain. Pengguna yang
 * belum login diarahkan ke /login; peran yang tidak diizinkan diarahkan ke
 * dasbor perannya sendiri. Isi halaman hanya dirender setelah akses terverifikasi.
 */
export function useRequireRole(allowed: AppRole[]): AccessState {
  const router = useRouter();
  const [state, setState] = useState<AccessState>('checking');
  const allowedKey = allowed.join(',');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        const payload = await response.json();
        const role = payload?.user?.role as AppRole | undefined;
        if (!role) {
          router.replace('/login');
          return;
        }
        if (!allowedKey.split(',').includes(role)) {
          if (!cancelled) setState('denied');
          router.replace(ROLE_HOME[role] ?? '/login');
          return;
        }
        if (!cancelled) setState('ok');
      } catch {
        // Gangguan jaringan: jangan mengunci antarmuka; API tetap menjaga akses data.
        if (!cancelled) setState('ok');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [allowedKey, router]);

  return state;
}

/** Placeholder seragam selama pemeriksaan akses. */
export function AccessCheckPlaceholder({ state }: { state: AccessState }) {
  return (
    <div className="p-xl text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-[40px] text-primary animate-spin inline-block">progress_activity</span>
      <p className="font-body-md mt-sm">
        {state === 'denied' ? 'Mengarahkan ke halaman sesuai peran Anda...' : 'Memeriksa hak akses...'}
      </p>
    </div>
  );
}
