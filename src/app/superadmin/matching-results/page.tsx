/**
 * /superadmin/matching-results
 * Phase 6B: Real, database-backed matching results.
 * Server-side restricted to superadmin (role ADMIN).
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

  // Only superadmin may access the matching results page.
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  return <MatchingResultsContent />;
}
