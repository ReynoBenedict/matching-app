'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { EmployeeLayout } from '@/components/layouts/EmployeeLayout';
import { Modal } from '@/components/assignments/Modal';
import { formatPercent, scoreBadgeClass } from '@/components/assignments/score';

/** The subset of uploaded record columns rendered during manual verification. */
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
  verifiedAt: string | null;
  createdAt: string;
  recordA: DatasetRecord | null;
  recordB: DatasetRecord | null;
}

type VerificationResult = 'MATCH' | 'NON_MATCH';

/** The uploaded columns shown side by side for manual verification. */
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

function toScore(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function fieldValue(record: DatasetRecord | null, key: keyof DatasetRecord): string {
  const value = record?.[key];
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function statusMeta(assignment: AssignmentDetail): { pillClass: string; label: string; icon: string } {
  if (assignment.verificationResult === 'MATCH') {
    return { pillClass: 'bg-success-container text-on-success-container', label: 'MATCH', icon: 'check_circle' };
  }
  if (assignment.verificationResult === 'NON_MATCH') {
    return { pillClass: 'bg-error-container text-on-error-container', label: 'NON-MATCH', icon: 'cancel' };
  }
  if (assignment.status === 'COMPLETED') {
    return {
      pillClass: 'bg-surface-container-high text-on-surface-variant',
      label: 'Selesai',
      icon: 'task_alt',
    };
  }
  return { pillClass: 'bg-warning-container text-on-warning-container', label: 'Menunggu Verifikasi', icon: 'schedule' };
}

function MetaItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="font-label-md text-xs text-on-surface-variant mb-1">{label}</p>
      <p className="font-body-md font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function RecordColumn({ title, recordId, record, counterpart, canCompare }: {
  title: string;
  recordId: number;
  record: DatasetRecord | null;
  counterpart: DatasetRecord | null;
  canCompare: boolean;
}) {
  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
      <div className="px-4 py-3 bg-primary text-on-primary flex items-center justify-between gap-3">
        <span className="font-body-md font-bold">{title}</span>
        <span className="font-label-md text-xs opacity-90">ID Record {recordId}</span>
      </div>
      <div>
        {RECORD_FIELDS.map((field) => {
          const value = fieldValue(record, field.key);
          const otherValue = fieldValue(counterpart, field.key);
          const isDifferent = canCompare && normalize(value) !== normalize(otherValue);

          return (
            <div
              key={field.key}
              className="px-4 py-3 border-b border-outline-variant last:border-b-0 grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-1 sm:gap-3 items-start hover:bg-surface-container-low transition-colors"
            >
              <span className="font-label-md text-on-surface-variant">{field.label}</span>
              <span className="flex items-start gap-2 flex-wrap">
                <span className={`font-body-md break-words ${isDifferent ? 'font-semibold' : ''} text-on-surface`}>
                  {value}
                </span>
                {isDifferent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-warning-container text-on-warning-container font-label-md whitespace-nowrap">
                    Berbeda
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AssignmentDetailContent() {
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
    result: VerificationResult | null;
  }>({
    isOpen: false,
    result: null,
  });

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

  const handleVerifyClick = (result: VerificationResult) => {
    // Show confirmation dialog instead of immediately verifying
    setConfirmationDialog({
      isOpen: true,
      result,
    });
  };

  const handleConfirmationCancel = () => {
    if (submitting) return;
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

      setSuccessMessage(`Penugasan berhasil diverifikasi sebagai ${result}.`);
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

  const backLink = (
    <Link
      href="/employee/assignments"
      className="inline-flex items-center gap-2 text-primary font-label-md hover:underline"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        arrow_back
      </span>
      Kembali ke Penugasan Saya
    </Link>
  );

  if (loading) {
    return (
      <EmployeeLayout pageTitle="Detail Penugasan">
        <div className="space-y-6">
          {backLink}
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <span className="material-symbols-outlined animate-spin text-primary" style={{ fontSize: '48px' }}>
              progress_activity
            </span>
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
          {backLink}
          <div className="bg-error-container border-l-4 border-error p-6 rounded-lg">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-error">error</span>
              <div className="flex-1">
                <p className="font-headline-sm text-headline-sm text-on-error-container mb-1">
                  Gagal memuat penugasan
                </p>
                <p className="font-body-md text-on-error-container">{error}</p>
                <button
                  onClick={loadAssignment}
                  className="mt-4 px-4 py-2 bg-error text-on-error font-label-md rounded-lg hover:opacity-90 transition-opacity"
                >
                  Coba Lagi
                </button>
              </div>
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
          {backLink}
          <div className="bg-surface border border-outline-variant rounded-xl shadow-sm py-16 text-center">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: '48px' }}>
              search_off
            </span>
            <p className="font-headline-sm text-headline-sm text-on-surface mt-4">Penugasan tidak ditemukan</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  const score = toScore(assignment.similarityScore);
  const meta = statusMeta(assignment);
  const isCompleted = assignment.status === 'COMPLETED';
  const canCompare = Boolean(assignment.recordA && assignment.recordB);
  const resultIsMatch = assignment.verificationResult === 'MATCH';
  const hasResult = resultIsMatch || assignment.verificationResult === 'NON_MATCH';
  const resultToneClass = resultIsMatch ? 'text-on-success-container' : 'text-on-error-container';

  return (
    <EmployeeLayout pageTitle="Detail Penugasan">

      <div className="space-y-6">

        {backLink}

        {/* Success message */}
        {successMessage && (
          <div className="bg-success-container text-on-success-container p-4 rounded-lg border border-success flex items-start gap-3">
            <span
              className="material-symbols-outlined flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '24px' }}
            >
              check_circle
            </span>
            <p className="font-body-md">{successMessage}</p>
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
            <p className="font-body-md">{submitError}</p>
          </div>
        )}

        {/* Assignment header */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">
                Penugasan #{assignment.id}
              </h2>
              <p className="font-body-md text-on-surface-variant mt-1">
                Bandingkan kedua record di bawah, lalu tentukan hasil verifikasi.
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-label-md ${meta.pillClass}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                {meta.icon}
              </span>
              {meta.label}
            </span>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetaItem label="ID Penugasan" value={`#${assignment.id}`} />
            <MetaItem label="Record A" value={assignment.recordAId} />
            <MetaItem label="Record B" value={assignment.recordBId} />
            <div>
              <p className="font-label-md text-xs text-on-surface-variant mb-1">Skor Kesamaan</p>
              <span className={`inline-block px-2 py-1 rounded font-label-md ${scoreBadgeClass(score)}`}>
                {formatPercent(score)}
              </span>
            </div>
          </div>
        </div>

        {!canCompare && (
          <div className="bg-warning-container text-on-warning-container p-4 rounded-lg flex items-start gap-3">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px' }}>
              warning
            </span>
            <p className="font-body-md">
              Salah satu record tidak dapat dimuat, sehingga perbandingan nilai tidak ditandai. Hubungi Superadmin
              bila hal ini terjadi.
            </p>
          </div>
        )}

        {/* Records comparison */}
        <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Perbandingan Record</h3>
            {canCompare && (
              <span className="inline-flex items-center gap-2 font-label-md text-xs text-on-surface-variant">
                <span className="inline-block w-3 h-3 rounded bg-warning-container border border-warning" />
                Menandai nilai yang berbeda antar kedua record
              </span>
            )}
          </div>
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecordColumn
              title="Record A"
              recordId={assignment.recordAId}
              record={assignment.recordA}
              counterpart={assignment.recordB}
              canCompare={canCompare}
            />
            <RecordColumn
              title="Record B"
              recordId={assignment.recordBId}
              record={assignment.recordB}
              counterpart={assignment.recordA}
              canCompare={canCompare}
            />
          </div>
        </div>

        {/* Verification result (completed) / verification actions (still pending) */}
        {isCompleted ? (
          <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Hasil Verifikasi</h3>
            </div>
            <div className="p-6">
              {hasResult ? (
                <div
                  className={`flex items-center gap-4 rounded-xl border-2 px-5 py-4 ${
                    resultIsMatch ? 'border-success bg-success-container' : 'border-error bg-error-container'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined flex-shrink-0 ${resultToneClass}`}
                    style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}
                  >
                    {resultIsMatch ? 'check_circle' : 'cancel'}
                  </span>
                  <div>
                    <p className={`font-headline-md text-headline-md ${resultToneClass}`}>
                      {assignment.verificationResult}
                    </p>
                    <p className={`font-body-md ${resultToneClass}`}>
                      {resultIsMatch
                        ? 'Kedua record dinyatakan sebagai data yang sama.'
                        : 'Kedua record dinyatakan sebagai data yang berbeda.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-xl border-2 border-outline-variant bg-surface-container-low px-5 py-4">
                  <span className="material-symbols-outlined flex-shrink-0 text-on-surface-variant" style={{ fontSize: '40px' }}>
                    task_alt
                  </span>
                  <div>
                    <p className="font-headline-md text-headline-md text-on-surface">Selesai</p>
                    <p className="font-body-md text-on-surface-variant">
                      Penugasan ini sudah selesai, tetapi tidak ada hasil verifikasi yang tercatat.
                    </p>
                  </div>
                </div>
              )}

              <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="font-label-md text-xs text-on-surface-variant mb-1">Waktu Verifikasi</dt>
                  <dd className="font-body-md text-on-surface">{formatDateTime(assignment.verifiedAt)}</dd>
                </div>
                <div>
                  <dt className="font-label-md text-xs text-on-surface-variant mb-1">Status Penugasan</dt>
                  <dd className="font-body-md text-on-surface">Selesai — tidak ada tindakan lanjutan</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Tentukan Hasil Verifikasi</h3>
              <p className="font-body-md text-on-surface-variant mt-1">
                Pilih <span className="font-semibold">MATCH</span> bila kedua record merujuk ke usaha yang sama,
                atau <span className="font-semibold">NON-MATCH</span> bila merupakan usaha yang berbeda.
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleVerifyClick('MATCH')}
                  disabled={submitting}
                  className="flex items-center gap-4 text-left rounded-xl border-2 border-success bg-success-container text-on-success-container px-5 py-4 hover:bg-success hover:text-on-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span
                    className="material-symbols-outlined flex-shrink-0"
                    style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span>
                    <span className="block font-headline-sm text-headline-sm">MATCH</span>
                    <span className="block font-body-sm opacity-90 mt-0.5">
                      Kedua record adalah data yang sama
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => handleVerifyClick('NON_MATCH')}
                  disabled={submitting}
                  className="flex items-center gap-4 text-left rounded-xl border-2 border-error bg-error-container text-on-error-container px-5 py-4 hover:bg-error hover:text-on-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span
                    className="material-symbols-outlined flex-shrink-0"
                    style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}
                  >
                    cancel
                  </span>
                  <span>
                    <span className="block font-headline-sm text-headline-sm">NON-MATCH</span>
                    <span className="block font-body-sm opacity-90 mt-0.5">
                      Kedua record adalah data yang berbeda
                    </span>
                  </span>
                </button>
              </div>

              <p className="mt-4 flex items-start gap-2 font-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>
                  info
                </span>
                Hasil verifikasi akan dikonfirmasi terlebih dahulu, lalu disimpan permanen sebagai hasil akhir
                penugasan ini.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation dialog — portaled overlay, kept before submitting */}
      {confirmationDialog.isOpen && confirmationDialog.result && (
        <Modal
          title="Konfirmasi Verifikasi"
          subtitle={`Penugasan #${assignment.id}`}
          onClose={handleConfirmationCancel}
          maxWidth="max-w-[520px]"
          footer={
            <>
              <button
                onClick={handleConfirmationCancel}
                disabled={submitting}
                className="px-5 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface font-label-md hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleVerify}
                disabled={submitting}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-label-md text-on-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  confirmationDialog.result === 'MATCH'
                    ? 'bg-success hover:opacity-90'
                    : 'bg-error hover:opacity-90'
                }`}
              >
                {submitting && (
                  <span className="h-4 w-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
                )}
                {submitting ? 'Menyimpan...' : 'Ya, Simpan Hasil'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="font-body-md text-on-surface">
              Apakah Anda yakin ingin menyimpan hasil verifikasi penugasan ini sebagai:
            </p>

            <div
              className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 ${
                confirmationDialog.result === 'MATCH'
                  ? 'border-success bg-success-container'
                  : 'border-error bg-error-container'
              }`}
            >
              <span
                className={`material-symbols-outlined flex-shrink-0 ${
                  confirmationDialog.result === 'MATCH' ? 'text-on-success-container' : 'text-on-error-container'
                }`}
                style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}
              >
                {confirmationDialog.result === 'MATCH' ? 'check_circle' : 'cancel'}
              </span>
              <div>
                <p
                  className={`font-headline-sm text-headline-sm ${
                    confirmationDialog.result === 'MATCH' ? 'text-on-success-container' : 'text-on-error-container'
                  }`}
                >
                  {confirmationDialog.result}
                </p>
                <p
                  className={`font-body-sm ${
                    confirmationDialog.result === 'MATCH' ? 'text-on-success-container' : 'text-on-error-container'
                  }`}
                >
                  {confirmationDialog.result === 'MATCH'
                    ? 'Kedua record adalah data yang sama'
                    : 'Kedua record adalah data yang berbeda'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-warning-container text-on-warning-container p-4">
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px' }}>
                info
              </span>
              <p className="font-body-sm">
                Setelah disimpan, status penugasan berubah menjadi <span className="font-semibold">Selesai</span>{' '}
                dan hasil verifikasi tidak dapat diubah dari halaman ini.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </EmployeeLayout>
  );
}
