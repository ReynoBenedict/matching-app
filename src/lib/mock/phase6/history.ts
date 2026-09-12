/**
 * Phase 6 Mock Data - History
 * Realistic operational data for audit trails and process history
 */

import type { HistoryRecord, HistoryActionType } from '@/types/phase6';

// ============================================================================
// History Records - Internally Consistent with other mock data
// ============================================================================

export const mockHistoryRecords: HistoryRecord[] = [
  {
    id: 1,
    action: 'MATCHING_START',
    description: 'Started matching process PR-2026-001',
    entityType: 'process',
    entityId: 1,
    userId: 1,
    userName: 'Admin BPS',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 2,
    action: 'MATCHING_COMPLETE',
    description: 'Completed matching process PR-2026-001 with 1250 candidates',
    entityType: 'process',
    entityId: 1,
    userId: 1,
    userName: 'Admin BPS',
    metadata: { totalCandidates: 1250, matchCount: 875 },
    createdAt: '2026-09-01T14:30:00Z',
  },
  {
    id: 3,
    action: 'ASSIGNMENT_CREATE',
    description: 'Created 1250 assignments for process PR-2026-001',
    entityType: 'process',
    entityId: 1,
    userId: 1,
    userName: 'Admin BPS',
    metadata: { assignmentCount: 1250 },
    createdAt: '2026-09-01T14:35:00Z',
  },
  {
    id: 4,
    action: 'USER_LOGIN',
    description: 'User logged in',
    userId: 2,
    userName: 'Budi Santoso',
    createdAt: '2026-09-02T07:45:00Z',
  },
  {
    id: 5,
    action: 'MATCHING_START',
    description: 'Started matching process PR-2026-002',
    entityType: 'process',
    entityId: 2,
    userId: 1,
    userName: 'Admin BPS',
    createdAt: '2026-09-02T09:00:00Z',
  },
  {
    id: 6,
    action: 'VERIFICATION_SUBMIT',
    description: 'Verified assignment #1001 as MATCH',
    entityType: 'assignment',
    entityId: 1001,
    userId: 2,
    userName: 'Budi Santoso',
    metadata: { result: 'MATCH', score: 0.88 },
    createdAt: '2026-09-12T09:15:00Z',
  },
  {
    id: 7,
    action: 'VERIFICATION_SUBMIT',
    description: 'Verified assignment #1002 as NON_MATCH',
    entityType: 'assignment',
    entityId: 1002,
    userId: 3,
    userName: 'Siti Rahayu',
    metadata: { result: 'NON_MATCH', score: 0.72 },
    createdAt: '2026-09-12T09:30:00Z',
  },
  {
    id: 8,
    action: 'ASSIGNMENT_COMPLETE',
    description: 'Assignment #1001 completed',
    entityType: 'assignment',
    entityId: 1001,
    userId: 2,
    userName: 'Budi Santoso',
    createdAt: '2026-09-12T09:15:00Z',
  },
  {
    id: 9,
    action: 'USER_LOGIN',
    description: 'User logged in',
    userId: 3,
    userName: 'Siti Rahayu',
    createdAt: '2026-09-12T08:30:00Z',
  },
  {
    id: 10,
    action: 'MATCHING_FAIL',
    description: 'Matching process PR-2026-006 failed: Memory overflow',
    entityType: 'process',
    entityId: 6,
    userId: 1,
    userName: 'Admin BPS',
    metadata: { error: 'Memory overflow during string similarity calculation' },
    createdAt: '2026-09-08T11:45:00Z',
  },
  {
    id: 11,
    action: 'DATASET_UPLOAD',
    description: 'Uploaded dataset Sensus_Ekonomi_2024',
    entityType: 'dataset',
    entityId: 15,
    userId: 1,
    userName: 'Admin BPS',
    metadata: { fileName: 'sensus_ekonomi_2024.csv', recordCount: 45000 },
    createdAt: '2026-08-25T10:00:00Z',
  },
  {
    id: 12,
    action: 'MATCHING_COMPLETE',
    description: 'Completed matching process PR-2026-002 with 890 candidates',
    entityType: 'process',
    entityId: 2,
    userId: 1,
    userName: 'Admin BPS',
    metadata: { totalCandidates: 890, matchCount: 712 },
    createdAt: '2026-09-02T16:45:00Z',
  },
  {
    id: 13,
    action: 'USER_LOGOUT',
    description: 'User logged out',
    userId: 4,
    userName: 'Dewi Lestari',
    createdAt: '2026-09-12T17:00:00Z',
  },
  {
    id: 14,
    action: 'VERIFICATION_SUBMIT',
    description: 'Verified assignment #1003 as MATCH',
    entityType: 'assignment',
    entityId: 1003,
    userId: 2,
    userName: 'Budi Santoso',
    metadata: { result: 'MATCH', score: 0.85 },
    createdAt: '2026-09-12T10:00:00Z',
  },
  {
    id: 15,
    action: 'MATCHING_START',
    description: 'Started matching process PR-2026-003',
    entityType: 'process',
    entityId: 3,
    userId: 1,
    userName: 'Admin BPS',
    createdAt: '2026-09-10T10:00:00Z',
  },
];

// ============================================================================
// Derived Statistics
// ============================================================================

export const mockHistoryStatistics = {
  totalRecords: mockHistoryRecords.length,
  matchingStarts: mockHistoryRecords.filter(h => h.action === 'MATCHING_START').length,
  matchingCompletes: mockHistoryRecords.filter(h => h.action === 'MATCHING_COMPLETE').length,
  matchingFails: mockHistoryRecords.filter(h => h.action === 'MATCHING_FAIL').length,
  verifications: mockHistoryRecords.filter(h => h.action === 'VERIFICATION_SUBMIT').length,
  logins: mockHistoryRecords.filter(h => h.action === 'USER_LOGIN').length,
  logouts: mockHistoryRecords.filter(h => h.action === 'USER_LOGOUT').length,
};

// Action type metadata for display
export const historyActionMeta: Record<HistoryActionType, { label: string; icon: string; color: string }> = {
  MATCHING_START: { label: 'Mulai Pencocokan', icon: 'play_arrow', color: 'text-secondary' },
  MATCHING_COMPLETE: { label: 'Pencocokan Selesai', icon: 'check_circle', color: 'text-primary' },
  MATCHING_FAIL: { label: 'Pencocokan Gagal', icon: 'error', color: 'text-error' },
  ASSIGNMENT_CREATE: { label: 'Buat Penugasan', icon: 'assignment', color: 'text-secondary' },
  ASSIGNMENT_COMPLETE: { label: 'Penugasan Selesai', icon: 'task_alt', color: 'text-primary' },
  USER_LOGIN: { label: 'Login', icon: 'login', color: 'text-on-surface-variant' },
  USER_LOGOUT: { label: 'Logout', icon: 'logout', color: 'text-on-surface-variant' },
  DATASET_UPLOAD: { label: 'Upload Dataset', icon: 'upload_file', color: 'text-secondary' },
  VERIFICATION_SUBMIT: { label: 'Submit Verifikasi', icon: 'fact_check', color: 'text-primary' },
};

