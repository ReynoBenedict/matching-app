'use client';

import { useEffect, useState } from 'react';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { AssignCandidateDialog } from './AssignCandidateDialog';
import { CandidateDetailDialog } from './CandidateDetailDialog';
import { formatPercent, scoreBadgeClass } from './score';
import type { AssignmentCandidate, DatasetOption, Employee } from './types';

const THRESHOLD_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9];

/**
 * Fetch matching candidates for a dataset pair.
 * Maps every column shared by both datasets — no hardcoded column list.
 * Pure: performs no state updates, so it is safe to await from an effect.
 */
async function fetchCandidates(
  datasetAId: number,
  datasetBId: number,
  threshold: number
): Promise<{ candidates: AssignmentCandidate[]; error?: string }> {
  if (datasetAId === datasetBId) {
    return { candidates: [], error: 'Dataset pertama dan dataset kedua harus berbeda.' };
  }

  const fetchColumnNames = async (datasetId: number): Promise<string[]> => {
    const response = await fetch(`/api/datasets/${datasetId}/columns`);
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || `Gagal memuat kolom dataset ${datasetId}`);
    }
    return (data.data || []).map((column: { columnName: string }) => column.columnName);
  };

  const [columnsA, columnsB] = await Promise.all([
    fetchColumnNames(datasetAId),
    fetchColumnNames(datasetBId),
  ]);

  const columnMappings = columnsA
    .filter((column) => columnsB.includes(column))
    .map((column) => ({ columnA: column, columnB: column }));

  if (columnMappings.length === 0) {
    return { candidates: [], error: 'Kedua dataset tidak memiliki kolom yang sama untuk dipetakan.' };
  }

  const params = new URLSearchParams({
    datasetAId: String(datasetAId),
    datasetBId: String(datasetBId),
    columnMappings: JSON.stringify(columnMappings),
    threshold: String(threshold),
    page: '1',
    limit: '100',
  });

  const response = await fetch(`/api/assignments/candidates?${params}`);
  const data = await response.json();

  if (!response.ok || !data.success) {
    return { candidates: [], error: data.error || 'Gagal memuat kandidat pencocokan' };
  }

  return { candidates: data.data || [] };
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: string; tone: string }) {
  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex items-center justify-between">
      <div>
        <p className="font-label-md text-label-md text-on-surface-variant uppercase mb-xs">{label}</p>
        <p className="font-headline-md text-headline-md text-on-surface">{value}</p>
      </div>
      <span className={`material-symbols-outlined ${tone}`} style={{ fontSize: '28px' }}>
        {icon}
      </span>
    </div>
  );
}

