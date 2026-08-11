'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    role: '',
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
          requestedRole: formData.role,
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
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-4 md:p-8 font-sans text-[#0b1c30]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}</style>

      <main className="w-full max-w-6xl">
        <div className="bg-white border border-[#c3c6d2] rounded overflow-hidden shadow-sm flex flex-col md:flex-row">
          {/* Branding Section - Hidden on Mobile */}
          <div className="hidden md:flex md:w-2/5 bg-[#002b5a] p-8 text-white flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-[32px]">
                  dataset_linked
                </span>
                <div>
                  <h1 className="text-xl font-bold leading-tight">
                    Sistem Pencocokan Data
                  </h1>
                  <p className="text-sm text-[#b3d9ff] font-normal">
                    BPS Kota Malang
                  </p>
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-4 mt-8">
                Pengajuan Akses Sistem
              </h2>
              <p className="text-sm text-[#e8f1ff] mb-6">
                Pendaftaran akun ini bersifat pengajuan. Setelah Anda mengisi
                formulir ini, tim administrator akan memverifikasi data dan peran
                yang Anda ajukan sebelum akses diberikan.
              </p>
              <ul className="space-y-2 text-xs text-[#e8f1ff]">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">
                    verified
                  </span>
                  <span>Gunakan email resmi instansi jika memungkinkan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">
                    admin_panel_settings
                  </span>
                  <span>Pemilihan peran harus sesuai dengan SK tugas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">
                    schedule
                  </span>
                  <span>Proses verifikasi memakan waktu 1-2 hari kerja.</span>
                </li>
              </ul>
            </div>
            <div className="text-xs text-[#b3d9ff] mt-8">
              © 2024 Badan Pusat Statistik Kota Malang
            </div>
          </div>

          {/* Form Section */}
          <div className="w-full md:w-3/5 p-6 md:p-8 bg-white">
            {/* Mobile Header */}
            <div className="md:hidden mb-6">
              <h1 className="text-2xl font-bold text-[#002b5a] mb-2">
                Sistem Pencocokan Data
              </h1>
              <p className="text-sm text-[#424750]">
                Pendaftaran akun bersifat pengajuan dan membutuhkan verifikasi
                administrator.
              </p>
            </div>

            <h2 className="text-lg font-semibold text-[#002b5a] mb-4 border-b border-[#c3c6d2] pb-2">
              Formulir Registrasi
            </h2>

            {error && (
              <div className="bg-[#ffdad6] border border-[#ba1a1a] rounded p-4 mb-4">
                <p className="text-[#93000a] text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label
                    className="block text-xs font-semibold text-[#0b1c30] mb-1 tracking-wide"
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
                    className="w-full border border-[#c3c6d2] rounded px-3 py-2 text-sm text-[#0b1c30] bg-[#f8f9ff] focus:border-[#006493] focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    className="block text-xs font-semibold text-[#0b1c30] mb-1 tracking-wide"
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
                    className="w-full border border-[#c3c6d2] rounded px-3 py-2 text-sm text-[#0b1c30] bg-[#f8f9ff] focus:border-[#006493] focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username / NIP */}
                <div>
                  <label
                    className="block text-xs font-semibold text-[#0b1c30] mb-1 tracking-wide"
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
                    className="w-full border border-[#c3c6d2] rounded px-3 py-2 text-sm text-[#0b1c30] bg-[#f8f9ff] focus:border-[#006493] focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Peran */}
                <div>
                  <label
                    className="block text-xs font-semibold text-[#0b1c30] mb-1 tracking-wide"
                    htmlFor="role"
                  >
                    Peran yang Diajukan
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      className="w-full border border-[#c3c6d2] rounded px-3 py-2 text-sm text-[#0b1c30] bg-[#f8f9ff] focus:border-[#006493] focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] focus:outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Pilih Peran...</option>
                      <option value="ADMIN">Superadmin</option>
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HEAD">Kepala BPS</option>
                      <option value="VERIFICATION_OFFICER">
                        Petugas Verifikasi
                      </option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-2 text-[#737781] text-lg pointer-events-none">
                      arrow_drop_down
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label
                    className="block text-xs font-semibold text-[#0b1c30] mb-1 tracking-wide"
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
                    className="w-full border border-[#c3c6d2] rounded px-3 py-2 text-sm text-[#0b1c30] bg-[#f8f9ff] focus:border-[#006493] focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label
                    className="block text-xs font-semibold text-[#0b1c30] mb-1 tracking-wide"
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
                    className="w-full border border-[#c3c6d2] rounded px-3 py-2 text-sm text-[#0b1c30] bg-[#f8f9ff] focus:border-[#006493] focus:ring-2 focus:ring-[rgba(0,100,147,0.2)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#006493] hover:text-[#002b5a] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_back
                  </span>
                  Kembali ke Login
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex justify-center items-center py-2 px-4 border-none rounded shadow-sm text-xs font-semibold text-white bg-[#002b5a] hover:bg-[#0c4687] disabled:opacity-70 cursor-pointer"
                >
                  <span className="material-symbols-outlined mr-2 text-sm">
                    send
                  </span>
                  {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
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
