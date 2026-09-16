'use client';

import { Modal } from '@/components/assignments/Modal';
import { DATASET_REQUIRED_FIELDS, DATASET_OPTIONAL_FIELDS, TOTAL_SCHEMA_FIELDS } from '@/lib/constants/dataset-schema';

interface DatasetSchemaInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatasetSchemaInfo({ isOpen, onClose }: DatasetSchemaInfoProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title="Informasi Skema Dataset"
      subtitle="Kolom yang diperlukan untuk seluruh sumber dataset BPS."
      maxWidth="max-w-[860px]"
      onClose={onClose}
      footer={
        <button
          onClick={onClose}
          className="px-lg py-sm rounded-lg font-label-md bg-primary text-on-primary hover:bg-primary-container transition-colors"
        >
          Tutup
        </button>
      }
    >
      <div className="space-y-lg">
        {/* Ringkasan skema */}
        <div className="grid grid-cols-2 gap-md">
          <div className="bg-primary-fixed p-md rounded-lg">
            <p className="text-label-md text-on-surface-variant uppercase mb-xs">Total Kolom</p>
            <p className="text-headline-md text-primary font-bold">{TOTAL_SCHEMA_FIELDS}</p>
          </div>
          <div className="bg-secondary-fixed p-md rounded-lg">
            <p className="text-label-md text-on-surface-variant uppercase mb-xs">Wajib</p>
            <p className="text-headline-md text-secondary font-bold">{DATASET_REQUIRED_FIELDS.length}</p>
          </div>
        </div>

        {/* Kolom wajib */}
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-secondary">check_circle</span>
            Kolom Wajib ({DATASET_REQUIRED_FIELDS.length})
          </h3>
          <div className="space-y-sm">
            {DATASET_REQUIRED_FIELDS.map((field) => (
              <div key={field.fieldName} className="bg-surface border border-outline-variant rounded p-md">
                <div className="flex items-start justify-between gap-md">
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-on-surface font-mono text-[11px] text-secondary break-all">
                      {field.fieldName}
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-xs">{field.description}</p>
                  </div>
                  <span className="bg-secondary-fixed text-on-secondary-fixed px-sm py-xs rounded text-label-md text-[10px] whitespace-nowrap">
                    {field.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom opsional */}
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md flex items-center gap-sm">
            <span className="material-symbols-outlined text-tertiary">help</span>
            Kolom Opsional ({DATASET_OPTIONAL_FIELDS.length})
          </h3>
          <div className="space-y-sm">
            {DATASET_OPTIONAL_FIELDS.map((field) => (
              <div
                key={field.fieldName}
                className="bg-surface-variant/50 border border-outline-variant rounded p-md opacity-75"
              >
                <div className="flex items-start justify-between gap-md">
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-on-surface font-mono text-[11px] text-tertiary break-all">
                      {field.fieldName}
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-xs">{field.description}</p>
                  </div>
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed px-sm py-xs rounded text-label-md text-[10px] whitespace-nowrap">
                    {field.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catatan */}
        <div className="bg-surface-container-high border-l-4 border-secondary p-md rounded">
          <p className="text-body-sm text-on-surface">
            <span className="font-semibold">Catatan:</span> Skema ini berlaku untuk keempat sumber dataset
            (DB Kendedes, Dir Pajak, OSS Badan Usaha, OSS Perorangan). Record dataset sebenarnya tersimpan
            secara aman dan tidak ditampilkan di sini.
          </p>
        </div>
      </div>
    </Modal>
  );
}
