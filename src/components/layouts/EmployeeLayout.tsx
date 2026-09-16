'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

interface EmployeeLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

const EMPLOYEE_NAV_ITEMS = [
  { href: '/employee/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/employee/assignments', icon: 'assignment', label: 'Penugasan Saya' },
];

export function EmployeeLayout({ children, pageTitle }: EmployeeLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cegah halaman di belakang drawer ikut bergulir.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-background font-body-md text-on-background">
      {/* Sidebar */}
      <aside
        className={`w-[260px] h-screen fixed left-0 top-0 bg-primary border-r border-outline-variant shadow-sm flex flex-col py-xl z-50 md:z-20 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >

        {/* Logo dan judul */}
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

        {/* Navigasi Employee */}
        <nav className="flex-1 flex flex-col gap-base mt-md overflow-y-auto">
          {EMPLOYEE_NAV_ITEMS.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
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
        </nav>

        {/* Navigasi bawah */}
        <div className="mt-auto px-md py-md border-t border-on-primary-fixed-variant flex flex-col gap-sm">
          <button
            onClick={handleLogout}
            className="flex items-center gap-md px-md py-sm text-on-primary hover:bg-on-primary-fixed-variant transition-colors duration-200 w-full text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Latar drawer mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Kolom konten */}
      <div className="md:ml-[260px] flex-1 flex flex-col min-h-screen">

        {/* Header atas */}
        <header className="fixed top-0 left-0 md:left-[260px] right-0 h-16 bg-surface border-b border-outline-variant z-10 font-label-md flex justify-between items-center gap-md px-4 md:px-lg">
          <div className="flex items-center gap-md md:gap-xl h-full min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-primary hover:bg-surface-container-low rounded-lg transition-colors flex-shrink-0"
              aria-label="Buka menu navigasi"
              aria-expanded={sidebarOpen}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="font-headline-sm text-headline-sm font-bold text-primary truncate">
              {pageTitle || 'Sistem Pencocokan Data BPS'}
            </span>
          </div>
          <div className="flex items-center gap-md">
            <div className="hidden lg:flex items-center gap-sm mr-md">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-body-md w-48 outline-none"
                placeholder="Cari..."
                type="text"
                readOnly
              />
            </div>
            <div className="flex items-center gap-md border-l border-outline-variant pl-md">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-on-surface font-semibold text-sm whitespace-nowrap">Employee</span>
                <span className="text-on-surface-variant text-xs whitespace-nowrap">Role: EMPLOYEE</span>
              </div>
              <div className="flex gap-sm">
                <button className="p-2 md:p-1 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low relative">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                </button>
                <button className="p-2 md:p-1 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low">
                  <span className="material-symbols-outlined">account_circle</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Konten halaman */}
        <main className="flex-1 mt-16 p-4 md:p-[32px] bg-background overflow-y-auto">
          <div className="w-full max-w-[1280px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-surface-container-low border-t border-outline-variant flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center p-md font-body-sm text-body-sm">
          <div className="text-primary font-bold text-center sm:text-left">
            © 2024 Badan Pusat Statistik Kota Malang - Tim IT BPS
          </div>
          <div className="flex flex-wrap justify-center gap-md sm:justify-end">
            <span className="text-on-surface-variant">Kebijakan Privasi</span>
            <span className="text-on-surface-variant">Syarat &amp; Ketentuan</span>
            <span className="text-on-surface-variant">Hubungi Kami</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
