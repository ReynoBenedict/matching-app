/**
 * /employee/assignments/[id]
 * Employee Assignment Detail for Phase 5C
 * Employee can view candidate information and choose MATCH or NON-MATCH
 */

import { Suspense } from 'react';
import { AssignmentDetailContent } from '@/components/employee/AssignmentDetailContent';

export const metadata = {
  title: 'Verifikasi Penugasan - BPS Data Matching System',
  description: 'Verifikasi penugasan kandidat pencocokan data',
};

function AssignmentDetailLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-on-surface-variant">Memuat detail penugasan...</p>
      </div>
    </div>
  );
}

export default function AssignmentDetailPage() {
  return (
    <Suspense fallback={<AssignmentDetailLoader />}>
      <AssignmentDetailContent />
    </Suspense>
  );
}
