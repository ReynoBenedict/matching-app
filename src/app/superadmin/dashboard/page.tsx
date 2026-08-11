'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
}

export default function SuperadminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
          return;
        }
        const data = await response.json();
        
        // Verify it's a superadmin
        if (data.user?.role !== 'ADMIN') {
          router.push('/login');
          return;
        }
        
        setUser(data.user);
        setLoading(false);
      } catch {
        setError('Terjadi kesalahan saat memuat data');
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '40px', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
          <p style={{ marginTop: '16px', color: '#424750' }}>Memuat...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #c3c6d2', borderRadius: '4px', padding: '32px', maxWidth: '400px' }}>
          <p style={{ color: '#93000a', fontSize: '14px' }}>{error || 'Akses ditolak'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9ff', fontFamily: "'Public Sans', sans-serif", color: '#0b1c30', display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-size: inherit; }
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .header { left: 0 !important; }
        }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        display: 'flex',
        width: '260px',
        height: '100vh',
        backgroundColor: '#002b5a',
        color: '#ffffff',
        padding: '32px 16px',
        position: 'fixed',
        left: 0,
        top: 0,
        borderRight: '1px solid #c3c6d2',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 20,
        flexDirection: 'column',
        overflowY: 'auto'
      }} className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: '#002b5a' }}>
            BPS
          </div>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: '600', lineHeight: '1.4', margin: '0' }}>
              Sistem Pencocokan Data
            </h1>
            <p style={{ fontSize: '12px', margin: '4px 0 0 0', opacity: 0.8, color: '#b3d9ff' }}>
              Kota Malang
            </p>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              borderRadius: '4px',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0c4687')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </a>
          <Link
            href="/superadmin/registration-requests"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              borderRadius: '4px',
              color: '#ffffff',
              backgroundColor: '#0c4687',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <span className="material-symbols-outlined">group</span>
            Manajemen Pengguna
          </Link>
        </nav>

        <div style={{ borderTop: '1px solid #0c4687', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              borderRadius: '4px',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              background: 'none',
              border: 'none'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0c4687')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span className="material-symbols-outlined">logout</span>
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: '260px',
        right: 0,
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #c3c6d2',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: '24px',
        paddingRight: '24px',
        zIndex: 10
      }} className="header">
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#002b5a', margin: '0' }}>
          Dashboard Superadmin
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={{ background: 'none', border: 'none', color: '#002b5a', cursor: 'pointer', padding: '8px' }}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button style={{ background: 'none', border: 'none', color: '#002b5a', cursor: 'pointer', padding: '8px' }}>
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginTop: '64px',
        marginLeft: '260px',
        padding: '32px 24px',
        width: 'calc(100% - 260px)'
      }} className="main-content">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Welcome Section */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#002b5a', margin: '0 0 8px 0' }}>
              Selamat Datang, {user.fullName}
            </h1>
            <p style={{ fontSize: '14px', color: '#424750', margin: '0', maxWidth: '600px' }}>
              Kelola sistem pencocokan data dan administrasi pengguna.
            </p>
          </div>

          {/* Dashboard Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Manajemen Pengguna Card */}
            <Link
              href="/superadmin/registration-requests"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #c3c6d2',
                borderRadius: '4px',
                padding: '24px',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                cursor: 'pointer',
                display: 'block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#002b5a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#c3c6d2';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ 
                  width: '48px',
                  height: '48px',
                  borderRadius: '4px',
                  backgroundColor: '#eff4ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#002b5a',
                  fontSize: '24px'
                }}>
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#002b5a', margin: '0 0 8px 0' }}>
                    Manajemen Pengguna
                  </h3>
                  <p style={{ fontSize: '13px', color: '#424750', margin: '0' }}>
                    Kelola registrasi pengguna, persetujuan, dan daftar pengguna aktif.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
