/**
 * /kepala-bps/dashboard
 * Dasbor eksekutif hanya-baca berbasis basis data.
 * Hanya untuk Kepala BPS (role HEAD).
 */

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { KepalaDashboardContent } from './KepalaDashboardContent';

export const metadata = {
  title: 'Dashboard Kepala BPS - BPS Data Matching System',
  description: 'Ringkasan kinerja sistem pencocokan data untuk Kepala BPS',
};

export default async function KepalaDashboardPage() {
  const user = await getAuthenticatedUser();

  // Hanya Kepala BPS yang boleh mengakses dasbor ini.
  if (!user || user.role !== 'HEAD') {
    redirect('/login');
  }

  return <KepalaDashboardContent />;
}
