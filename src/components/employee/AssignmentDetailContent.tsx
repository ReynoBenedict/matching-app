'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { EmployeeLayout } from '@/components/layouts/EmployeeLayout';

// Add spin animation
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

interface DatasetRecord {
  idsbr?: string | number | null;
  namaUsaha?: string | null;
  alamatUsaha?: string | null;
  kodeWilayah?: string | number | null;
  nmprov?: string | null;
  nmkab?: string | null;
  nmkec?: string | null;
  nmdesa?: string | null;
}

interface AssignmentDetail {
  id: number;
  recordAId: number;
  recordBId: number;
  employeeId: number;
  similarityScore: string;
  status: string;
  verificationResult: string | null;
  verificationNote: string | null;
  matchingRunId: number | null;
  threshold: string | null;
  tfidfSimilarity: string | null;
  faissSimilarity: string | null;
  rapidfuzzSimilarity: string | null;
  fieldScores: Array<{ columnA: string; columnB: string; score: number }> ;
  verifiedAt: string | null;
  createdAt: string;
  recordA: DatasetRecord | null;
  recordB: DatasetRecord | null;
}

const RECORD_FIELDS: Array<{ key: keyof DatasetRecord; label: string }> = [
  { key: 'idsbr', label: 'IDSBR' },
  { key: 'namaUsaha', label: 'Nama Usaha' },
  { key: 'alamatUsaha', label: 'Alamat Usaha' },
  { key: 'kodeWilayah', label: 'Kode Wilayah' },
  { key: 'nmprov', label: 'Provinsi' },
  { key: 'nmkab', label: 'Kabupaten/Kota' },
  { key: 'nmkec', label: 'Kecamatan' },
  { key: 'nmdesa', label: 'Desa/Kelurahan' },
];

// Helper component to render a single record field
function RecordField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="py-3 border-b border-outline-variant last:border-b-0">
      <p className="text-xs font-semibold text-on-surface-variant mb-2">{label}</p>
      <p className="text-sm text-on-surface">{value || '-'}</p>
    </div>
  );
}

