/**
 * Shared types for the superadmin assignment workflow
 */

export interface FieldScore {
  columnA: string;
  columnB: string;
  score: number;
}

export interface CandidateRecord {
  id?: number;
  datasetId?: number;
  datasetName?: string | null;
  idsbr: string;
  namaUsaha: string | null;
  alamatUsaha: string | null;
  nmprov: string | null;
  nmkab: string | null;
  nmkec?: string | null;
  nmdesa?: string | null;
  rawData?: Record<string, unknown>;
}

export interface AssignmentCandidate {
  matchingRunId: number;
  recordAId: number;
  recordBId: number;
  idsbrA: string;
  idsbrB: string;
  fieldScores: FieldScore[];
  overallScore: number;
  tfidfSimilarity?: number | null;
  faissSimilarity?: number | null;
  rapidfuzzSimilarity?: number | null;
  recordA: CandidateRecord | null;
  recordB: CandidateRecord | null;
  assigned: boolean;
  assignmentId: number | null;
  assignmentStatus: string | null;
  assignedEmployee: { id: number; fullName: string | null } | null;
}

export interface Employee {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  status: string;
}

export interface DatasetOption {
  id: number;
  name: string;
  datasetType: string;
  totalRecords: number | null;
  columnCount: number | null;
}
