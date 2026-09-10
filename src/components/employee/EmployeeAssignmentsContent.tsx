'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmployeeLayout } from '@/components/layouts/EmployeeLayout';

interface Assignment {
  id: number;
  recordAId: number;
  recordBId: number;
  similarityScore: string;
  status: string;
  verificationResult: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export function EmployeeAssignmentsContent() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assignments/my', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Gagal memuat daftar penugasan');
        setLoading(false);
        return;
      }

      setAssignments(data.data || []);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat daftar penugasan: ' + (err instanceof Error ? err.message : 'Kesalahan tidak diketahui'));
      setLoading(false);
    }
  };

  const handleOpenAssignment = (assignmentId: number) => {
    router.push(`/employee/assignments/${assignmentId}`);
  };

  // Sort assignments: PENDING first, then COMPLETED
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    return 0;
  });

  if (loading) {
    return (
      <EmployeeLayout pageTitle="Penugasan Saya">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-on-surface-variant">Memuat daftar penugasan...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout pageTitle="Penugasan Saya">
        <div className="space-y-6">
          <div className="bg-error-container p-6 rounded-lg border border-error">
            <p className="font-semibold text-on-error-container mb-2">Kesalahan</p>
            <p className="text-sm text-on-error-container-variant mb-4">{error}</p>
            <button
              onClick={loadAssignments}
              className="bg-on-error-container text-error-container px-4 py-2 rounded-lg font-label-md hover:opacity-90 transition-opacity"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  if (assignments.length === 0) {
    return (
      <EmployeeLayout pageTitle="Penugasan Saya">
        <div className="space-y-6">
          <div className="bg-surface-container-low p-8 rounded-lg border border-outline-variant text-center">
            <span className="material-symbols-outlined text-outline-variant text-5xl mb-4 block">
              assignment
            </span>
            <p className="text-on-surface font-semibold mb-2">Tidak Ada Penugasan</p>
            <p className="text-sm text-on-surface-variant">
              Anda belum memiliki penugasan verifikasi. Penugasan baru akan ditampilkan di sini.
            </p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout pageTitle="Penugasan Saya">
      <div className="space-y-6">
        <div className="mb-4">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2">
            Penugasan Verifikasi
          </h2>
          <p className="text-on-surface-variant text-body-md">
            Total: {assignments.length} penugasan
          </p>
        </div>

        {/* Assignments list */}
        <div className="space-y-3">
          {sortedAssignments.map((assignment) => {
            const score = (parseFloat(assignment.similarityScore) * 100).toFixed(1);

            return (
              <button
                key={assignment.id}
                onClick={() => handleOpenAssignment(assignment.id)}
                className="w-full text-left p-4 rounded-lg border-2 bg-surface-container-low border-outline-variant hover:border-primary hover:bg-surface-container transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant mb-1">
                          Record A
                        </p>
                        <p className="text-sm font-semibold text-on-surface">
                          ID: {assignment.recordAId}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant mb-1">
                          Record B
                        </p>
                        <p className="text-sm font-semibold text-on-surface">
                          ID: {assignment.recordBId}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-on-surface-variant mb-1">
                          Skor Kesamaan
                        </p>
                        <p className="text-sm font-semibold text-on-surface">{score}%</p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-on-surface-variant">
                          Status:
                        </span>
                        {assignment.status === 'COMPLETED' ? (
                          <>
                            <span
                              className="material-symbols-outlined text-on-surface-variant"
                              style={{ fontSize: '16px' }}
                            >
                              check_circle
                            </span>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                assignment.verificationResult === 'MATCH'
                                  ? 'bg-success-container text-on-success-container'
                                  : 'bg-tertiary-container text-on-tertiary-container'
                              }`}
                            >
                              {assignment.verificationResult}
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className="material-symbols-outlined text-on-surface-variant"
                              style={{ fontSize: '16px' }}
                            >
                              schedule
                            </span>
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-warning-container text-on-warning-container">
                              PENDING
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant mt-2">
                      Dibuat: {new Date(assignment.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <span
                    className="material-symbols-outlined text-on-surface-variant flex-shrink-0"
                    style={{ fontSize: '24px' }}
                  >
                    arrow_forward
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </EmployeeLayout>
  );
}
