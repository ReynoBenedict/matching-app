'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { EmployeeLayout } from '@/components/layouts/EmployeeLayout';
import { formatPercent, scoreBadgeClass } from '@/components/assignments/score';

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

function toScore(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCard({ label, value, icon, tone }: {
  label: string;
  value: number;
  icon: string;
  tone: string;
}) {
  return (
    <div className="bg-surface p-4 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2 text-on-surface-variant">
        <span className="font-label-md text-xs uppercase tracking-wide">{label}</span>
        <span className={`material-symbols-outlined ${tone}`} style={{ fontSize: '20px' }}>
          {icon}
        </span>
      </div>
      <div className={`font-headline-lg text-headline-lg ${tone}`}>{value}</div>
    </div>
  );
}

/**
 * Status pill + accent colour for one assignment, derived from the stored
 * verification result so pending and completed rows read differently at a glance.
 */
function statusMeta(assignment: Assignment): { pillClass: string; label: string; icon: string; accent: string } {
  if (assignment.verificationResult === 'MATCH') {
    return {
      pillClass: 'bg-success-container text-on-success-container',
      label: 'MATCH',
      icon: 'check_circle',
      accent: 'bg-success',
    };
  }
  if (assignment.verificationResult === 'NON_MATCH') {
    return {
      pillClass: 'bg-error-container text-on-error-container',
      label: 'NON-MATCH',
      icon: 'cancel',
      accent: 'bg-error',
    };
  }
  if (assignment.status === 'COMPLETED') {
    return {
      pillClass: 'bg-surface-container-high text-on-surface-variant',
      label: 'Selesai',
      icon: 'task_alt',
      accent: 'bg-outline',
    };
  }
  return {
    pillClass: 'bg-warning-container text-on-warning-container',
    label: 'Menunggu Verifikasi',
    icon: 'schedule',
    accent: 'bg-warning',
  };
}

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  const meta = statusMeta(assignment);
  const isCompleted = assignment.status === 'COMPLETED';

  return (
    <li className="border-b border-outline-variant last:border-b-0">
      <Link
        href={`/employee/assignments/${assignment.id}`}
        className="flex items-stretch hover:bg-surface-container-low transition-colors"
      >
        <span className={`w-1 flex-shrink-0 ${meta.accent}`} aria-hidden="true" />
        <span className="flex-1 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="flex items-center gap-4 min-w-0">
            <span className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                fact_check
              </span>
            </span>
            <span className="min-w-0">
              <span className="block font-body-md font-semibold text-on-surface">
                Penugasan #{assignment.id}
              </span>
              <span className="block font-label-md text-xs text-on-surface-variant mt-1">
                Record A {assignment.recordAId} · Record B {assignment.recordBId}
              </span>
              <span className="block font-label-md text-xs text-on-surface-variant mt-0.5">
                {isCompleted
                  ? `Diverifikasi ${formatDateTime(assignment.verifiedAt)}`
                  : `Dibuat ${formatDate(assignment.createdAt)}`}
              </span>
            </span>
          </span>

          <span className="flex items-center gap-3 flex-shrink-0 flex-wrap sm:flex-nowrap">
            <span className="flex flex-col items-start sm:items-end">
              <span className="font-label-md text-[10px] uppercase tracking-wide text-on-surface-variant">
                Skor Kesamaan
              </span>
              <span
                className={`px-2 py-1 rounded font-label-md ${scoreBadgeClass(
                  toScore(assignment.similarityScore)
                )}`}
              >
                {formatPercent(toScore(assignment.similarityScore))}
              </span>
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-label-md ${meta.pillClass}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {meta.icon}
              </span>
              {meta.label}
            </span>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
              arrow_forward
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function SectionHeader({ title, count, icon, tone }: {
  title: string;
  count: number;
  icon: string;
  tone: string;
}) {
  return (
    <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex items-center gap-3">
      <span className={`material-symbols-outlined ${tone}`} style={{ fontSize: '20px' }}>
        {icon}
      </span>
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md">
        {count}
      </span>
    </div>
  );
}

export function EmployeeAssignmentsContent() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assignments/my', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Gagal memuat daftar penugasan');
        return;
      }

      setAssignments(data.data || []);
    } catch (err) {
      setError('Gagal memuat daftar penugasan: ' + (err instanceof Error ? err.message : 'Kesalahan tidak diketahui'));
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssignments();
  }, [loadAssignments]);

  const breadcrumb = (
    <div className="mb-2">
      <span className="text-on-surface-variant text-label-md text-xs">
        Sistem Pencocokan Data /{' '}
        <span className="text-primary font-semibold">Penugasan Saya</span>
      </span>
    </div>
  );

  const header = (
    <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
      <div>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-1">Penugasan Saya</h2>
        <p className="font-body-md text-on-surface-variant">
          Daftar penugasan verifikasi yang ditugaskan kepada Anda.
        </p>
      </div>
      <button
        onClick={() => loadAssignments(true)}
        disabled={refreshing}
        className="px-4 py-2 bg-surface border border-outline-variant text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-1 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>
          refresh
        </span>
        {refreshing ? 'Memperbarui...' : 'Perbarui'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <EmployeeLayout pageTitle="Penugasan Saya">
        {breadcrumb}
        {header}
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
            progress_activity
          </span>
          <p className="font-body-lg text-on-surface-variant">Memuat daftar penugasan...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout pageTitle="Penugasan Saya">
        {breadcrumb}
        {header}
        <div className="bg-error-container border-l-4 border-error p-6 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-on-error-container font-body-md">{error}</p>
            </div>
            <button
              onClick={() => loadAssignments()}
              className="px-4 py-2 bg-error text-on-error font-label-md rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
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
        {breadcrumb}
        {header}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm py-16 px-6 text-center">
          <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
            assignment
          </span>
          <p className="font-headline-sm text-headline-sm text-on-surface mt-4">Tidak Ada Penugasan</p>
          <p className="font-body-md text-on-surface-variant mt-2">
            Anda belum memiliki penugasan verifikasi. Penugasan baru akan ditampilkan di sini.
          </p>
        </div>
      </EmployeeLayout>
    );
  }

  // Stable partition — keeps the order returned by the API inside each group.
  const pendingAssignments = assignments.filter((assignment) => assignment.status !== 'COMPLETED');
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'COMPLETED');

  return (
    <EmployeeLayout pageTitle="Penugasan Saya">

      {breadcrumb}

      {header}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Penugasan" value={assignments.length} icon="assignment" tone="text-secondary" />
        <StatCard
          label="Menunggu Verifikasi"
          value={pendingAssignments.length}
          icon="schedule"
          tone="text-warning"
        />
        <StatCard
          label="Selesai"
          value={completedAssignments.length}
          icon="check_circle"
          tone="text-success"
        />
      </div>

      {/* Pending group */}
      {pendingAssignments.length > 0 && (
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-6">
          <SectionHeader
            title="Menunggu Verifikasi"
            count={pendingAssignments.length}
            icon="schedule"
            tone="text-warning"
          />
          <ul>
            {pendingAssignments.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </ul>
        </div>
      )}

      {/* Completed group */}
      {completedAssignments.length > 0 && (
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <SectionHeader
            title="Selesai Diverifikasi"
            count={completedAssignments.length}
            icon="check_circle"
            tone="text-success"
          />
          <ul>
            {completedAssignments.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </ul>
        </div>
      )}
    </EmployeeLayout>
  );
}
