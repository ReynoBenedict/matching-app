'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
        } else if (userRole === 'EMPLOYEE') {
          router.push('/employee/dashboard');
        } else if (userRole === 'HEAD') {
          router.push('/kepala-bps/dashboard');
        } else {
          // Fallback for other roles
          router.push('/dashboard');
        }
      } else {
        // Fallback
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-on-background md:flex-row">
      {/* Hero: foto gedung sebagai latar, 40% di desktop */}
      <section className="relative h-64 shrink-0 overflow-hidden bg-primary sm:h-72 md:h-auto md:w-[38%] lg:w-[40%]">
        <Image
          src="/bps-building.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 38vw, 40vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/80 to-primary/65" />

        <div className="relative z-10 flex h-full flex-col justify-between gap-lg p-lg lg:p-xl">
          <Image
            src="/bps-logo.png"
            alt="Logo Badan Pusat Statistik Kota Malang"
            width={332}
            height={67}
            priority
            className="block h-auto w-auto max-w-[10rem] self-start lg:max-w-[13rem]"
          />

          <div>
            <p className="font-label-md text-label-md uppercase text-primary-fixed-dim">
              BPS Kota Malang
            </p>
            <h1 className="mt-sm font-headline-md text-headline-md text-on-primary">
              Sistem Pencocokan Data
            </h1>
            <p className="mt-sm max-w-[20rem] font-body-md text-body-md text-primary-fixed">
              Sistem internal untuk pencocokan dan verifikasi data.
            </p>
          </div>
        </div>
      </section>

      {/* Panel formulir login, 60% di desktop */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 md:px-5 lg:px-10">
        <div className="w-full max-w-[28rem]">
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="h-1 bg-primary" />

            <form onSubmit={handleSubmit} className="p-7 sm:p-9">
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Masuk ke Akun</h2>
              <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
                Silakan masuk untuk melanjutkan.
              </p>

              {error && (
                <div role="alert" className="mt-md rounded border border-error bg-error-container p-md">
                  <p className="font-body-md text-body-md text-on-error-container">{error}</p>
                </div>
              )}

              <div className="mt-xl">
                <label htmlFor="username" className="mb-sm block font-label-md text-label-md text-on-surface">
                  Username / NIP
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-xl text-outline">person</span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Masukkan Username atau NIP Anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full rounded border border-outline-variant bg-surface py-2.5 pl-11 pr-md font-body-md text-body-md text-on-surface transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="mt-xl">
                <label htmlFor="password" className="mb-sm block font-label-md text-label-md text-on-surface">
                  Kata Sandi
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-xl text-outline">lock</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Masukkan Kata Sandi Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="w-full rounded border border-outline-variant bg-surface py-2.5 pl-11 pr-11 font-body-md text-body-md text-on-surface transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 cursor-pointer border-none bg-none p-0 text-xl text-outline hover:text-primary disabled:opacity-50"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                <div className="mt-sm flex justify-end">
                  <a href="#" className="font-label-md text-label-md text-secondary hover:text-primary hover:underline">
                    Lupa kata sandi?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-xl flex w-full cursor-pointer items-center justify-center rounded bg-primary px-md py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-70"
              >
                <span className="material-symbols-outlined mr-2 text-lg">login</span>
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            <div className="border-t border-outline-variant bg-surface-container-low px-6 py-md text-center">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Belum memiliki akun?{' '}
                <Link href="/register" className="font-label-md text-label-md text-primary hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
