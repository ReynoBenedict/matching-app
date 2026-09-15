/**
 * /superadmin/history
 * Real, database-backed Riwayat Proses (audit_logs).
 * Server-side restricted to superadmin (role ADMIN).
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

  // Only superadmin may access the history page.
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <HistoryContent />;
}
