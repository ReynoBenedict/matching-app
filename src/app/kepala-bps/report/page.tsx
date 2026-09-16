/**
 * /kepala-bps/report
 * Laporan hanya-baca untuk Kepala BPS.
 * Hanya untuk Kepala BPS (role HEAD).
 */

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { ReportContent } from '@/components/reports/ReportContent';

export const metadata = {
  title: 'Laporan - BPS Data Matching System',
  description: 'Ringkasan laporan sistem pencocokan data',
};

export default async function KepalaReportPage() {
  const user = await getAuthenticatedUser();

  // Hanya Kepala BPS yang boleh mengakses halaman ini.
  if (!user || user.role !== 'HEAD') {
    redirect('/login');
  }

  return <ReportContent backHref="/kepala-bps/dashboard" />;
}
