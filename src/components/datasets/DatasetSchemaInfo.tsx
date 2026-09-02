'use client';

import { DATASET_REQUIRED_FIELDS, DATASET_OPTIONAL_FIELDS, TOTAL_SCHEMA_FIELDS } from '@/lib/constants/dataset-schema';

interface DatasetSchemaInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatasetSchemaInfo({ isOpen, onClose }: DatasetSchemaInfoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-xl shadow-lg max-w-2xl max-h-[80vh] overflow-y-auto w-full">
        {/* Header */}
        <div className="sticky top-0 bg-surface-bright border-b border-outline-variant p-lg flex justify-between items-center">
          <div>
            <h2 className="font-headline-sm text-on-surface">Dataset Schema Information</h2>
            <p className="text-body-sm text-on-surface-variant">Required fields for all BPS dataset sources</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-lg space-y-lg">
          {/* Schema Summary */}
          <div className="grid grid-cols-2 gap-md">
            <div className="bg-primary-fixed p-md rounded-lg">
              <p className="text-label-md text-on-surface-variant uppercase mb-xs">Total Fields</p>
              <p className="text-headline-md text-primary font-bold">{TOTAL_SCHEMA_FIELDS}</p>
            </div>
            <div className="bg-secondary-fixed p-md rounded-lg">
              <p className="text-label-md text-on-surface-variant uppercase mb-xs">Required</p>
              <p className="text-headline-md text-secondary font-bold">{DATASET_REQUIRED_FIELDS.length}</p>
            </div>
          </div>

          {/* Required Fields */}
          <div>
            <h3 className="font-headline-sm text-on-surface mb-md flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary">check_circle</span>
              Required Fields ({DATASET_REQUIRED_FIELDS.length})
            </h3>
            <div className="space-y-sm">
              {DATASET_REQUIRED_FIELDS.map((field) => (
                <div key={field.fieldName} className="bg-surface border border-outline-variant rounded p-md">
                  <div className="flex items-start justify-between gap-md">
                    <div className="flex-1">
                      <p className="font-label-md text-on-surface font-mono text-[11px] text-secondary">{field.fieldName}</p>
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

          {/* Optional Fields */}
          <div>
            <h3 className="font-headline-sm text-on-surface mb-md flex items-center gap-sm">
              <span className="material-symbols-outlined text-tertiary">help</span>
              Optional Fields ({DATASET_OPTIONAL_FIELDS.length})
            </h3>
            <div className="space-y-sm">
              {DATASET_OPTIONAL_FIELDS.map((field) => (
                <div key={field.fieldName} className="bg-surface-variant/50 border border-outline-variant rounded p-md opacity-75">
                  <div className="flex items-start justify-between gap-md">
                    <div className="flex-1">
                      <p className="font-label-md text-on-surface font-mono text-[11px] text-tertiary">{field.fieldName}</p>
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

          {/* Footer Note */}
          <div className="bg-surface-container-high border-l-4 border-secondary p-md rounded">
            <p className="text-body-sm text-on-surface">
              <span className="font-semibold">Note:</span> This schema is required for all four dataset sources (DB Kendedes, Dir Pajak, OSS Badan Usaha, OSS Perorangan).
              Actual dataset records are stored securely and not displayed here.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-surface-bright border-t border-outline-variant p-md flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md hover:bg-primary-container transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
