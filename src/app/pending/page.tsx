'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import Link from 'next/link';

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  if (!email) {
    return null;
  }

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
                  schedule
                </span>
                <div>
                  <h1 className="text-xl font-bold leading-tight">
                    Persetujuan Sedang Diproses
                  </h1>
                  <p className="text-sm text-[#b3d9ff] font-normal">
                    Sistem Pencocokan Data
                  </p>
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-4 mt-8">
                Menunggu Verifikasi Administrator
              </h2>
              <p className="text-sm text-[#e8f1ff] mb-6">
                Pengajuan akses Anda telah kami terima dan sedang dalam proses verifikasi.
              </p>
              <ul className="space-y-2 text-xs text-[#e8f1ff]">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">
                    schedule
                  </span>
                  <span>Proses verifikasi dapat memakan waktu 1-2 hari kerja.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">
                    mail
                  </span>
                  <span>Anda akan menerima email notifikasi ketika akses disetujui.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">
                    info
                  </span>
                  <span>Jika ada pertanyaan, hubungi IT BPS Kota Malang.</span>
                </li>
              </ul>
            </div>
            <div className="text-xs text-[#b3d9ff] mt-8">
              © 2024 Badan Pusat Statistik Kota Malang
            </div>
          </div>

          {/* Status Section */}
          <div className="w-full md:w-3/5 p-6 md:p-8 bg-white flex flex-col justify-center items-center">
            {/* Mobile Header */}
            <div className="md:hidden mb-6 w-full text-center">
              <h1 className="text-2xl font-bold text-[#002b5a] mb-2">
                Persetujuan Sedang Diproses
              </h1>
              <p className="text-sm text-[#424750]">
                Terima kasih telah mendaftar di Sistem Pencocokan Data
              </p>
            </div>

            {/* Large Icon */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#ffdbcb] flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[48px] md:text-[56px] text-[#4e1c00]">
                schedule
              </span>
            </div>

            {/* Status Message */}
            <h2 className="text-xl font-semibold text-[#002b5a] mb-2 text-center">
              Pengajuan Anda Sedang Diproses
            </h2>
            <p className="text-center text-[#424750] mb-6 text-sm">
              Kami telah menerima pengajuan akses Anda dengan email:{' '}
              <span className="font-bold text-[#002b5a]">{email}</span>
            </p>

            {/* Details Card */}
            <div className="w-full bg-[#eff4ff] border border-[#dce9ff] rounded p-4 md:p-6 mb-6 space-y-4">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#006493] flex-shrink-0 mt-0.5">
                  check_circle
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#002b5a]">
                    Data Anda Telah Disimpan
                  </p>
                  <p className="text-xs text-[#424750] mt-1">
                    Semua informasi telah disimpan dengan aman di sistem.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#f59e0b] flex-shrink-0 mt-0.5">
                  hourglass_empty
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#002b5a]">
                    Menunggu Persetujuan Administrator
                  </p>
                  <p className="text-xs text-[#424750] mt-1">
                    Administrator akan memeriksa peran Anda dalam 1-2 hari kerja.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#006493] flex-shrink-0 mt-0.5">
                  mail_outline
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#002b5a]">
                    Pemberitahuan Email
                  </p>
                  <p className="text-xs text-[#424750] mt-1">
                    Kami akan mengirimkan notifikasi ketika persetujuan selesai.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="w-full bg-[#eff4ff] border border-[#dce9ff] rounded p-4 md:p-6 mb-6">
              <p className="text-sm font-semibold text-[#002b5a] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">lightbulb</span>
                Tips Berguna
              </p>
              <ul className="space-y-2 text-xs text-[#424750]">
                <li className="flex gap-2">
                  <span className="text-[#006493] font-bold flex-shrink-0">•</span>
                  <span>Pastikan email Anda aktif untuk menerima pemberitahuan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#006493] font-bold flex-shrink-0">•</span>
                  <span>Jika belum disetujui setelah 3 hari, hubungi administrator.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#006493] font-bold flex-shrink-0">•</span>
                  <span>Jangan membagikan password atau informasi akun Anda.</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col md:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="flex-1 md:flex-none px-4 py-2 border border-[#c3c6d2] text-[#002b5a] text-sm font-semibold rounded hover:bg-[#f8f9ff] transition-colors text-center"
              >
                Kembali ke Login
              </Link>
              <a
                href="mailto:support@bps.go.id"
                className="flex-1 md:flex-none px-4 py-2 bg-[#002b5a] text-white text-sm font-semibold rounded hover:bg-[#0c4687] transition-colors text-center flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                Hubungi Dukungan
              </a>
            </div>
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

export default function PendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PendingContent />
    </Suspense>
  );
}
