/**
 * /kepala-bps/dashboard
 * Real, read-only executive dashboard backed by the database.
 * Server-side restricted to the Kepala BPS role (HEAD).
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

  // Only Kepala BPS may access this dashboard.
  if (!user || user.role !== 'HEAD') {
    redirect('/login');
  }

  return <KepalaDashboardContent />;
}
