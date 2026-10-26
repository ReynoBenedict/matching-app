'use client';

import { useEffect, useState } from 'react';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Superadmin',
  EMPLOYEE: 'Petugas Verifikasi',
  HEAD: 'Kepala BPS',
};

/** Nama dan peran pengguna yang sedang login, untuk header layout. */
export function CurrentUserBadge({ fallbackName, fallbackRole }: { fallbackName: string; fallbackRole: string }) {
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled && payload?.user) setUser(payload.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-end">
      <span className="text-on-surface font-semibold text-sm whitespace-nowrap">{user?.fullName ?? fallbackName}</span>
      <span className="text-on-surface-variant text-xs whitespace-nowrap">
        {user ? ROLE_LABEL[user.role] ?? user.role : fallbackRole}
      </span>
    </div>
  );
}
