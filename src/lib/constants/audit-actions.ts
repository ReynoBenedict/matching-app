/**
 * Presentation metadata for audit_logs actions.
 * Labels/descriptions are derived from the real action names recorded by the
 * backend; descriptions only restate data found in the log's metadata.
 */

export interface AuditActionMeta {
  label: string;
  icon: string;
  color: string;
}

export const AUDIT_ACTION_META: Record<string, AuditActionMeta> = {
  MATCHING_START: { label: 'Pencocokan Dimulai', icon: 'play_arrow', color: 'text-secondary' },
  MATCHING_COMPLETE: { label: 'Pencocokan Selesai', icon: 'check_circle', color: 'text-primary' },
  MATCHING_FAIL: { label: 'Pencocokan Gagal', icon: 'error', color: 'text-error' },
  CREATE_ASSIGNMENT: { label: 'Penugasan Dibuat', icon: 'assignment', color: 'text-secondary' },
  VERIFY_ASSIGNMENT: { label: 'Verifikasi Disubmit', icon: 'fact_check', color: 'text-primary' },
  LOGIN: { label: 'Masuk', icon: 'login', color: 'text-on-surface-variant' },
  LOGOUT: { label: 'Keluar', icon: 'logout', color: 'text-on-surface-variant' },
  DATASET_UPLOADED: { label: 'Dataset Diunggah', icon: 'upload_file', color: 'text-secondary' },
  DATASET_UPLOAD_FAILED: { label: 'Unggah Dataset Gagal', icon: 'report', color: 'text-error' },
  REGISTRATION_SUBMITTED: { label: 'Registrasi Diajukan', icon: 'person_add', color: 'text-secondary' },
  REGISTRATION_APPROVED: { label: 'Registrasi Disetujui', icon: 'how_to_reg', color: 'text-primary' },
  REGISTRATION_REJECTED: { label: 'Registrasi Ditolak', icon: 'person_remove', color: 'text-error' },
};

export function getAuditActionMeta(action: string): AuditActionMeta {
  return (
    AUDIT_ACTION_META[action] ?? {
      label: action,
      icon: 'info',
      color: 'text-on-surface-variant',
    }
  );
}

function asRecord(metadata: unknown): Record<string, unknown> | null {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return null;
}

function pick(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return null;
  return String(value);
}

/**
 * Build a human-readable Indonesian description from an audit log entry.
 * Only restates information actually present in the log (action/metadata/entity).
 */
export function describeAuditLog(
  action: string,
  metadata: unknown,
  entityType: string | null,
  entityId: number | null
): string {
  const data = asRecord(metadata);

  switch (action) {
    case 'MATCHING_START':
      return 'Memulai proses pencocokan data.';
    case 'MATCHING_COMPLETE': {
      const total = pick(data, 'totalCandidates');
      return total
        ? `Menyelesaikan proses pencocokan dengan ${total} kandidat.`
        : 'Menyelesaikan proses pencocokan data.';
    }
    case 'MATCHING_FAIL': {
      const error = pick(data, 'error');
      return error ? `Proses pencocokan gagal: ${error}` : 'Proses pencocokan gagal.';
    }
    case 'CREATE_ASSIGNMENT': {
      const recordAId = pick(data, 'recordAId');
      const recordBId = pick(data, 'recordBId');
      const employeeId = pick(data, 'employeeId');
      if (recordAId && recordBId && employeeId) {
        return `Membuat penugasan record #${recordAId} ↔ #${recordBId} untuk pegawai #${employeeId}.`;
      }
      return 'Membuat penugasan kandidat pencocokan.';
    }
    case 'VERIFY_ASSIGNMENT': {
      const result = pick(data, 'verificationResult');
      return result
        ? `Menyimpan hasil verifikasi penugasan: ${result}.`
        : 'Menyimpan hasil verifikasi penugasan.';
    }
    case 'LOGIN':
      return 'Masuk ke sistem.';
    case 'LOGOUT':
      return 'Keluar dari sistem.';
    case 'DATASET_UPLOADED': {
      const fileName = pick(data, 'fileName');
      const valid = pick(data, 'validRecords');
      const total = pick(data, 'totalRecords');
      const base = fileName ? `Mengunggah dataset "${fileName}"` : 'Mengunggah dataset';
      return valid && total ? `${base} (${valid} valid dari ${total} record).` : `${base}.`;
    }
    case 'DATASET_UPLOAD_FAILED': {
      const fileName = pick(data, 'fileName');
      return fileName ? `Unggah dataset "${fileName}" gagal.` : 'Unggah dataset gagal.';
    }
    case 'REGISTRATION_SUBMITTED': {
      const username = pick(data, 'username');
      return username
        ? `Mengajukan registrasi akun "${username}".`
        : 'Mengajukan registrasi akun.';
    }
    case 'REGISTRATION_APPROVED': {
      const username = pick(data, 'username');
      return username
        ? `Menyetujui registrasi akun "${username}".`
        : 'Menyetujui pengajuan registrasi.';
    }
    case 'REGISTRATION_REJECTED': {
      const username = pick(data, 'username');
      return username
        ? `Menolak registrasi akun "${username}".`
        : 'Menolak pengajuan registrasi.';
    }
    default:
      return entityType && entityId != null
        ? `Aktivitas ${action} pada ${entityType} #${entityId}.`
        : `Aktivitas ${action}.`;
  }
}