function StatusBadge({ assigned }: { assigned: boolean }) {
  if (assigned) {
    return (
      <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant px-sm py-[2px] rounded-full text-[11px] font-bold whitespace-nowrap">
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
          check_circle
        </span>
        Sudah Ditugaskan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-secondary-fixed text-on-secondary-fixed px-sm py-[2px] rounded-full text-[11px] font-bold whitespace-nowrap">
      <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
      Belum Ditugaskan
    </span>
  );
}

export function AssignmentContent() {
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetAId, setDatasetAId] = useState<number | null>(null);
  const [datasetBId, setDatasetBId] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(0.7);
  const [refreshToken, setRefreshToken] = useState(0);

  const [candidates, setCandidates] = useState<AssignmentCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);

  const [assignTarget, setAssignTarget] = useState<AssignmentCandidate | null>(null);
  const [detailTarget, setDetailTarget] = useState<AssignmentCandidate | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Load the READY datasets — the same source used by /datasets and /matching.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/datasets?status=READY&limit=100');
        const data = await response.json();
        if (cancelled) return;

        if (!response.ok || !data.success) {
          setError(data.error || 'Gagal memuat dataset');
          setLoading(false);
          return;
        }

        const list: DatasetOption[] = data.data || [];
        setDatasets(list);

        if (list.length >= 2) {
          setDatasetAId(list[0].id);
          setDatasetBId(list[1].id);
          setLoading(true);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat dataset');
        setLoading(false);
      } finally {
        if (!cancelled) setDatasetsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load candidates whenever the dataset pair, threshold, or refresh token changes.
  useEffect(() => {
    let cancelled = false;

    if (!datasetAId || !datasetBId) return;

    (async () => {
      try {
        const result = await fetchCandidates(datasetAId, datasetBId, threshold);
        if (cancelled) return;

        setCandidates(result.candidates);
        setError(result.error ?? null);
      } catch (err) {
        if (cancelled) return;
        setCandidates([]);
        setError(err instanceof Error ? err.message : 'Gagal memuat kandidat pencocokan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [datasetAId, datasetBId, threshold, refreshToken]);

  const loadEmployees = async () => {
    if (employees.length > 0 || employeesLoading) return;

    setEmployeesLoading(true);
    setEmployeesError(null);

    try {
      const response = await fetch('/api/superadmin/users');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat daftar pegawai');
      }
      setEmployees((data.data || []).filter((user: Employee) => user.role === 'EMPLOYEE'));
    } catch (err) {
      setEmployeesError(err instanceof Error ? err.message : 'Gagal memuat daftar pegawai');
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleOpenAssign = (candidate: AssignmentCandidate) => {
    setAssignTarget(candidate);
    setAssignError(null);
    loadEmployees();
  };

  const handleCloseAssign = () => {
    if (assigning) return;
    setAssignTarget(null);
    setAssignError(null);
  };

  const handleConfirmAssign = async (employeeId: number) => {
    if (!assignTarget) return;

    const target = assignTarget;
    setAssigning(true);
    setAssignError(null);

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordAId: target.recordAId,
          recordBId: target.recordBId,
          employeeId,
          similarityScore: target.overallScore,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAssignError(data.error || 'Gagal membuat penugasan');
        setAssigning(false);
        return;
      }

      const employee = employees.find((item) => item.id === employeeId);
      setAssigning(false);
      setAssignTarget(null);
      setNotice(
        `Penugasan #${data.assignmentId} untuk ${target.idsbrA} ↔ ${target.idsbrB} berhasil dikirim ke ${
          employee?.fullName ?? 'pegawai'
        }.`
      );

      // Re-run the candidates effect so the row reflects its new status.
      setLoading(true);
      setRefreshToken((token) => token + 1);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Gagal membuat penugasan');
      setAssigning(false);
    }
  };

  const assignedCount = candidates.filter((candidate) => candidate.assigned).length;
  const availableCount = candidates.length - assignedCount;

  return (
    <SuperadminLayout pageTitle="Manajemen Penugasan">
      {/* Breadcrumb */}
      <div className="mb-2">
        <span className="text-on-surface-variant text-label-md text-xs">
          Sistem Pencocokan Data /{' '}
          <span className="text-primary font-semibold">Manajemen Penugasan</span>
        </span>
      </div>

      {/* Page header */}
      <div className="mb-lg">
        <h2 className="font-headline-lg text-headline-lg text-primary mb-xs">Manajemen Penugasan</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Tinjau kandidat hasil pencocokan, lalu tugaskan satu pasangan record kepada pegawai untuk diverifikasi.
        </p>
      </div>

      {/* Success notice */}
      {notice && (
        <div className="bg-primary-fixed text-on-surface p-md rounded-xl border border-outline-variant mb-lg flex items-start gap-sm">
          <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '20px' }}>
            check_circle
          </span>
          <p className="text-body-sm">{notice}</p>
        </div>
      )}

      {/* Matching source */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-lg mb-lg">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '20px' }}>
            filter_alt
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Sumber Pencocokan</h3>
        </div>

        {datasetsLoading ? (
          <div className="flex items-center gap-sm text-on-surface-variant text-body-sm">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            Memuat dataset...
          </div>
        ) : datasets.length < 2 ? (
          <div className="bg-surface-container-low text-on-surface-variant p-md rounded-lg border border-outline-variant text-body-sm flex items-start gap-sm">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px' }}>
              info
            </span>
            Diperlukan minimal 2 dataset berstatus READY untuk menampilkan kandidat pencocokan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label htmlFor="dataset-a" className="block font-label-md text-label-md text-on-surface-variant uppercase mb-xs">
                Dataset Pertama
              </label>
              <select
                id="dataset-a"
                value={datasetAId ?? ''}
                onChange={(event) => {
                  setLoading(true);
                  setNotice(null);
                  setError(null);
                  setDatasetAId(Number(event.target.value));
                }}
                className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.totalRecords ?? 0} record)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dataset-b" className="block font-label-md text-label-md text-on-surface-variant uppercase mb-xs">
                Dataset Kedua
              </label>
              <select
                id="dataset-b"
                value={datasetBId ?? ''}
                onChange={(event) => {
                  setLoading(true);
                  setNotice(null);
                  setError(null);
                  setDatasetBId(Number(event.target.value));
                }}
                className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container"
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name} ({dataset.totalRecords ?? 0} record)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="threshold" className="block font-label-md text-label-md text-on-surface-variant uppercase mb-xs">
                Threshold
              </label>
              <select
                id="threshold"
                value={threshold}
                onChange={(event) => {
                  setLoading(true);
                  setNotice(null);
                  setThreshold(Number(event.target.value));
                }}
                className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container"
              >
                {THRESHOLD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {Math.round(option * 100)}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error-container border border-error rounded-xl p-lg mb-lg flex items-start gap-sm">
          <span className="material-symbols-outlined text-on-error-container flex-shrink-0" style={{ fontSize: '20px' }}>
            error
          </span>
          <p className="font-body-md text-on-error-container">{error}</p>
        </div>
      )}

      {/* Stats */}
      {!datasetsLoading && datasets.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
          <StatCard label="Total Kandidat" value={candidates.length} icon="fact_check" tone="text-secondary" />
          <StatCard label="Belum Ditugaskan" value={availableCount} icon="pending_actions" tone="text-primary" />
          <StatCard label="Sudah Ditugaskan" value={assignedCount} icon="check_circle" tone="text-on-surface-variant" />
        </div>
      )}

      {/* Candidate table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-bright">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Kandidat Pencocokan</h3>
        </div>

        {loading ? (
          <div className="p-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] inline-block animate-spin">
              hourglass_empty
            </span>
            <p className="font-body-md mt-sm">Memuat kandidat...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] opacity-30">search_off</span>
            <p className="font-body-md mt-sm">Tidak ada kandidat pencocokan untuk konfigurasi ini.</p>
            <p className="font-body-sm text-body-sm mt-xs">
              Jalankan pencocokan terlebih dahulu atau turunkan nilai threshold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-surface-container-highest border-b border-outline-variant">
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface w-16">No.</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface">ID Record A</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface">ID Record B</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface">Skor Kesamaan</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface">Status</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr
                    key={`${candidate.recordAId}-${candidate.recordBId}`}
                    className="border-b border-outline-variant last:border-b-0 hover:bg-surface-container-highest/40 transition-colors"
                  >
                    <td className="px-md py-sm font-data-tabular text-on-surface-variant">{index + 1}</td>
                    <td className="px-md py-sm">
                      <p className="font-data-tabular text-on-surface font-semibold">{candidate.idsbrA}</p>
                      {candidate.recordA?.namaUsaha && (
                        <p className="text-body-sm text-on-surface-variant">{candidate.recordA.namaUsaha}</p>
                      )}
                    </td>
                    <td className="px-md py-sm">
                      <p className="font-data-tabular text-on-surface font-semibold">{candidate.idsbrB}</p>
                      {candidate.recordB?.namaUsaha && (
                        <p className="text-body-sm text-on-surface-variant">{candidate.recordB.namaUsaha}</p>
                      )}
                    </td>
                    <td className="px-md py-sm">
                      <span
                        className={`inline-block px-sm py-[2px] rounded-full text-label-md ${scoreBadgeClass(
                          candidate.overallScore
                        )}`}
                      >
                        {formatPercent(candidate.overallScore)}
                      </span>
                    </td>
                    <td className="px-md py-sm">
                      <StatusBadge assigned={candidate.assigned} />
                      {candidate.assigned && candidate.assignedEmployee?.fullName && (
                        <p className="text-body-sm text-on-surface-variant mt-xs">
                          {candidate.assignedEmployee.fullName}
                        </p>
                      )}
                    </td>
                    <td className="px-md py-sm text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-sm">
                        <button
                          onClick={() => setDetailTarget(candidate)}
                          className="px-md py-xs rounded-lg border border-outline-variant text-primary font-label-md hover:bg-surface-container-low transition-colors"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => handleOpenAssign(candidate)}
                          disabled={candidate.assigned}
                          title={
                            candidate.assigned
                              ? 'Kandidat ini sudah ditugaskan'
                              : 'Tugaskan kandidat ini ke pegawai'
                          }
                          className="px-md py-xs rounded-lg bg-primary text-on-primary font-label-md hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Tugaskan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign dialog */}
      {assignTarget && (
        <AssignCandidateDialog
          candidate={assignTarget}
          employees={employees}
          employeesLoading={employeesLoading}
          employeesError={employeesError}
          submitting={assigning}
          error={assignError}
          onConfirm={handleConfirmAssign}
          onClose={handleCloseAssign}
        />
      )}

      {/* Detail dialog — full field scores live here only */}
      {detailTarget && (
        <CandidateDetailDialog candidate={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </SuperadminLayout>
  );
}
