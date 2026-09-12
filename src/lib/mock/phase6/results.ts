/**
 * Phase 6 Mock Data - Results
 * Realistic operational data for matching results and result details
 */

import type { 
  MatchingResult, 
  ResultDetail, 
  FieldScore,
  CandidateRecord
} from '@/types/phase6';

// ============================================================================
// Matching Results - Internally Consistent
// ============================================================================

// 4 results: totals must match assigned/completed/match/nonMatch/unsure counts

export const mockMatchingResults: MatchingResult[] = [
  {
    id: 'RES-2026-001',
    processId: 'PR-2026-001',
    datasetA: 'Sensus_Ekonomi_2024',
    datasetB: 'Dukcapil_Malang_2024',
    threshold: 0.7,
    totalCandidates: 1250,
    assignedCount: 1250,
    completedCount: 1250,
    matchCount: 875,
    nonMatchCount: 350,
    unsureCount: 25,
    matchRate: 70.0,
    createdAt: '2026-09-01T14:30:00Z',
    completedAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'RES-2026-002',
    processId: 'PR-2026-002',
    datasetA: 'DTKS_Kota_Malang',
    datasetB: 'Penerima_Bansos_2024',
    threshold: 0.75,
    totalCandidates: 890,
    assignedCount: 890,
    completedCount: 890,
    matchCount: 712,
    nonMatchCount: 156,
    unsureCount: 22,
    matchRate: 80.0,
    createdAt: '2026-09-02T16:45:00Z',
    completedAt: '2026-09-11T14:30:00Z',
  },
  {
    id: 'RES-2026-003',
    processId: 'PR-2026-005',
    datasetA: 'UMKM_Diskop_Malang',
    datasetB: 'Pajak_Bapenda_2024',
    threshold: 0.65,
    totalCandidates: 456,
    assignedCount: 456,
    completedCount: 456,
    matchCount: 319,
    nonMatchCount: 125,
    unsureCount: 12,
    matchRate: 70.0,
    createdAt: '2026-09-05T11:20:00Z',
    completedAt: '2026-09-12T09:15:00Z',
  },
  {
    id: 'RES-2026-004',
    processId: 'PR-2026-003',
    datasetA: 'UMKM_Diskop_Malang',
    datasetB: 'Pajak_Bapenda_2024',
    threshold: 0.7,
    totalCandidates: 320,
    assignedCount: 180,
    completedCount: 120,
    matchCount: 78,
    nonMatchCount: 38,
    unsureCount: 4,
    matchRate: 65.0,
    createdAt: '2026-09-11T15:00:00Z',
  },
];

// ============================================================================
// Result Details - Sample assignment-level details
// ============================================================================

const createRecordA = (id: number): CandidateRecord => ({
  idsbr: "SE2024-" + String(id).padStart(5, '0'),
  namaUsaha: "Usaha Mikro " + id,
  alamatUsaha: "Jl. Raya Malang No. " + id,
  nmprov: 'JAWA TIMUR',
  nmkab: 'KOTA MALANG',
});

const createRecordB = (id: number): CandidateRecord => ({
  idsbr: "DKCAPIL-" + String(id).padStart(5, '0'),
  namaUsaha: "Usaha Mikro " + id,
  alamatUsaha: "Jl. Sudirman No. " + id,
  nmprov: 'JAWA TIMUR',
  nmkab: 'KOTA MALANG',
});

const fieldScores1: FieldScore[] = [
  { columnA: 'namaUsaha', columnB: 'namaUsaha', score: 0.95 },
  { columnA: 'alamatUsaha', columnB: 'alamat', score: 0.82 },
  { columnA: 'kdpos', columnB: 'kodePos', score: 0.88 },
];

const fieldScores2: FieldScore[] = [
  { columnA: 'namaUsaha', columnB: 'namaUsaha', score: 0.75 },
  { columnA: 'alamatUsaha', columnB: 'alamat', score: 0.68 },
  { columnA: 'kdpos', columnB: 'kodePos', score: 0.72 },
];

const fieldScores3: FieldScore[] = [
  { columnA: 'namaUsaha', columnB: 'namaUsaha', score: 0.90 },
  { columnA: 'alamatUsaha', columnB: 'alamat', score: 0.80 },
  { columnA: 'kdpos', columnB: 'kodePos', score: 0.85 },
];

