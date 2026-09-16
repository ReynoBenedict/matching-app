/**
 * /superadmin/assignments
 * Halaman manajemen penugasan Superadmin.
 * Membungkus AssignmentContent dengan Suspense.
 */

import { Suspense } from 'react';
import { AssignmentContent } from '@/components/assignments/AssignmentContent';

export const metadata = {
  title: 'Manajemen Penugasan - BPS Data Matching System',
  description: 'Sistem manajemen penugasan kandidat pencocokan ke pegawai',
};

function AssignmentLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-on-surface-variant">Memuat halaman assignment...</p>
      </div>
    </div>
  );
}

export default function AssignmentPage() {
  return (
    <Suspense fallback={<AssignmentLoader />}>
      <AssignmentContent />
    </Suspense>
  );
}
