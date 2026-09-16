'use client';

import { useEffect, useState } from 'react';
import { thresholdToPercent } from '@/lib/services/matching/threshold';
import { formatPercent, scoreBadgeClass } from '@/components/assignments/score';
import { CandidateDetailDialog } from '@/components/assignments/CandidateDetailDialog';
import type { MatchingCandidateRow } from '@/lib/services/matching-results';

interface MatchingResultsProps {
  matchingRunId: number;
  results: {
    datasetA: { id: number; name: string };
    datasetB: { id: number; name: string };
    config: { columnMappings: Array<{ columnA: string; columnB: string }>; threshold: number };
    summary: { totalCandidates: number };
  };
}

interface PageResponse {
  success: boolean;
  data?: {
    datasetA: { id: number; name: string };
    datasetB: { id: number; name: string };
    threshold: number;
    rows: MatchingCandidateRow[];
    summary: { totalCandidates: number };
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
  error?: string;
}

const PAGE_OPTIONS = [10, 20, 50, 100];

export function MatchingResults({ matchingRunId, results }: MatchingResultsProps) {
  const [rows, setRows] = useState<MatchingCandidateRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(results.summary.totalCandidates);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(total / limit)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<MatchingCandidateRow | null>(null);
  const [datasetNames, setDatasetNames] = useState<{ a: string; b: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/matching/${matchingRunId}/results?page=${page}&limit=${limit}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload: PageResponse = await response.json();
        if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error || 'Gagal memuat hasil matching');
        if (cancelled) return;
        setRows(payload.data.rows);
        setDatasetNames({ a: payload.data.datasetA.name, b: payload.data.datasetB.name });
        setTotal(payload.data.pagination.total);
        setTotalPages(payload.data.pagination.totalPages);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat hasil matching');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [matchingRunId, page, limit]);

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-outline-variant rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-sm text-on-surface-variant">Dataset Pertama</p><p className="font-semibold text-on-surface mt-1">{datasetNames?.a ?? `Dataset #${results.datasetA.id}`}</p></div>
          <div><p className="text-sm text-on-surface-variant">Dataset Kedua</p><p className="font-semibold text-on-surface mt-1">{datasetNames?.b ?? `Dataset #${results.datasetB.id}`}</p></div>
          <div><p className="text-sm text-on-surface-variant">Threshold</p><p className="font-semibold text-on-surface mt-1">{thresholdToPercent(results.config.threshold)}%</p></div>
          <div><p className="text-sm text-on-surface-variant">Pasangan Cocok</p><p className="font-semibold text-primary text-lg mt-1">{total.toLocaleString('id-ID')}</p></div>
        </div>
      </div>

      {error && <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error">{error}</div>}
      {loading ? (
        <div className="p-10 text-center text-on-surface-variant"><span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span><p className="mt-2">Memuat halaman hasil...</p></div>
      ) : total === 0 ? (
          <div className="bg-surface border border-outline-variant rounded-xl shadow-sm p-8 text-center">Tidak ada pasangan yang memenuhi threshold.</div>
      ) : (
        <>
          <div className="border border-outline-variant rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead><tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="px-4 py-3 text-left text-sm font-semibold">No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Dataset A</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Dataset B</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Final Score</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Detail</th>
                </tr></thead>
                <tbody>
                  {rows.map((candidate, idx) => (
                    <tr key={`${candidate.recordAId}-${candidate.recordBId}`} className="border-b border-outline-variant hover:bg-surface-container-low">
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3"><div className="font-mono text-sm font-semibold">{candidate.idsbrA}</div><div className="text-xs text-on-surface-variant truncate max-w-[260px]">{candidate.recordA?.namaUsaha ?? '-'}</div></td>
                      <td className="px-4 py-3"><div className="font-mono text-sm font-semibold">{candidate.idsbrB}</div><div className="text-xs text-on-surface-variant truncate max-w-[260px]">{candidate.recordB?.namaUsaha ?? '-'}</div></td>
                      <td className="px-4 py-3 text-center"><span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${scoreBadgeClass(candidate.overallScore)}`}>{formatPercent(candidate.overallScore)}</span></td>
                      <td className="px-4 py-3 text-center"><button onClick={() => setDetailTarget(candidate)} className="px-3 py-1 rounded-lg border border-outline text-primary hover:bg-surface-container-low">Detail</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-outline-variant">
              <div className="text-sm text-on-surface-variant">Menampilkan {start.toLocaleString('id-ID')}-{end.toLocaleString('id-ID')} dari {total.toLocaleString('id-ID')} kandidat</div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <label className="text-sm text-on-surface-variant">Per halaman</label>
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="border border-outline rounded-lg px-2 py-1 bg-surface">
                  {PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border border-outline rounded-lg disabled:opacity-40">‹</button>
                {pages[0] > 1 && <><button onClick={() => setPage(1)} className="px-3 py-1 border border-outline rounded-lg">1</button>{pages[0] > 2 && <span>…</span>}</>}
                {pages.map((p) => <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded-lg border ${p === page ? 'bg-primary text-on-primary border-primary' : 'border-outline'}`}>{p}</button>)}
                {pages[pages.length - 1] < totalPages && <>{pages[pages.length - 1] < totalPages - 1 && <span>…</span>}<button onClick={() => setPage(totalPages)} className="px-3 py-1 border border-outline rounded-lg">{totalPages}</button></>}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-2 py-1 border border-outline rounded-lg disabled:opacity-40">›</button>
              </div>
            </div>
          </div>
        </>
      )}

      {detailTarget && <CandidateDetailDialog candidate={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}
