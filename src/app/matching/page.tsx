/**
 * /matching
 * Matching page for MVP
 * Wraps MatchingContent with Suspense for Next.js pre-rendering
 */

import { Suspense } from 'react';
import { MatchingContent } from '@/components/matching/MatchingContent';

export const metadata = {
  title: 'Pencocokan Data - BPS Data Matching System',
  description: 'Sistem pencocokan data antar dataset',
};

function MatchingLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-on-surface-variant">Loading matching page...</p>
      </div>
    </div>
  );
}

export default function MatchingPage() {
  return (
    <Suspense fallback={<MatchingLoader />}>
      <MatchingContent />
    </Suspense>
  );
}
