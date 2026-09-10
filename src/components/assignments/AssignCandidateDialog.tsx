'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { formatPercent } from './score';
import type { AssignmentCandidate, Employee } from './types';

interface AssignCandidateDialogProps {
  candidate: AssignmentCandidate;
  employees: Employee[];
  employeesLoading: boolean;
  employeesError: string | null;
  submitting: boolean;
  error: string | null;
  onConfirm: (employeeId: number) => void;
  onClose: () => void;
}

function RecordSummary({
  label,
  idsbr,
  namaUsaha,
  alamatUsaha,
}: {
  label: string;
  idsbr: string;
  namaUsaha?: string;
  alamatUsaha?: string;
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
      <p className="text-label-md text-on-surface-variant uppercase mb-xs">{label}</p>
      <p className="font-data-tabular text-on-surface font-semibold">{idsbr}</p>
      {namaUsaha && <p className="text-body-sm text-on-surface mt-xs">{namaUsaha}</p>}
      {alamatUsaha && <p className="text-body-sm text-on-surface-variant">{alamatUsaha}</p>}
    </div>
  );
}

export function AssignCandidateDialog({
  candidate,
  employees,
  employeesLoading,
  employeesError,
  submitting,
  error,
  onConfirm,
  onClose,
}: AssignCandidateDialogProps) {
  const [employeeId, setEmployeeId] = useState<number | ''>('');

  return (
    <Modal
      title="Konfirmasi Penugasan"
      subtitle="Tugaskan satu pasangan kandidat kepada pegawai untuk diverifikasi."
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-lg py-sm rounded-lg font-label-md border border-outline-variant text-on-surface hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => employeeId !== '' && onConfirm(employeeId)}
            disabled={employeeId === '' || submitting}
            className="px-lg py-sm rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-sm"
          >
            {submitting && (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent" />
            )}
            {submitting ? 'Menyimpan...' : 'Konfirmasi Penugasan'}
          </button>
        </>
      }
    >
      <div className="space-y-lg">
        {error && (
          <div className="bg-error-container text-on-error-container p-md rounded-lg border border-error flex items-start gap-sm">
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px' }}>
              error
            </span>
            <p className="text-body-sm">{error}</p>
          </div>
        )}

        {/* Candidate summary */}
        <div>
          <h3 className="font-label-md text-on-surface-variant uppercase mb-md">Rincian Kandidat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <RecordSummary
              label="Record A"
              idsbr={candidate.idsbrA}
              namaUsaha={candidate.recordA?.namaUsaha}
              alamatUsaha={candidate.recordA?.alamatUsaha}
            />
            <RecordSummary
              label="Record B"
              idsbr={candidate.idsbrB}
              namaUsaha={candidate.recordB?.namaUsaha}
              alamatUsaha={candidate.recordB?.alamatUsaha}
            />
          </div>
          <div className="mt-md flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm">
            <span className="text-body-md text-on-surface-variant">Skor Kesamaan</span>
            <span className="font-headline-sm text-headline-sm text-primary">
              {formatPercent(candidate.overallScore)}
            </span>
          </div>
        </div>

        {/* Employee picker */}
        <div>
          <label htmlFor="pegawai" className="block font-label-md text-on-surface-variant uppercase mb-md">
            Pilih Pegawai
          </label>

          {employeesLoading ? (
            <div className="flex items-center gap-sm text-on-surface-variant text-body-sm py-sm">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              Memuat daftar pegawai...
            </div>
          ) : employeesError ? (
            <div className="bg-error-container text-on-error-container p-md rounded-lg border border-error text-body-sm">
              {employeesError}
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-surface-container-low text-on-surface-variant p-md rounded-lg border border-outline-variant text-body-sm">
              Tidak ada pegawai aktif yang tersedia.
            </div>
          ) : (
            <select
              id="pegawai"
              value={employeeId}
              onChange={(event) => setEmployeeId(Number(event.target.value))}
              className="block w-full min-w-0 max-w-full px-md py-sm rounded-lg border border-outline-variant bg-surface text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-secondary-container"
            >
              <option value="">Pilih pegawai...</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} — {employee.email}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </Modal>
  );
}
