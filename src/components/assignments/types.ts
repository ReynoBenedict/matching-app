/**
 * Shared types for the superadmin assignment workflow
 */

export interface FieldScore {
  columnA: string;
  columnB: string;
  score: number;
}

export interface CandidateRecord {
  idsbr: string;
  namaUsaha: string;
  alamatUsaha: string;
  nmprov: string;
  nmkab: string;
}

export interface AssignmentCandidate {
  recordAId: number;
  recordBId: number;
  idsbrA: string;
  idsbrB: string;
  fieldScores: FieldScore[];
  overallScore: number;
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