const fieldScores4: FieldScore[] = [
  { columnA: 'namaUsaha', columnB: 'namaUsaha', score: 0.98 },
  { columnA: 'alamatUsaha', columnB: 'alamat', score: 0.85 },
  { columnA: 'kdpos', columnB: 'kodePos', score: 0.90 },
];

const fieldScores5: FieldScore[] = [
  { columnA: 'namaUsaha', columnB: 'namaUsaha', score: 0.65 },
  { columnA: 'alamatUsaha', columnB: 'alamat', score: 0.70 },
  { columnA: 'kdpos', columnB: 'kodePos', score: 0.68 },
];

export const mockResultDetails: ResultDetail[] = [
  {
    assignmentId: 1001,
    recordAId: 5001,
    recordBId: 6001,
    idsbrA: 'SE2024-00001',
    idsbrB: 'DKCAPIL-00001',
    overallScore: 0.88,
    fieldScores: fieldScores1,
    status: 'COMPLETED',
    verificationResult: 'MATCH',
    verifiedAt: '2026-09-12T09:15:00Z',
    verifiedBy: 1,
    employeeName: 'Budi Santoso',
    recordA: createRecordA(1),
    recordB: createRecordB(1),
  },
  {
    assignmentId: 1002,
    recordAId: 5002,
    recordBId: 6002,
    idsbrA: 'SE2024-00002',
    idsbrB: 'DKCAPIL-00002',
    overallScore: 0.72,
    fieldScores: fieldScores2,
    status: 'COMPLETED',
    verificationResult: 'NON_MATCH',
    verifiedAt: '2026-09-12T09:30:00Z',
    verifiedBy: 2,
    employeeName: 'Siti Rahayu',
    recordA: createRecordA(2),
    recordB: createRecordB(2),
  },
  {
    assignmentId: 1003,
    recordAId: 5003,
    recordBId: 6003,
    idsbrA: 'SE2024-00003',
    idsbrB: 'DKCAPIL-00003',
    overallScore: 0.85,
    fieldScores: fieldScores3,
    status: 'COMPLETED',
    verificationResult: 'MATCH',
    verifiedAt: '2026-09-12T10:00:00Z',
    verifiedBy: 1,
    employeeName: 'Budi Santoso',
    recordA: createRecordA(3),
    recordB: createRecordB(3),
  },
  {
    assignmentId: 1004,
    recordAId: 5004,
    recordBId: 6004,
    idsbrA: 'SE2024-00004',
    idsbrB: 'DKCAPIL-00004',
    overallScore: 0.91,
    fieldScores: fieldScores4,
    status: 'IN_PROGRESS',
    employeeName: 'Ahmad Wijaya',
    recordA: createRecordA(4),
    recordB: createRecordB(4),
  },
  {
    assignmentId: 1005,
    recordAId: 5005,
    recordBId: 6005,
    idsbrA: 'SE2024-00005',
    idsbrB: 'DKCAPIL-00005',
    overallScore: 0.68,
    fieldScores: fieldScores5,
    status: 'PENDING',
    employeeName: 'Dewi Lestari',
    recordA: createRecordA(5),
    recordB: createRecordB(5),
  },
];

export const mockResultStatistics = {
  totalResults: mockMatchingResults.length,
  totalMatched: mockMatchingResults.reduce((sum, r) => sum + r.matchCount, 0),
  totalNonMatched: mockMatchingResults.reduce((sum, r) => sum + r.nonMatchCount, 0),
  totalUnsure: mockMatchingResults.reduce((sum, r) => sum + r.unsureCount, 0),
  overallMatchRate: Math.round(
    (mockMatchingResults.reduce((sum, r) => sum + r.matchCount, 0) /
      mockMatchingResults.reduce((sum, r) => sum + r.completedCount, 0)) *
      100
  ),
  verifiedCount: mockResultDetails.filter(d => d.status === 'COMPLETED').length,
  pendingCount: mockResultDetails.filter(d => d.status === 'PENDING').length,
  inProgressCount: mockResultDetails.filter(d => d.status === 'IN_PROGRESS').length,
};