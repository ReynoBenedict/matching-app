/**
 * Phase 6 Domain Types
 * Centralized TypeScript interfaces for Phase 6 Monitoring, Results & Reports
 */

// ============================================================================
// Monitoring Types
// ============================================================================

export type ProcessStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface MonitoringProcess {
  id: string;
  datasetA: string;
  datasetB: string;
  status: ProcessStatus;
  progress: number; // 0-100
  totalRecords: number;
  processedRecords: number;
  startTime: string; // ISO date string
  endTime?: string;
  errorMessage?: string;
  threshold: number;
  createdBy: string;
}

export interface EmployeeProgress {
  employeeId: number;
  employeeName: string;
  email: string;
  totalAssigned: number;
  completed: number;
  pending: number;
  inProgress: number;
  matchCount: number;
  nonMatchCount: number;
  completionRate: number; // 0-100
  averageTimePerTask: number; // minutes
  lastActivityAt: string;
}

export interface MonitoringSummary {
  activeProcesses: number;
  totalEmployees: number;
  totalPendingAssignments: number;
  totalCompletedToday: number;
  averageCompletionRate: number;
}

// ============================================================================
// Results Types
// ============================================================================

export type VerificationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type VerificationResult = 'MATCH' | 'NON_MATCH' | 'UNSURE';

export interface MatchingResult {
  id: string;
  processId: string;
  datasetA: string;
  datasetB: string;
  threshold: number;
  totalCandidates: number;
  assignedCount: number;
  completedCount: number;
  matchCount: number;
  nonMatchCount: number;
  unsureCount: number;
  matchRate: number; // percentage
  createdAt: string;
  completedAt?: string;
}

export interface ResultDetail {
  assignmentId: number;
  recordAId: number;
  recordBId: number;
  idsbrA: string;
  idsbrB: string;
  overallScore: number;
  fieldScores: FieldScore[];
  status: VerificationStatus;
  verificationResult?: VerificationResult;
  verifiedAt?: string;
  verifiedBy?: number;
  employeeName?: string;
  recordA?: CandidateRecord;
  recordB?: CandidateRecord;
}

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

// ============================================================================
// History Types
// ============================================================================

export type HistoryActionType = 
  | 'MATCHING_START'
  | 'MATCHING_COMPLETE'
  | 'MATCHING_FAIL'
  | 'ASSIGNMENT_CREATE'
  | 'ASSIGNMENT_COMPLETE'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'DATASET_UPLOAD'
  | 'VERIFICATION_SUBMIT';

export interface HistoryRecord {
  id: number;
  action: HistoryActionType;
  description: string;
  entityType?: string;
  entityId?: number;
  userId?: number;
  userName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// Executive Types (Kepala BPS)
// ============================================================================

export interface ExecutiveKPI {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number; // percentage change from previous period
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface MonthlyStatistic {
  month: string;
  year: number;
  totalDatasets: number;
  totalMatching: number;
  totalMatched: number;
  matchRate: number;
  totalVerified: number;
  verificationRate: number;
}

export interface ExecutiveSummary {
  kpis: ExecutiveKPI[];
  monthlyTrends: MonthlyStatistic[];
  topPerformingEmployees: EmployeeProgress[];
  recentActivity: HistoryRecord[];
}

// ============================================================================
// Report Types
// ============================================================================

export type ReportType = 
  | 'MATCHING_SUMMARY'
  | 'VERIFICATION_PROGRESS'
  | 'EMPLOYEE_PERFORMANCE'
  | 'EXECUTIVE_SUMMARY';

export type ReportFormat = 'PDF' | 'XLSX' | 'CSV';

export type ReportStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';

export interface ReportConfig {
  type: ReportType;
  dateRange: {
    start: string;
    end: string;
  };
  format: ReportFormat;
  includeDetails?: boolean;
  employeeIds?: number[];
  datasetIds?: number[];
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  config: ReportConfig;
  fileSize?: string;
  downloadUrl?: string;
  recordCount: number;
  createdAt: string;
  createdBy: number;
  expiresAt?: string;
}

export interface ReportSummary {
  totalReports: number;
  readyCount: number;
  pendingCount: number;
  totalSize: string;
}

