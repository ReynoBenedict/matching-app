'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registrasi gagal');
        setLoading(false);
        return;
      }

      // Registration successful - redirect to pending screen
      router.push(`/pending?email=${encodeURIComponent(data.email || formData.email)}`);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-on-background md:flex-row">
      {/* Panel identitas dan informasi kelembagaan */}
      <section className="relative shrink-0 bg-primary md:h-auto md:w-[40%]">
        <div className="flex h-full flex-col p-lg lg:p-xl">
          <Image
            src="/bps-logo.png"
            alt="Logo Badan Pusat Statistik Kota Malang"
            width={332}
            height={67}
            priority
            className="block h-auto w-auto max-w-full self-start"
          />

          <div className="my-auto py-xl">
            <p className="font-label-md text-label-md uppercase text-primary-fixed-dim">
              BPS Kota Malang
            </p>
            <h1 className="mt-sm font-headline-md text-headline-md text-on-primary">
              Sistem Pencocokan Data
            </h1>

            <div className="mt-2xl border-t border-on-primary-fixed-variant pt-lg">
              <h2 className="font-headline-sm text-headline-sm text-on-primary">
                Pengajuan Akses Sistem
              </h2>
              <p className="mt-sm font-body-md text-body-md text-primary-fixed">
                Pendaftaran akun bersifat pengajuan. Setelah Anda mengisi formulir, data akan
                diverifikasi oleh administrator sebelum akses diberikan.
              </p>

              <ul className="mt-xl space-y-md">
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined mt-px text-base text-primary-fixed-dim">
                    verified
                  </span>
                  <span className="font-body-md text-body-md text-primary-fixed">
                    Gunakan email resmi instansi jika memungkinkan.
                  </span>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined mt-px text-base text-primary-fixed-dim">
                    admin_panel_settings
                  </span>
                  <span className="font-body-md text-body-md text-primary-fixed">
                    Pendaftaran hanya untuk akun Pegawai (Employee).
                  </span>
                </li>
                <li className="flex items-start gap-sm">
                  <span className="material-symbols-outlined mt-px text-base text-primary-fixed-dim">
                    schedule
                  </span>
                  <span className="font-body-md text-body-md text-primary-fixed">
                    Proses verifikasi memakan waktu 1-2 hari kerja.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Panel formulir registrasi */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-[32rem] lg:max-w-[38rem]">
          <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="h-1 bg-primary" />

            <div className="p-6 sm:p-8">
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
                Formulir Registrasi
              </h2>
              <div className="mt-sm border-t border-outline-variant" />

              <div className="mt-md flex items-start gap-sm rounded border border-outline-variant bg-surface px-md py-sm">
                <span className="material-symbols-outlined mt-px text-base text-secondary">
                  info
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Akun yang diajukan akan memiliki peran Pegawai (Employee) dan perlu disetujui
                  oleh administrator.
                </p>
              </div>

              {error && (
                <div role="alert" className="mt-md rounded border border-error bg-error-container p-md">
                  <p className="font-body-md text-body-md text-on-error-container">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-lg">
                {/* Data identitas */}
                <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
                  <div>
                    <label
                      className="mb-sm block font-label-md text-label-md text-on-surface"
                      htmlFor="fullName"
                    >
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      placeholder="Sesuai KTP/SK"
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="w-full rounded border border-outline-variant bg-surface px-md py-2.5 font-body-md text-body-md text-on-surface transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label
                      className="mb-sm block font-label-md text-label-md text-on-surface"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="nama@bps.go.id"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="w-full rounded border border-outline-variant bg-surface px-md py-2.5 font-body-md text-body-md text-on-surface transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="mt-md">
                  <label
                    className="mb-sm block font-label-md text-label-md text-on-surface"
                    htmlFor="username"
                  >
                    Username / NIP
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Username atau NIP"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="w-full rounded border border-outline-variant bg-surface px-md py-2.5 font-body-md text-body-md text-on-surface transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Kredensial akun */}
                <div className="mt-lg border-t border-outline-variant pt-md">
                  <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
                    <div>
                      <label
                        className="mb-sm block font-label-md text-label-md text-on-surface"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Minimal 8 karakter"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="w-full rounded border border-outline-variant bg-surface px-md py-2.5 font-body-md text-body-md text-on-surface transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label
                        className="mb-sm block font-label-md text-label-md text-on-surface"
                        htmlFor="confirmPassword"
                      >
                        Konfirmasi Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Ketik ulang password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                        className="w-full rounded border border-outline-variant bg-surface px-md py-2.5 font-body-md text-body-md text-on-surface transition-colors focus:border-secondary focus:outline-none focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Area aksi */}
                <div className="mt-xl flex flex-col-reverse gap-sm sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-sm rounded border border-outline-variant bg-transparent px-md py-3 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Kembali ke Login
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-center gap-sm rounded bg-primary px-md py-3 font-label-md text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container disabled:opacity-70 sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                    {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
