/**
 * /kepala-bps/hasil-akhir
 * Real, read-only final verification results for Kepala BPS.
 * Server-side restricted to the Kepala BPS role (HEAD).
 */

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { HasilAkhirContent } from './HasilAkhirContent';

export const metadata = {
  title: 'Hasil Akhir - BPS Data Matching System',
  description: 'Hasil akhir verifikasi kandidat pencocokan data',
};

export default async function HasilAkhirPage() {
  const user = await getAuthenticatedUser();

  // Only Kepala BPS may access this page.
  if (!user || user.role !== 'HEAD') {
    redirect('/login');
  }

  return <HasilAkhirContent />;
}
