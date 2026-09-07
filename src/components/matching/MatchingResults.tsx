'use client';

import { useState } from 'react';

interface FieldScore {
  columnA: string;
  columnB: string;
  score: number;
}

interface CandidatePair {
  recordAId: number;
  recordBId: number;
  idsbrA: string;
  idsbrB: string;
  fieldScores: FieldScore[];
  overallScore: number;
}

interface MatchingResultsProps {
  results: {
    datasetA: { id: number; name: string };
    datasetB: { id: number; name: string };
    config: {
      columnMappings: Array<{ columnA: string; columnB: string }>;
      threshold: number;
    };
    summary: {
      totalCandidates: number;
    };
    candidates: CandidatePair[];
  };
}

export function MatchingResults({ results }: MatchingResultsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedRows(newSet);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-100';
    if (score >= 0.7) return 'bg-amber-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="bg-surface border border-outline-variant rounded-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-on-surface-variant">Dataset Pertama</p>
            <p className="font-semibold text-on-surface mt-1">{results.datasetA.name}</p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant">Dataset Kedua</p>
            <p className="font-semibold text-on-surface mt-1">{results.datasetB.name}</p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant">Threshold</p>
            <p className="font-semibold text-on-surface mt-1">
              {Math.round(results.config.threshold * 100)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-on-surface-variant">Pasangan Cocok</p>
            <p className="font-semibold text-primary text-lg mt-1">
              {results.summary.totalCandidates}
            </p>
          </div>
        </div>
      </div>

      {/* No results */}
      {results.summary.totalCandidates === 0 ? (
        <div className="bg-surface-container-low p-8 rounded-lg border border-outline-variant text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-2 block">
            info
          </span>
          <p className="text-on-surface-variant">
            Tidak ada pasangan yang memenuhi threshold {Math.round(results.config.threshold * 100)}%
          </p>
        </div>
      ) : (
        <>
          {/* Results Table */}
          <div className="border border-outline-variant rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">
                      IDSBR Dataset A
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-on-surface">
                      IDSBR Dataset B
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-on-surface">
                      Nilai Kesamaan
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-on-surface">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.candidates.map((candidate, idx) => (
                    <>
                      <tr
                        key={`row-${idx}`}
                        className="border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-on-surface font-mono">
                          {candidate.idsbrA}
                        </td>
                        <td className="px-4 py-3 text-sm text-on-surface font-mono">
                          {candidate.idsbrB}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${getScoreBgColor(
                              candidate.overallScore
                            )} ${getScoreColor(candidate.overallScore)}`}
                          >
                            {(candidate.overallScore * 100).toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleExpanded(idx)}
                            className="text-primary hover:text-primary-container transition-colors"
                          >
                            <span className="material-symbols-outlined">
                              {expandedRows.has(idx) ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedRows.has(idx) && (
                        <tr key={`details-${idx}`} className="bg-surface-container-low">
                          <td colSpan={4} className="px-4 py-4">
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-on-surface mb-3">
                                Detail Kesamaan per Kolom
                              </p>
                              <div className="grid gap-2">
                                {candidate.fieldScores.map((fieldScore, fIdx) => (
                                  <div
                                    key={fIdx}
                                    className="flex justify-between items-center p-2 bg-surface rounded border border-outline-variant"
                                  >
                                    <div className="text-xs text-on-surface-variant">
                                      <span className="font-mono">{fieldScore.columnA}</span>
                                      <span className="mx-2 text-on-surface-variant">↔</span>
                                      <span className="font-mono">{fieldScore.columnB}</span>
                                    </div>
                                    <div
                                      className={`px-2 py-1 rounded text-xs font-semibold ${getScoreBgColor(
                                        fieldScore.score
                                      )} ${getScoreColor(fieldScore.score)}`}
                                    >
                                      {(fieldScore.score * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results summary */}
          <div className="bg-secondary-container text-on-secondary-container p-4 rounded-lg">
            <p className="text-sm">
              Ditemukan <span className="font-semibold">{results.summary.totalCandidates}</span>{' '}
              pasangan record dengan nilai kesamaan ≥ {Math.round(results.config.threshold * 100)}%
            </p>
          </div>
        </>
      )}
    </div>
  );
}
