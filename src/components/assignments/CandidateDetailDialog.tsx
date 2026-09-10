'use client';

import { Modal } from './Modal';
import { formatPercent, scoreBadgeClass } from './score';
import type { AssignmentCandidate } from './types';

interface CandidateDetailDialogProps {
  candidate: AssignmentCandidate;
  onClose: () => void;
}

function RecordField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-2 border-b border-outline-variant last:border-b-0">
      <p className="text-label-md text-on-surface-variant uppercase">{label}</p>
      <p className="text-body-sm text-on-surface mt-xs">{value || '-'}</p>
    </div>
  );
}

/**
 * Detail view for a single candidate.
 * This is the ONLY place where the full field-level similarity scores are shown.
 */
export function CandidateDetailDialog({ candidate, onClose }: CandidateDetailDialogProps) {
  const sortedFieldScores = [...candidate.fieldScores].sort((a, b) => b.score - a.score);

  return (
    <Modal
      title="Detail Kandidat"
      subtitle="Rincian pasangan record dan skor kesamaan per kolom."
      maxWidth="max-w-[760px]"
      onClose={onClose}
      footer={
        <button
          onClick={onClose}
          className="px-lg py-sm rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container transition-colors flex items-center gap-sm"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            arrow_back
          </span>
          Kembali
        </button>
      }
    >
      <div className="space-y-lg">
        {/* Overall score */}
        <div className="flex items-center justify-between bg-primary-fixed rounded-lg px-lg py-md">
          <div>
            <p className="text-label-md text-on-surface-variant uppercase">Skor Kesamaan</p>
            <p className="text-body-sm text-on-surface-variant mt-xs">
              Rata-rata dari {candidate.fieldScores.length} kolom yang dipetakan
            </p>
          </div>
          <span className="font-headline-lg text-headline-lg text-primary font-bold">
            {formatPercent(candidate.overallScore)}
          </span>
        </div>

        {/* Record comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <h3 className="font-label-md text-on-surface-variant uppercase mb-sm">Record A</h3>
            <div className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm">
              <RecordField label="IDSBR" value={candidate.recordA?.idsbr ?? candidate.idsbrA} />
              <RecordField label="Nama Usaha" value={candidate.recordA?.namaUsaha} />
              <RecordField label="Alamat Usaha" value={candidate.recordA?.alamatUsaha} />
              <RecordField label="Provinsi" value={candidate.recordA?.nmprov} />
              <RecordField label="Kabupaten" value={candidate.recordA?.nmkab} />
            </div>
          </div>
          <div>
            <h3 className="font-label-md text-on-surface-variant uppercase mb-sm">Record B</h3>
            <div className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm">
              <RecordField label="IDSBR" value={candidate.recordB?.idsbr ?? candidate.idsbrB} />
              <RecordField label="Nama Usaha" value={candidate.recordB?.namaUsaha} />
              <RecordField label="Alamat Usaha" value={candidate.recordB?.alamatUsaha} />
              <RecordField label="Provinsi" value={candidate.recordB?.nmprov} />
              <RecordField label="Kabupaten" value={candidate.recordB?.nmkab} />
            </div>
          </div>
        </div>

        {/* Field-level scores — full detail lives here, not in the main list */}
        <div>
          <h3 className="font-label-md text-on-surface-variant uppercase mb-sm">
            Detail Skor per Kolom
          </h3>
          <div className="border border-outline-variant rounded-lg overflow-hidden">
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-highest">
                  <tr>
                    <th className="px-md py-sm font-label-md text-on-surface-variant text-xs">Kolom Dataset A</th>
                    <th className="px-md py-sm font-label-md text-on-surface-variant text-xs">Kolom Dataset B</th>
                    <th className="px-md py-sm font-label-md text-on-surface-variant text-xs text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="font-data-tabular text-on-surface">
                  {sortedFieldScores.map((fieldScore, index) => (
                    <tr key={`${fieldScore.columnA}-${fieldScore.columnB}-${index}`} className="border-b border-outline-variant last:border-b-0">
                      <td className="px-md py-sm text-body-sm text-on-surface-variant">{fieldScore.columnA}</td>
                      <td className="px-md py-sm text-body-sm text-on-surface-variant">{fieldScore.columnB}</td>
                      <td className="px-md py-sm text-right">
                        <span className={`inline-block px-sm py-[2px] rounded text-xs font-semibold ${scoreBadgeClass(fieldScore.score)}`}>
                          {formatPercent(fieldScore.score)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
