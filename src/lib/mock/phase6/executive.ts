/**
 * Phase 6 Mock Data - Executive
 * Realistic operational data for Kepala BPS executive dashboard
 */

import type { ExecutiveKPI, MonthlyStatistic, ExecutiveSummary } from '@/types/phase6';
import { mockEmployeeProgress } from './monitoring';
import { mockHistoryRecords } from './history';

// ============================================================================
// Executive KPIs - Internally Consistent
// ============================================================================

// All KPIs use realistic numbers that align with other mock data
// Total matched = 875 + 712 + 319 + 78 = 1984 from results.ts
// Total employees = 5
// Average completion rate = (84.4 + 86.5 + 78.9 + 91.7 + 72.0) / 5 = 82.7%

export const mockExecutiveKPIs: ExecutiveKPI[] = [
  {
    id: 'kpi-1',
    label: 'Total Matches',
    value: 1984,
    unit: 'records',
    change: 12.5,
    trend: 'up',
    period: 'September 2026',
  },
  {
    id: 'kpi-2',
    label: 'Match Rate',
    value: 72,
    unit: '%',
    change: 3.2,
    trend: 'up',
    period: 'September 2026',
  },
  {
    id: 'kpi-3',
    label: 'Verification Rate',
    value: 89,
    unit: '%',
    change: 5.8,
    trend: 'up',
    period: 'September 2026',
  },
  {
    id: 'kpi-4',
    label: 'Active Employees',
    value: 5,
    unit: 'people',
    change: 0,
    trend: 'stable',
    period: 'September 2026',
  },
  {
    id: 'kpi-5',
    label: 'Avg. Completion Time',
    value: 12.6,
    unit: 'min/task',
    change: -8.5,
    trend: 'down', // lower is better
    period: 'September 2026',
  },
  {
    id: 'kpi-6',
    label: 'Datasets Processed',
    value: 6,
    unit: 'datasets',
    change: 20.0,
    trend: 'up',
    period: 'September 2026',
  },
  {
    id: 'kpi-7',
    label: 'Total Records',
    value: 108500,
    unit: 'records',
    change: 15.3,
    trend: 'up',
    period: 'September 2026',
  },
  {
    id: 'kpi-8',
    label: 'Accuracy Rate',
    value: 94,
    unit: '%',
    change: 1.5,
    trend: 'up',
    period: 'September 2026',
  },
];

// ============================================================================
// Monthly Statistics - Internally Consistent
// ============================================================================

// Last 8 months of data showing trends
// Total should increase over time
// Match rates should be consistent or improving

export const mockMonthlyStatistics: MonthlyStatistic[] = [
  {
    month: 'Februari',
    year: 2026,
    totalDatasets: 3,
    totalMatching: 45000,
    totalMatched: 28800,
    matchRate: 64,
    totalVerified: 27000,
    verificationRate: 60,
  },
  {
    month: 'Maret',
    year: 2026,
    totalDatasets: 4,
    totalMatching: 62000,
    totalMatched: 40300,
    matchRate: 65,
    totalVerified: 38000,
    verificationRate: 61,
  },
  {
    month: 'April',
    year: 2026,
    totalDatasets: 4,
    totalMatching: 58000,
    totalMatched: 38760,
    matchRate: 66.8,
    totalVerified: 36000,
    verificationRate: 62,
  },
  {
    month: 'Mei',
    year: 2026,
    totalDatasets: 5,
    totalMatching: 78000,
    totalMatched: 52860,
    matchRate: 67.8,
    totalVerified: 50000,
    verificationRate: 64,
  },
  {
    month: 'Juni',
    year: 2026,
    totalDatasets: 5,
    totalMatching: 85000,
    totalMatched: 59500,
    matchRate: 70,
    totalVerified: 55000,
    verificationRate: 65,
  },
  {
    month: 'Juli',
    year: 2026,
    totalDatasets: 6,
    totalMatching: 95000,
    totalMatched: 67950,
    matchRate: 71.5,
    totalVerified: 68000,
    verificationRate: 72,
  },
  {
    month: 'Agustus',
    year: 2026,
    totalDatasets: 7,
    totalMatching: 102000,
    totalMatched: 73440,
    matchRate: 72,
    totalVerified: 75000,
    verificationRate: 74,
  },
  {
    month: 'September',
    year: 2026,
    totalDatasets: 6,
    totalMatching: 108500,
    totalMatched: 78060,
    matchRate: 72,
    totalVerified: 96550,
    verificationRate: 89,
  },
];

// ============================================================================
// Top Performing Employees - Reuse from monitoring
// ============================================================================

// Sort by completion rate descending, take top 3
export const mockTopPerformingEmployees = [...mockEmployeeProgress]
  .sort((a, b) => b.completionRate - a.completionRate)
  .slice(0, 3);

// ============================================================================
// Recent Activity - Reuse from history (last 5)
// ============================================================================

export const mockRecentActivity = mockHistoryRecords
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5);

// ============================================================================
// Executive Summary - Combined view
// ============================================================================

export const mockExecutiveSummary: ExecutiveSummary = {
  kpis: mockExecutiveKPIs,
  monthlyTrends: mockMonthlyStatistics,
  topPerformingEmployees: mockTopPerformingEmployees,
  recentActivity: mockRecentActivity,
};

// ============================================================================
// Chart Data Helpers
// ============================================================================

// Bar chart data for matching activity (last 8 months)
export const mockMatchingActivityData = mockMonthlyStatistics.map((stat) => ({
  label: stat.month.substring(0, 3),
  value: stat.totalMatching / 1000, // Convert to thousands
}));

// Donut chart data for verification distribution
export const mockVerificationDistribution = {
  verified: 96550,
  pending: 11950, // 108500 - 96550
  percentage: 89,
};

