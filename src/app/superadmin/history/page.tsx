/**
 * /superadmin/history
 * Riwayat Proses berbasis tabel audit_logs.
 * Hanya untuk Superadmin (role ADMIN).
 */

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { HistoryContent } from './HistoryContent';

export const metadata = {
  title: 'Riwayat Proses - BPS Data Matching System',
  description: 'Log audit dan aktivitas sistem pencocokan data',
};

export default async function HistoryPage() {
  const user = await getAuthenticatedUser();

  // Hanya Superadmin yang boleh mengakses halaman riwayat.
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <HistoryContent />;
}
