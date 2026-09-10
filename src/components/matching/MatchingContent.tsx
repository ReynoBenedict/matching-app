'use client';

import { useState } from 'react';
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';
import { DatasetSelector } from '@/components/matching/DatasetSelector';
import { ColumnMapper } from '@/components/matching/ColumnMapper';
import { ThresholdSelector } from '@/components/matching/ThresholdSelector';
import { MatchingResults } from '@/components/matching/MatchingResults';

export interface MatchingState {
  datasetAId: number | null;
  datasetBId: number | null;
  columnMappings: Array<{ columnA: string; columnB: string }>;
  threshold: number;
  loading: boolean;
  error: string | null;
  results: any | null;
  step: 'dataset-a' | 'dataset-b' | 'column-mapping' | 'threshold' | 'results';
}

export function MatchingContent() {
  const [state, setState] = useState<MatchingState>({
    datasetAId: null,
    datasetBId: null,
    columnMappings: [],
    threshold: 0.7,
    loading: false,
    error: null,
    results: null,
    step: 'dataset-a',
  });

  const handleSelectDatasetA = (datasetId: number) => {
    setState((prev) => ({
      ...prev,
      datasetAId: datasetId,
      step: 'dataset-b',
      columnMappings: [],
      error: null,
    }));
  };

  const handleSelectDatasetB = (datasetId: number) => {
    setState((prev) => ({
      ...prev,
      datasetBId: datasetId,
      step: 'column-mapping',
      error: null,
    }));
  };

  const handleUpdateMappings = (
    mappings: Array<{ columnA: string; columnB: string }>
  ) => {
    setState((prev) => ({
      ...prev,
      columnMappings: mappings,
    }));
  };

  const handleProceedToThreshold = () => {
    if (state.columnMappings.length === 0) {
      setState((prev) => ({
        ...prev,
        error: 'At least one column mapping is required',
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      step: 'threshold',
      error: null,
    }));
  };

  const handleThresholdChange = (threshold: number) => {
    setState((prev) => ({
      ...prev,
      threshold,
    }));
  };

  const handleRunMatching = async () => {
    if (!state.datasetAId || !state.datasetBId || state.columnMappings.length === 0) {
      setState((prev) => ({
        ...prev,
        error: 'Missing configuration for matching',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetAId: state.datasetAId,
          datasetBId: state.datasetBId,
          columnMappings: state.columnMappings,
          threshold: state.threshold,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: data.error || 'Failed to run matching',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        results: data.data,
        step: 'results',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to run matching: ' + (error instanceof Error ? error.message : 'Unknown error'),
      }));
    }
  };

  const handleReset = () => {
    setState({
      datasetAId: null,
      datasetBId: null,
      columnMappings: [],
      threshold: 0.7,
      loading: false,
      error: null,
      results: null,
      step: 'dataset-a',
    });
  };

  return (
    <SuperadminLayout pageTitle="Pencocokan Data">
      <div className="space-y-6">
        {/* Error message */}
        {state.error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error">
            <p className="font-semibold">Kesalahan:</p>
            <p className="text-sm mt-1">{state.error}</p>
          </div>
        )}

        {/* Step 1: Select Dataset A */}
        {state.step === 'dataset-a' && (
          <DatasetSelector
            title="Langkah 1: Pilih Dataset Pertama"
            selectedId={state.datasetAId}
            onSelect={handleSelectDatasetA}
            loading={state.loading}
          />
        )}

        {/* Step 2: Select Dataset B */}
        {state.step === 'dataset-b' && (
          <>
            <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
              <p className="text-sm font-semibold text-on-surface">Dataset Pertama</p>
              <p className="text-sm text-on-surface-variant mt-1">ID: {state.datasetAId}</p>
            </div>
            <DatasetSelector
              title="Langkah 2: Pilih Dataset Kedua"
              selectedId={state.datasetBId}
              excludeId={state.datasetAId}
              onSelect={handleSelectDatasetB}
              loading={state.loading}
            />
          </>
        )}

        {/* Step 3: Column Mapping */}
        {state.step === 'column-mapping' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                <p className="text-sm font-semibold text-on-surface">Dataset Pertama</p>
                <p className="text-sm text-on-surface-variant mt-1">ID: {state.datasetAId}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                <p className="text-sm font-semibold text-on-surface">Dataset Kedua</p>
                <p className="text-sm text-on-surface-variant mt-1">ID: {state.datasetBId}</p>
              </div>
            </div>
            <ColumnMapper
              datasetAId={state.datasetAId!}
              datasetBId={state.datasetBId!}
              mappings={state.columnMappings}
              onUpdateMappings={handleUpdateMappings}
            />
            <button
              onClick={handleProceedToThreshold}
              disabled={state.columnMappings.length === 0 || state.loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Lanjut ke Konfigurasi Threshold
            </button>
          </>
        )}

        {/* Step 4: Threshold */}
        {state.step === 'threshold' && (
          <>
            <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant">
              <h3 className="font-headline-sm text-primary mb-4">Konfigurasi Pencocokan</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-on-surface mb-2">Kolom yang dipetakan:</p>
                  <ul className="space-y-1">
                    {state.columnMappings.map((mapping, idx) => (
                      <li key={idx} className="text-sm text-on-surface-variant">
                        {mapping.columnA} ↔ {mapping.columnB}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <ThresholdSelector
              threshold={state.threshold}
              onThresholdChange={handleThresholdChange}
            />
            <button
              onClick={handleRunMatching}
              disabled={state.loading}
              className="w-full bg-secondary text-on-secondary py-3 rounded-lg font-label-md hover:bg-secondary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {state.loading ? 'Memproses...' : 'Jalankan Pencocokan'}
            </button>
          </>
        )}

        {/* Step 5: Results */}
        {state.step === 'results' && state.results && (
          <>
            <MatchingResults results={state.results} />
            <button
              onClick={handleReset}
              className="w-full bg-tertiary text-on-tertiary py-3 rounded-lg font-label-md hover:bg-tertiary-container transition-colors"
            >
              Mulai Pencocokan Baru
            </button>
          </>
        )}
      </div>
    </SuperadminLayout>
  );
}
