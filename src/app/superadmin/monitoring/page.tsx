/**
 * /superadmin/monitoring
 * Superadmin Monitoring Dashboard for Phase 6A
 * Displays process monitoring and employee progress
 */

import { Suspense } from 'react';
import { MonitoringContent } from './MonitoringContent';

export const metadata = {
  title: 'Monitoring Progres - BPS Data Matching System',
  description: 'Monitor proses pencocokan dan progres verifikasi petugas',
};

function MonitoringLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-on-surface-variant">Memuat halaman monitoring...</p>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <Suspense fallback={<MonitoringLoader />}>
      <MonitoringContent />
    </Suspense>
  );
}