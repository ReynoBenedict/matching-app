/** Proses pencocokan berstatus COMPLETED yang tersimpan, terbaru lebih dulu. */
export interface SavedRun {
  id: number;
  datasetA: { id: number; name: string };
  datasetB: { id: number; name: string };
  threshold: number;
  totalCandidates: number | null;
}

export async function fetchSavedRuns(): Promise<SavedRun[]> {
  const response = await fetch('/api/matching/runs?limit=50', { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload.success) return [];
  return (payload.data as Array<SavedRun & { status: string }>)
    .filter((run) => run.status === 'COMPLETED')
    .map((run) => ({
      id: run.id,
      datasetA: run.datasetA,
      datasetB: run.datasetB,
      threshold: Math.round(Number(run.threshold) * 10000) / 10000,
      totalCandidates: run.totalCandidates,
    }));
}
