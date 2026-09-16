/**
 * /superadmin/report
 * Laporan operasional berbasis basis data.
 * Hanya untuk Superadmin (role ADMIN).
 */

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { ReportContent } from '@/components/reports/ReportContent';

export const metadata = {
  title: 'Laporan - BPS Data Matching System',
  description: 'Laporan operasional sistem pencocokan data',
};

export default async function SuperadminReportPage() {
  const user = await getAuthenticatedUser();

  // Hanya Superadmin yang boleh mengakses laporan operasional.
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <ReportContent backHref="/superadmin/dashboard" />;
}
