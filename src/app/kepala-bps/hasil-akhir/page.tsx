/**
 * /kepala-bps/hasil-akhir
 * Hasil akhir verifikasi, hanya-baca.
 * Hanya untuk Kepala BPS (role HEAD).
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

  // Hanya Kepala BPS yang boleh mengakses halaman ini.
  if (!user || user.role !== 'HEAD') {
    redirect('/login');
  }

  return <HasilAkhirContent />;
}
