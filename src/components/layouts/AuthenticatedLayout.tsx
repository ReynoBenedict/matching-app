'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

// Nav items that are live and routable
const LIVE_NAV_ITEMS = [
  { href: '/superadmin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/superadmin/registration-requests', icon: 'group', label: 'Manajemen Pengguna' },
  { href: '/datasets', icon: 'source', label: 'Manajemen Dataset' },
];

// Nav items present in Stitch but belonging to future phases — rendered visually but non-interactive
const FUTURE_NAV_ITEMS = [
  { icon: 'dataset_linked', label: 'Pencocokan Data' },
  { icon: 'assignment', label: 'Assignment' },
  { icon: 'monitoring', label: 'Monitoring Progres' },
  { icon: 'check_circle', label: 'Hasil Matching' },
  { icon: 'history', label: 'Riwayat Proses' },
];

export function AuthenticatedLayout({ children, pageTitle }: AuthenticatedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Determine active nav item based on current pathname
  const isActive = (href: string) => {
    if (href === '/superadmin/dashboard') {
      return pathname === '/superadmin/dashboard';
    }
    if (href === '/superadmin/registration-requests') {
      return pathname?.startsWith('/superadmin/registration-requests') ?? false;
    }
    if (href === '/datasets') {
      return pathname?.startsWith('/datasets') ?? false;
    }
    return false;
  };

  return (
    <div className="flex min-h-screen bg-background font-body-md text-on-background">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-[260px] h-screen fixed left-0 top-0 bg-primary border-r border-outline-variant shadow-sm flex flex-col py-xl z-20">

        {/* Logo / Title */}
        <div className="px-md mb-xl flex flex-col gap-sm">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center flex-shrink-0">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: '16px' }}
              >
                dataset
              </span>
            </div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-primary leading-tight">
              Sistem Pencocokan Data
            </h1>
          </div>
          <p className="text-on-primary-fixed-variant font-label-md text-label-md">Kota Malang</p>
        </div>

        {/* CTA Button */}
        <div className="px-md mb-lg">
          <button className="w-full bg-secondary-container text-on-secondary-container py-2 rounded-lg font-label-md hover:bg-secondary hover:text-on-primary transition-colors duration-200 ease-in-out">
            Mulai Pencocokan Baru
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-base mt-md overflow-y-auto">

          {/* Live nav items */}
          {LIVE_NAV_ITEMS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-md px-md py-sm transition-all duration-200 ease-in-out ${
                isActive(href)
                  ? 'bg-primary-container text-on-primary-container border-l-4 border-secondary-container'
                  : 'text-on-primary hover:bg-on-primary-fixed-variant'
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </Link>
          ))}

          {/* Future-phase nav items — visible per Stitch, non-interactive */}
          {FUTURE_NAV_ITEMS.map(({ icon, label }) => (
            <span
              key={label}
              title="Fitur ini akan tersedia pada fase berikutnya"
              className="flex items-center gap-md px-md py-sm text-on-primary opacity-40 cursor-not-allowed select-none"
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </span>
          ))}
        </nav>

        {/* Footer nav */}
        <div className="mt-auto px-md py-md border-t border-on-primary-fixed-variant flex flex-col gap-sm">
          <span
            title="Bantuan belum tersedia"
            className="flex items-center gap-md px-md py-sm text-on-primary opacity-40 cursor-not-allowed select-none"
          >
            <span className="material-symbols-outlined">help</span>
            Bantuan
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-md px-md py-sm text-on-primary hover:bg-on-primary-fixed-variant transition-colors duration-200 w-full text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            Log Keluar
          </button>
        </div>
      </aside>

      {/* ── Content column (right of sidebar) ───────────────────── */}
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">

        {/* Top Header */}
        <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface border-b border-outline-variant z-10 font-label-md flex justify-between items-center px-lg" style={{ width: 'calc(100% - 260px)' }}>
          <div className="flex items-center gap-xl h-full">
            <span className="font-headline-sm text-headline-sm font-bold text-primary">
              {pageTitle || 'Sistem Pencocokan Data BPS'}
            </span>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-sm mr-md">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-body-md w-48 outline-none"
                placeholder="Cari..."
                type="text"
                readOnly
              />
            </div>
            <div className="flex items-center gap-md border-l border-outline-variant pl-md">
              <div className="flex flex-col items-end">
                <span className="text-on-surface font-semibold text-sm">Administrator BPS</span>
                <span className="text-on-surface-variant text-xs">Role: Superadmin</span>
              </div>
              <div className="flex gap-sm">
                <button className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low relative">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                </button>
                <button className="p-1 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low">
                  <span className="material-symbols-outlined">account_circle</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 mt-16 p-[32px] bg-background overflow-y-auto">
          <div className="w-full max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-low border-t border-outline-variant flex justify-between items-center p-md font-body-sm text-body-sm">
          <div className="text-primary font-bold">
            © 2024 Badan Pusat Statistik Kota Malang - Tim IT BPS
          </div>
          <div className="flex gap-md">
            <span className="text-on-surface-variant">Kebijakan Privasi</span>
            <span className="text-on-surface-variant">Syarat &amp; Ketentuan</span>
            <span className="text-on-surface-variant">Hubungi Kami</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
