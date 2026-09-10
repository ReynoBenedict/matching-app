/**
 * /employee/assignments
 * Employee Assignment List for Phase 5C
 * Employee can view their assignments and select one to verify
 */

import { Suspense } from 'react';
import { EmployeeAssignmentsContent } from '@/components/employee/EmployeeAssignmentsContent';

export const metadata = {
  title: 'Penugasan Saya - BPS Data Matching System',
  description: 'Daftar penugasan yang di-assign ke saya untuk verifikasi',
};

function AssignmentListLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-on-surface-variant">Memuat daftar penugasan...</p>
      </div>
    </div>
  );
}

export default function EmployeeAssignmentsPage() {
  return (
    <Suspense fallback={<AssignmentListLoader />}>
      <EmployeeAssignmentsContent />
    </Suspense>
  );
}
