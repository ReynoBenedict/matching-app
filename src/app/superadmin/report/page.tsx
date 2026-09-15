/**
 * /superadmin/report
 * Real, database-backed operational reports for Superadmin.
 * Server-side restricted to superadmin (role ADMIN).
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

  // Only superadmin may access the operational report page.
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <ReportContent backHref="/superadmin/dashboard" />;
}
