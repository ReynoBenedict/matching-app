/**
 * /superadmin/monitoring
 * Dasbor pemantauan progres penugasan dan pegawai dari basis data.
 * Hanya untuk Superadmin (role ADMIN).
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { MonitoringContent } from './MonitoringContent';

export const metadata = {
  title: 'Monitoring Progres - BPS Data Matching System',
  description: 'Monitor progres penugasan dan kinerja petugas verifikasi',
};

function MonitoringLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-on-surface-variant">Memuat halaman monitoring...</p>
      </div>
    </div>
  );
}

export default async function MonitoringPage() {
  const user = await getAuthenticatedUser();

  // Hanya Superadmin yang boleh mengakses halaman pemantauan.
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <Suspense fallback={<MonitoringLoader />}>
      <MonitoringContent />
    </Suspense>
  );
}
