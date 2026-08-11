'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement> & { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Login gagal');
        setLoading(false);
        return;
      }

      // Get current user to determine role-based redirect
      const meResponse = await fetch('/api/auth/me');
      if (meResponse.ok) {
        const meData = await meResponse.json();
        const userRole = meData.user?.role;

        // Route based on role
        if (userRole === 'ADMIN') {
          router.push('/superadmin/dashboard');
        } else {
          // For other roles, use generic dashboard for now
          router.push('/dashboard');
        }
      } else {
        // Fallback to generic dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4 font-sans text-[#0b1c30]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>
      
      <main className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#002b5a] flex items-center justify-center mx-auto mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[32px] text-white">dataset_linked</span>
          </div>
          <h1 className="text-3xl font-bold text-[#002b5a] mb-1">BPS Kota Malang</h1>
          <h2 className="text-xl font-semibold text-[#424750]">Sistem Pencocokan Data</h2>
        </div>

        <div className="bg-white border border-[#c3c6d2] rounded shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#002b5a]"></div>

          <form onSubmit={handleSubmit} className="p-8 pt-12">
            {error && (
              <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded p-4 mb-6">
                <p className="text-[#93000a] text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#0b1c30] mb-1 tracking-wide">Username / NIP</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2 text-[#737781] text-xl pointer-events-none">person</span>
                <input
                  type="text"
                  placeholder="Masukkan Username atau NIP Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-2 py-2 border border-[#c3c6d2] rounded bg-[#f8f9ff] text-[#0b1c30] text-sm focus:border-[#006493] focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#0b1c30] mb-1 tracking-wide">Kata Sandi</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2 text-[#737781] text-xl pointer-events-none">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan Kata Sandi Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-[#c3c6d2] rounded bg-[#f8f9ff] text-[#0b1c30] text-sm focus:border-[#006493] focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="material-symbols-outlined absolute right-3 top-2 text-[#737781] text-xl hover:text-[#002b5a] disabled:opacity-50 bg-none border-none p-0 cursor-pointer"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
              <div className="mt-2 flex justify-end">
                <a href="#" className="text-xs text-[#006493] hover:text-[#002b5a] hover:underline">Lupa kata sandi?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border-none rounded shadow-sm text-xs font-semibold text-white bg-[#002b5a] hover:bg-[#0c4687] disabled:opacity-70 cursor-pointer mt-6"
            >
              <span className="material-symbols-outlined mr-2 text-lg">login</span>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="border-t border-[#c3c6d2] p-6 text-center">
            <p className="text-xs text-[#424750]">
              Belum memiliki akun? <Link href="/register" className="font-semibold text-[#002b5a] hover:underline ml-1">Daftar di sini</Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-[#737781]">© 2024 Badan Pusat Statistik Kota Malang - Tim IT BPS</p>
          <p className="text-xs text-[#737781] mt-1">Akses terbatas hanya untuk pegawai berwenang.</p>
        </div>
      </main>
    </div>
  );
}
