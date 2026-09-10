'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { EmployeeLayout } from '@/components/layouts/EmployeeLayout';

// Add spin animation
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

interface AssignmentDetail {
  id: number;
  recordAId: number;
  recordBId: number;
  employeeId: number;
  similarityScore: string;
  status: string;
  verificationResult: string | null;
  verifiedAt: string | null;
  createdAt: string;
  recordA: any;
  recordB: any;
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
    result: 'MATCH' | 'NON_MATCH' | null;
  }>({
    isOpen: false,
    result: null,
  });

  useEffect(() => {
    loadAssignment();
  }, []);

  const loadAssignment = async () => {
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
  };

  const handleVerifyClick = (result: 'MATCH' | 'NON_MATCH') => {
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
      <EmployeeLayout pageTitle="Verifikasi Penugasan">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-on-surface-variant">Memuat detail penugasan...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout pageTitle="Verifikasi Penugasan">
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
      <EmployeeLayout pageTitle="Verifikasi Penugasan">
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

  // Helper component to render a single record field
  const RecordField = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="py-3 border-b border-outline-variant last:border-b-0">
      <p className="text-xs font-semibold text-on-surface-variant mb-2">{label}</p>
      <p className="text-sm text-on-surface">{value || '-'}</p>
    </div>
  );

  return (
    <EmployeeLayout pageTitle="Verifikasi Penugasan">
      {/* Global modal spin animation */}
      <style>{spinKeyframes}</style>
      
      {/* Main assignment content */}
      <div className="space-y-6 w-full px-2 sm:px-4">
        {/* Persistent back button - always visible */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-primary hover:text-primary-container font-label-md transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              arrow_back
            </span>
            Kembali ke Penugasan Saya
          </button>
        </div>

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
        <div className="bg-surface-container-low p-4 sm:p-6 rounded-lg border border-outline-variant">
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

        {/* Records comparison container - responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Record A */}
          <div className="space-y-3">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Record A</h3>
            <div className="bg-surface-container-low p-4 sm:p-6 rounded-lg border border-outline-variant">
              <RecordField label="IDSBR" value={assignment.recordA?.idsbr} />
              <RecordField label="Nama Usaha" value={assignment.recordA?.namaUsaha} />
              <RecordField label="Alamat Usaha" value={assignment.recordA?.alamatUsaha} />
              <RecordField label="Kode Wilayah" value={assignment.recordA?.kodeWilayah} />
              <RecordField label="Provinsi" value={assignment.recordA?.nmprov} />
              <RecordField label="Kabupaten" value={assignment.recordA?.nmkab} />
              <RecordField label="Kecamatan" value={assignment.recordA?.nmkec} />
              <RecordField label="Desa" value={assignment.recordA?.nmdesa} />
            </div>
          </div>

          {/* Record B */}
          <div className="space-y-3">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Record B</h3>
            <div className="bg-surface-container-low p-4 sm:p-6 rounded-lg border border-outline-variant">
              <RecordField label="IDSBR" value={assignment.recordB?.idsbr} />
              <RecordField label="Nama Usaha" value={assignment.recordB?.namaUsaha} />
              <RecordField label="Alamat Usaha" value={assignment.recordB?.alamatUsaha} />
              <RecordField label="Kode Wilayah" value={assignment.recordB?.kodeWilayah} />
              <RecordField label="Provinsi" value={assignment.recordB?.nmprov} />
              <RecordField label="Kabupaten" value={assignment.recordB?.nmkab} />
              <RecordField label="Kecamatan" value={assignment.recordB?.nmkec} />
              <RecordField label="Desa" value={assignment.recordB?.nmdesa} />
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
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
            </div>
          </div>
        ) : (
          <div className="bg-primary-container text-on-primary-container p-4 sm:p-6 rounded-lg border border-primary text-center">
            <p className="font-headline-sm text-headline-sm mb-2">Verifikasi Selesai</p>
            <p className="text-body-md mb-4">
              Penugasan telah diverifikasi sebagai <span className="font-semibold">{assignment.verificationResult}</span>
            </p>
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
