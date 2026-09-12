/**
 * Phase 6 Mock Data - Main Export
 * Centralized mock data for Phase 6 Monitoring, Results & Reports
 * 
 * This module provides realistic, internally consistent mock data
 * that can be easily replaced with real API calls in the future.
 */

// Export types
export type {
  MonitoringProcess,
  EmployeeProgress,
  MonitoringSummary,
  MatchingResult,
  ResultDetail,
  FieldScore,
  CandidateRecord,
  VerificationStatus,
  VerificationResult,
  HistoryRecord,
  HistoryActionType,
  ExecutiveKPI,
  MonthlyStatistic,
  ExecutiveSummary,
  ReportConfig,
  GeneratedReport,
  ReportSummary,
  ReportType,
  ReportFormat,
  ReportStatus,
  ProcessStatus,
} from '@/types/phase6';

// Export monitoring mock data
export {
  mockMonitoringProcesses,
  mockEmployeeProgress,
  mockMonitoringSummary,
} from './monitoring';

// Export results mock data
export {
  mockMatchingResults,
  mockResultDetails,
  mockResultStatistics,
} from './results';

// Export history mock data
export {
  mockHistoryRecords,
  mockHistoryStatistics,
  historyActionMeta,
} from './history';

// Export executive mock data
export {
  mockExecutiveKPIs,
  mockMonthlyStatistics,
  mockTopPerformingEmployees,
  mockRecentActivity,
  mockExecutiveSummary,
  mockMatchingActivityData,
  mockVerificationDistribution,
} from './executive';

// Export reports mock data
export {
  mockGeneratedReports,
  mockReportSummary,
  mockReportConfigs,
  reportTypeMeta,
  reportFormatMeta,
  reportStatusMeta,
} from './reports';