function RecordColumn({ title, record, counterpart }: {
  title: string;
  record: DatasetRecord | null;
  counterpart: DatasetRecord | null;
}) {
  const valueOf = (key: keyof DatasetRecord) => String(record?.[key] ?? '').trim() || '-';
  const counterpartValueOf = (key: keyof DatasetRecord) => String(counterpart?.[key] ?? '').trim() || '-';

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
      <div className="px-4 py-3 bg-primary text-on-primary font-body-md font-bold">{title}</div>
      <div>
        {RECORD_FIELDS.map((field) => {
          const value = valueOf(field.key);
          const differs = value.toLowerCase() !== counterpartValueOf(field.key).toLowerCase();
          return (
            <div key={field.key} className="px-4 py-3 border-b border-outline-variant last:border-b-0 grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-1 sm:gap-3">
              <span className="font-label-md text-on-surface-variant">{field.label}</span>
              <span className="flex items-start gap-2 flex-wrap">
                <span className={`font-body-md break-words text-on-surface ${differs ? 'font-semibold' : ''}`}>{value}</span>
                {differs && <span className="inline-flex items-center px-2 py-0.5 rounded bg-warning-container text-on-warning-container font-label-md">Berbeda</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AssignmentDetailContent() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = parseInt((params.id as string) || '0', 10);

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    result: 'MATCH' | 'NON_MATCH' | 'REVIEW' | null;
  }>({
    isOpen: false,
    result: null,
  });
  const [verificationNote, setVerificationNote] = useState('');

  const loadAssignment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Gagal memuat detail penugasan');
        setLoading(false);
        return;
      }

      setAssignment(data.data);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat detail penugasan: ' + (err instanceof Error ? err.message : 'Kesalahan tidak diketahui'));
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAssignment();
  }, [loadAssignment]);

  const handleVerifyClick = (result: 'MATCH' | 'NON_MATCH' | 'REVIEW') => {
    // Show confirmation dialog instead of immediately verifying
    setConfirmationDialog({
      isOpen: true,
      result,
    });
  };

  const handleConfirmationCancel = () => {
    setConfirmationDialog({
      isOpen: false,
      result: null,
    });
  };

  const handleVerify = async () => {
    if (!assignment || !confirmationDialog.result) return;

    const result = confirmationDialog.result;
    setConfirmationDialog({
      isOpen: false,
      result: null,
    });

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/assignments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          verificationResult: result,
          verificationNote,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || 'Gagal menyimpan hasil verifikasi');
        setSubmitting(false);
        return;
      }

      setSuccessMessage(`Penugasan berhasil diverifikasi sebagai ${result}`);
      setSubmitting(false);

      // Reload assignment to show updated state
      setTimeout(() => {
        loadAssignment();
      }, 1500);
    } catch (err) {
      setSubmitError('Gagal menyimpan hasil: ' + (err instanceof Error ? err.message : 'Kesalahan tidak diketahui'));
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <EmployeeLayout pageTitle="Detail Penugasan">
        <div className="space-y-6">
          <Link href="/employee/assignments" className="inline-flex items-center gap-2 text-primary font-label-md hover:underline">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
            Kembali ke Penugasan Saya
          </Link>
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>progress_activity</span>
            <p className="font-body-lg text-on-surface-variant">Memuat detail penugasan...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout pageTitle="Detail Penugasan">
        <div className="space-y-6">
          <div className="bg-error-container p-6 rounded-lg border border-error">
            <p className="font-semibold text-on-error-container mb-2">Kesalahan</p>
            <p className="text-sm text-on-error-container-variant mb-4">{error}</p>
            <div className="flex gap-4">
              <button
                onClick={loadAssignment}
                className="bg-on-error-container text-error-container px-4 py-2 rounded-lg font-label-md hover:opacity-90 transition-opacity"
              >
                Coba Lagi
              </button>
              <button
                onClick={handleBack}
                className="bg-error text-on-error px-4 py-2 rounded-lg font-label-md hover:opacity-90 transition-opacity"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  if (!assignment) {
    return (
      <EmployeeLayout pageTitle="Detail Penugasan">
        <div className="space-y-6">
          <div className="bg-surface-container-low p-8 rounded-lg border border-outline-variant text-center">
            <p className="text-on-surface font-semibold">Penugasan tidak ditemukan</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  const score = (parseFloat(assignment.similarityScore) * 100).toFixed(1);
  const isVerified = assignment.verificationResult !== null;
  const metricPercent = (value: string | null) => value == null ? '-' : `${(parseFloat(value) * 100).toFixed(2)}%`;

  return (
    <EmployeeLayout pageTitle="Detail Penugasan">
      {/* Global modal spin animation */}
      <style>{spinKeyframes}</style>
      
      {/* Main assignment content */}
      <div className="space-y-6 w-full px-2 sm:px-4">
        {/* Persistent back button - always visible */}
        <Link href="/employee/assignments" className="inline-flex items-center gap-2 text-primary font-label-md hover:underline">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          Kembali ke Penugasan Saya
        </Link>

        {/* Success message */}
        {successMessage && (
          <div className="bg-success-container text-on-success-container p-4 rounded-lg border border-success flex items-start gap-3">
            <span
              className="material-symbols-outlined flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '24px' }}
            >
              check_circle
            </span>
            <p className="text-sm sm:text-base">{successMessage}</p>
          </div>
        )}

        {/* Error message */}
        {submitError && (
          <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error flex items-start gap-3">
            <span
              className="material-symbols-outlined flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '24px' }}
            >
              error
            </span>
            <p className="text-sm sm:text-base">{submitError}</p>
          </div>
        )}

        {/* Assignment header */}
        <div className="bg-surface border border-outline-variant p-4 sm:p-6 rounded-xl shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold text-on-surface-variant mb-1">ID Penugasan</p>
              <p className="text-sm font-semibold text-on-surface">#{assignment.id}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant mb-1">Record A</p>
              <p className="text-sm font-semibold text-on-surface">{assignment.recordAId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant mb-1">Record B</p>
              <p className="text-sm font-semibold text-on-surface">{assignment.recordBId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant mb-1">Skor Kesamaan</p>
              <p className="text-sm font-semibold text-on-surface">{score}%</p>
            </div>
          </div>
          {isVerified && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant">Status Verifikasi:</span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded ${
                  assignment.verificationResult === 'MATCH'
                    ? 'bg-success-container text-on-success-container'
                    : 'bg-tertiary-container text-on-tertiary-container'
                }`}
              >
                {assignment.verificationResult}
              </span>
              <span className="text-xs text-on-surface-variant">
                pada {new Date(assignment.verifiedAt!).toLocaleString('id-ID')}
              </span>
            </div>
          )}
        </div>

        <div className="bg-surface border border-outline-variant p-4 sm:p-6 rounded-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Detail Similarity</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <RecordField label="TF-IDF Cosine" value={metricPercent(assignment.tfidfSimilarity)} />
            <RecordField label="FAISS Similarity" value={metricPercent(assignment.faissSimilarity)} />
            <RecordField label="RapidFuzz" value={metricPercent(assignment.rapidfuzzSimilarity)} />
            <RecordField label="Final Score" value={`${score}%`} />
          </div>
          {assignment.fieldScores?.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm"><thead><tr className="border-b border-outline-variant"><th className="py-2">Kolom A</th><th className="py-2">Kolom B</th><th className="py-2 text-right">Skor</th></tr></thead><tbody>
                {assignment.fieldScores.map((field, index) => <tr key={index} className="border-b border-outline-variant"><td className="py-2">{field.columnA}</td><td className="py-2">{field.columnB}</td><td className="py-2 text-right">{(field.score * 100).toFixed(2)}%</td></tr>)}
              </tbody></table>
            </div>
          )}
        </div>

        {/* Records comparison with friend-side difference highlighting */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Perbandingan Record</h3>
            <p className="font-body-sm text-on-surface-variant mt-1">Nilai yang berbeda ditandai untuk membantu verifikasi manual.</p>
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecordColumn title="Record A" record={assignment.recordA} counterpart={assignment.recordB} />
            <RecordColumn title="Record B" record={assignment.recordB} counterpart={assignment.recordA} />
          </div>
        </div>

        {/* Verification actions */}
        {!isVerified ? (
          <div className="space-y-4 bg-surface-container-low p-4 sm:p-6 rounded-lg border border-outline-variant">
            <div>
              <p className="font-headline-sm text-headline-sm text-on-surface mb-2">Apakah kedua record ini cocok?</p>
              <p className="text-body-md text-on-surface-variant">
                Pilih MATCH jika kedua record mewakili data yang sama, atau NON-MATCH jika berbeda.
              </p>
            </div>
            <textarea
              value={verificationNote}
              onChange={(e) => setVerificationNote(e.target.value)}
              placeholder="Catatan verifikasi (opsional)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => handleVerifyClick('MATCH')}
                disabled={submitting}
                className="bg-success text-on-success py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-label-lg hover:bg-success-container hover:text-on-success-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span>{submitting ? 'Memproses...' : 'MATCH'}</span>
              </button>
              <button
                onClick={() => handleVerifyClick('NON_MATCH')}
                disabled={submitting}
                className="bg-tertiary text-on-tertiary py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-label-lg hover:bg-tertiary-container hover:text-on-tertiary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  close
                </span>
                <span>{submitting ? 'Memproses...' : 'NON-MATCH'}</span>
              </button>
              <button
                onClick={() => handleVerifyClick('REVIEW')}
                disabled={submitting}
                className="bg-secondary text-on-secondary py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-label-lg hover:bg-secondary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">rate_review</span>
                <span>{submitting ? 'Memproses...' : 'PERLU REVIEW'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-primary-container text-on-primary-container p-4 sm:p-6 rounded-lg border border-primary text-center">
            <p className="font-headline-sm text-headline-sm mb-2">Verifikasi Selesai</p>
            <p className="text-body-md mb-4">
              Penugasan telah diverifikasi sebagai <span className="font-semibold">{assignment.verificationResult}</span>
            </p>
            {assignment.verificationNote && <p className="text-sm text-left bg-surface/40 rounded-lg p-3"><span className="font-semibold">Catatan:</span> {assignment.verificationNote}</p>}
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal - Rendered as sibling, OUTSIDE main content container */}
      {confirmationDialog.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: '#fafafa',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(0, 0, 0, 0.12)',
            }}
          >
            {/* Dialog header */}
            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <p style={{ fontSize: '18px', fontWeight: 600, color: '#1d1b20', margin: 0 }}>
                Konfirmasi Verifikasi
              </p>
            </div>

            {/* Dialog content */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '16px', color: '#1d1b20', lineHeight: '1.5', margin: 0 }}>
                Apakah Anda yakin ingin memverifikasi penugasan ini sebagai{' '}
                <span style={{ fontWeight: 600 }}>{confirmationDialog.result}</span>?
              </p>
            </div>

            {/* Dialog actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <button
                onClick={handleConfirmationCancel}
                disabled={submitting}
                style={{
                  padding: '8px 24px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '14px',
                  backgroundColor: '#f5f5f5',
                  color: '#1d1b20',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#efefef')}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              >
                Batal
              </button>
              <button
                onClick={handleVerify}
                disabled={submitting}
                style={{
                  padding: '8px 24px',
                  borderRadius: '8px',
                  fontWeight: 500,
                  fontSize: '14px',
                  backgroundColor: '#6750a4',
                  color: '#ffffff',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#5a4a90')}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#6750a4')}
              >
                {submitting ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  'Ya, Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}
