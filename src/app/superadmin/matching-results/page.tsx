/**
 * /superadmin/matching-results
 * Hasil pencocokan berbasis basis data.
 * Hanya untuk Superadmin (role ADMIN).
 */

import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { MatchingResultsContent } from './MatchingResultsContent';

export const metadata = {
  title: 'Hasil Matching - BPS Data Matching System',
  description: 'Daftar hasil pencocokan data yang tersimpan di basis data',
};

export default async function MatchingResultsPage() {
  const user = await getAuthenticatedUser();

  // Hanya Superadmin yang boleh mengakses hasil pencocokan.
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <MatchingResultsContent />;
}
