'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch current user
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        setUser(data.user);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user:', err);
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout gagal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-on-surface font-body-md">Memproses...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg flex justify-between items-center">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary">
                dataset_linked
              </span>
            </div>
            <div>
              <h1 className="font-headline-sm text-headline-sm text-primary">
                BPS Kota Malang
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Sistem Pencocokan Data
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-sm px-md py-sm bg-error text-on-error rounded font-label-md text-label-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[20px]">
              logout
            </span>
            Keluar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        {error && (
          <div className="bg-error-container border border-error rounded p-md mb-lg">
            <p className="text-on-error-container font-body-md text-body-md">
              {error}
            </p>
          </div>
        )}

        {/* Welcome Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm mb-lg">
          <div className="flex items-center gap-lg">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[32px] text-on-primary">
                person
              </span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                Selamat datang, {user.fullName}!
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Role: <span className="font-label-md">{user.role}</span>
              </p>
            </div>
          </div>
        </div>

        {/* User Information Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">
            Informasi Akun
          </h3>
          <div className="space-y-md">
            <div className="flex justify-between items-center pb-md border-b border-outline-variant">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Nama Lengkap
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {user.fullName}
              </span>
            </div>
            <div className="flex justify-between items-center pb-md border-b border-outline-variant">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Email
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {user.email}
              </span>
            </div>
            <div className="flex justify-between items-center pb-md border-b border-outline-variant">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Username
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {user.username}
              </span>
            </div>
            <div className="flex justify-between items-center pb-md border-b border-outline-variant">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Status
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {user.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-label-md text-label-md text-on-surface-variant">
                Role
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Material Symbols Icons */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
    </div>
  );
}
