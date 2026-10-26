'use client';

import { useEffect, useState } from 'react';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { AssignCandidateDialog } from './AssignCandidateDialog';
import { CandidateDetailDialog } from './CandidateDetailDialog';
import { formatPercent, scoreBadgeClass } from './score';
import { fetchSavedRuns, type SavedRun } from './saved-runs';
import type { AssignmentCandidate, DatasetOption, Employee } from './types';

const THRESHOLD_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9];

/** Run tersimpan untuk pasangan dataset (urutan A/B bebas): threshold unik + urutan run terbaru. */
async function fetchRunThresholds(
  datasetAId: number,
  datasetBId: number
): Promise<{ thresholds: number[]; swapped: boolean }> {
  const params = new URLSearchParams({ datasetAId: String(datasetAId), datasetBId: String(datasetBId), anyOrder: '1', limit: '200' });
  const response = await fetch(`/api/matching/runs?${params}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload.success) return { thresholds: [], swapped: false };
  const runs = (payload.data as Array<{ threshold: number; status: string; datasetA: { id: number } }>).filter((r) => r.status === 'COMPLETED');
  if (runs.length === 0) return { thresholds: [], swapped: false };
  // Ikuti urutan A/B pada run terbaru agar pencarian kandidat menemukan run tersebut.
  const swapped = runs[0].datasetA.id !== datasetAId;
  const seen = new Set<number>();
  const thresholds: number[] = [];
  for (const run of runs) {
    if (run.datasetA.id !== runs[0].datasetA.id) continue;
    const t = Math.round(Number(run.threshold) * 10000) / 10000;
    if (!seen.has(t)) { seen.add(t); thresholds.push(t); }
  }
  return { thresholds, swapped };
}

interface AdminAssignment {
  id: number;
  matchingRunId: number | null;
  datasetA: { id: number; name: string } | null;
  datasetB: { id: number; name: string } | null;
  employee: { id: number; fullName: string } | null;
  assignedAt: string;
  status: string;
  verificationResult: string | null;
}


const PAGE_SIZE = 50;

interface CandidateTotals {
  totalCandidates: number;
  assigned: number;
  unassigned: number;
}

interface CandidatePage {
  candidates: AssignmentCandidate[];
  totals: CandidateTotals | null;
  totalPages: number;
  error?: string;
  /** Pasangan dataset + threshold ini belum pernah dijalankan (bukan kegagalan sistem). */
  notFound?: boolean;
}

/** Ambil satu halaman kandidat dari proses pencocokan tersimpan untuk sepasang dataset. */
async function fetchCandidates(
  datasetAId: number,
  datasetBId: number,
  threshold: number,
  page: number
): Promise<CandidatePage> {
  if (datasetAId === datasetBId) {
    return { candidates: [], totals: null, totalPages: 1, error: 'Dataset pertama dan dataset kedua harus berbeda.' };
  }

  const params = new URLSearchParams({
    datasetAId: String(datasetAId),
    datasetBId: String(datasetBId),
    threshold: String(threshold),
    page: String(page),
    limit: String(PAGE_SIZE),
  });

  const response = await fetch(`/api/assignments/candidates?${params}`, { cache: 'no-store' });
  const data = await response.json();

  if (!response.ok || !data.success) {
    return {
      candidates: [],
      totals: null,
      totalPages: 1,
      error: data.error || 'Gagal memuat kandidat pencocokan',
      notFound: response.status === 404,
    };
  }

  return {
    candidates: data.data || [],
    totals: data.summary ?? null,
    totalPages: data.pagination?.totalPages ?? 1,
  };
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
  // Threshold yang pernah dipakai pada run tersimpan untuk pasangan terpilih.
  const [runThresholds, setRunThresholds] = useState<number[]>([]);
  useEffect(() => {
    if (!datasetAId || !datasetBId) return;
    let cancelled = false;
    fetchRunThresholds(datasetAId, datasetBId)
      .then((list) => {
        if (cancelled) return;
        if (list.swapped) { setDatasetAId(datasetBId); setDatasetBId(datasetAId); return; }
        setRunThresholds(list.thresholds);
        if (list.thresholds.length > 0 && !list.thresholds.includes(threshold)) setThreshold(list.thresholds[0]);
      })
      .catch(() => { if (!cancelled) setRunThresholds([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetAId, datasetBId]);

  const [candidates, setCandidates] = useState<AssignmentCandidate[]>([]);
  const [totals, setTotals] = useState<CandidateTotals | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [noRun, setNoRun] = useState(false);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
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
  const [adminAssignments, setAdminAssignments] = useState<AdminAssignment[]>([]);

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

        try {
          const assignmentResponse = await fetch('/api/assignments', { cache: 'no-store' });
          const assignmentPayload = await assignmentResponse.json();
          if (assignmentResponse.ok && assignmentPayload.success) setAdminAssignments(assignmentPayload.data || []);
        } catch (assignmentError) {
          console.warn('Gagal memuat daftar penugasan admin', assignmentError);
        }

        const runs = await fetchSavedRuns().catch(() => [] as SavedRun[]);
        if (cancelled) return;
        setSavedRuns(runs);

        if (list.length >= 2) {
          // Buka langsung proses tersimpan terbaru agar kandidat langsung tampil.
          const ids = new Set(list.map((dataset) => dataset.id));
          const latest = runs.find((run) => ids.has(run.datasetA.id) && ids.has(run.datasetB.id));
          if (latest) setThreshold(latest.threshold);
          setDatasetAId(latest?.datasetA.id ?? list[0].id);
          setDatasetBId(latest?.datasetB.id ?? list[1].id);
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
        const result = await fetchCandidates(datasetAId, datasetBId, threshold, page);
        if (cancelled) return;

        setCandidates(result.candidates);
        setTotals(result.totals);
        setTotalPages(result.totalPages);
        setNoRun(Boolean(result.notFound));
        setError(result.notFound ? null : result.error ?? null);
      } catch (err) {
        if (cancelled) return;
        setCandidates([]);
        setTotals(null);
        setError(err instanceof Error ? err.message : 'Gagal memuat kandidat pencocokan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [datasetAId, datasetBId, threshold, page, refreshToken]);

  const handleSelectSavedRun = (run: SavedRun) => {
    setLoading(true);
    setNotice(null);
    setError(null);
    setPage(1);
    setThreshold(run.threshold);
    setDatasetAId(run.datasetA.id);
    setDatasetBId(run.datasetB.id);
  };

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
          matchingRunId: target.matchingRunId,
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
      try {
        const assignmentResponse = await fetch('/api/assignments', { cache: 'no-store' });
        const assignmentPayload = await assignmentResponse.json();
        if (assignmentResponse.ok && assignmentPayload.success) setAdminAssignments(assignmentPayload.data || []);
      } catch {}
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Gagal membuat penugasan');
      setAssigning(false);
    }
  };

  // Statistik dari seluruh kandidat pada run (bukan hanya halaman yang sedang tampil).
  const totalCount = totals?.totalCandidates ?? 0;
  const assignedCount = totals?.assigned ?? 0;
  const availableCount = totals?.unassigned ?? 0;

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
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-xs">Manajemen Penugasan</h2>
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
                  setPage(1);
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
                  setPage(1);
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
                  setPage(1);
                  setThreshold(Number(event.target.value));
                }}
                className="w-full px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container"
              >
                {(runThresholds.length > 0 ? runThresholds : THRESHOLD_OPTIONS).map((option) => (
                  <option key={option} value={option}>
                    {Math.round(option * 100)}%
                  </option>
                ))}
              </select>
              <p className="font-label-md text-label-md text-on-surface-variant mt-xs">
                {runThresholds.length > 0
                  ? `${runThresholds.length} threshold dari proses tersimpan untuk pasangan ini`
                  : 'Belum ada proses tersimpan untuk pasangan ini'}
              </p>
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

      {/* Pasangan belum pernah diproses */}
      {!loading && noRun && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg mb-lg space-y-md">
          <div className="flex items-start gap-sm">
            <span className="material-symbols-outlined text-secondary flex-shrink-0" style={{ fontSize: '20px' }}>
              info
            </span>
            <div>
              <p className="font-body-md text-on-surface font-semibold">
                Belum ada proses pencocokan untuk pasangan dan threshold ini.
              </p>
              <p className="text-body-sm text-on-surface-variant mt-xs">
                Pilih salah satu proses tersimpan di bawah, atau jalankan pencocokan baru di menu Pencocokan Data.
              </p>
            </div>
          </div>
          {savedRuns.length > 0 && (
            <div className="flex flex-wrap gap-sm">
              {savedRuns.slice(0, 6).map((run) => (
                <button
                  key={run.id}
                  onClick={() => handleSelectSavedRun(run)}
                  className="px-md py-xs rounded-lg border border-outline-variant bg-surface text-primary font-label-md hover:bg-surface-container transition-colors"
                >
                  {run.datasetA.name} ↔ {run.datasetB.name} · {Math.round(run.threshold * 100)}%
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {!datasetsLoading && datasets.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-lg">
          <StatCard label="Total Kandidat" value={totalCount} icon="fact_check" tone="text-secondary" />
          <StatCard label="Belum Ditugaskan" value={availableCount} icon="pending_actions" tone="text-primary" />
          <StatCard label="Sudah Ditugaskan" value={assignedCount} icon="check_circle" tone="text-on-surface-variant" />
        </div>
      )}

      {/* Assigned task log */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-bright flex items-center justify-between">
          <div><h3 className="font-headline-sm text-headline-sm text-on-surface">Daftar Penugasan</h3><p className="text-sm text-on-surface-variant mt-1">Task yang sudah diberikan kepada petugas.</p></div>
          <span className="text-sm text-on-surface-variant">{adminAssignments.length} task</span>
        </div>
        {adminAssignments.length === 0 ? <div className="p-lg text-sm text-on-surface-variant">Belum ada penugasan.</div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="bg-surface-container-highest border-b border-outline-variant"><th className="px-md py-sm text-xs font-semibold">ID Penugasan</th><th className="px-md py-sm text-xs font-semibold">Dataset A</th><th className="px-md py-sm text-xs font-semibold">Dataset B</th><th className="px-md py-sm text-xs font-semibold">Petugas</th><th className="px-md py-sm text-xs font-semibold">Tanggal Penugasan</th><th className="px-md py-sm text-xs font-semibold">Status</th><th className="px-md py-sm text-xs font-semibold">Hasil</th></tr></thead><tbody>
            {adminAssignments.map((task) => <tr key={task.id} className="border-b border-outline-variant last:border-b-0"><td className="px-md py-sm font-mono text-sm">#{task.id}</td><td className="px-md py-sm text-sm">{task.datasetA?.name ?? '-'}</td><td className="px-md py-sm text-sm">{task.datasetB?.name ?? '-'}</td><td className="px-md py-sm text-sm">{task.employee?.fullName ?? '-'}</td><td className="px-md py-sm text-sm">{new Date(task.assignedAt).toLocaleString('id-ID')}</td><td className="px-md py-sm text-sm font-semibold">{task.status === 'PENDING' ? 'Belum Dikerjakan' : task.status === 'IN_PROGRESS' ? 'Sedang Dikerjakan' : 'Selesai'}</td><td className="px-md py-sm text-sm">{task.verificationResult === 'MATCH' ? 'MATCH' : task.verificationResult === 'NON_MATCH' ? 'NON-MATCH' : task.verificationResult === 'REVIEW' ? 'Perlu Review' : '-'}</td></tr>)}
          </tbody></table></div>
        )}
      </div>

      {/* Candidate table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-bright">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Kandidat Pencocokan</h3>
        </div>

        {loading ? (
          <div className="p-xl text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] text-primary inline-block animate-spin">
              progress_activity
            </span>
            <p className="font-body-lg mt-sm">Memuat kandidat...</p>
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
                    <td className="px-md py-sm font-data-tabular text-on-surface-variant">{(page - 1) * PAGE_SIZE + index + 1}</td>
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

        {!loading && totalPages > 1 && (
          <div className="px-lg py-md border-t border-outline-variant flex flex-wrap items-center justify-between gap-sm">
            <span className="text-body-sm text-on-surface-variant">
              Halaman {page} dari {totalPages} · {totalCount.toLocaleString('id-ID')} kandidat, urut skor tertinggi
            </span>
            <div className="flex items-center gap-sm">
              <button
                onClick={() => { setLoading(true); setPage(page - 1); }}
                disabled={page <= 1}
                className="px-md py-xs rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => { setLoading(true); setPage(page + 1); }}
                disabled={page >= totalPages}
                className="px-md py-xs rounded-lg border border-outline-variant text-on-surface font-label-md hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
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
