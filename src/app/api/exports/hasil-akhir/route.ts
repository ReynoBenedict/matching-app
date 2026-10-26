/**
 * GET /api/exports/hasil-akhir?verification=ALL|MATCH|NON_MATCH|REVIEW|UNVERIFIED
 * Ekspor hasil akhir verifikasi kandidat ke berkas CSV (SRS SMD-F-07-02 dan SMD-F-13-02).
 *
 * Akses: Superadmin dan Kepala BPS. Baris diambil per halaman dari layanan hasil
 * akhir yang sama dengan halaman Hasil Akhir, sehingga isi ekspor identik dengan
 * yang ditampilkan di layar. Setiap ekspor dicatat ke log audit.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, UserRole } from '@/lib/auth/authorization';
import { getFinalResults, type VerificationFilter } from '@/lib/services/final-results';
import { recordAuditLog } from '@/lib/audit';

const FILTERS: VerificationFilter[] = ['ALL', 'MATCH', 'NON_MATCH', 'REVIEW', 'UNVERIFIED'];
const PAGE = 100;
const MAX_ROWS = 200_000;
// Excel dengan pengaturan regional Indonesia memakai ';' sebagai pemisah kolom dan
// ',' sebagai pemisah desimal; dengan koma, seluruh baris masuk ke kolom A.
const DELIMITER = ';';

const jakartaTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function formatScore(value: string | number): string {
  const score = Number(value);
  return Number.isFinite(score) ? score.toFixed(4).replace('.', ',') : '';
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.KEPALA_BPS) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const raw = (request.nextUrl.searchParams.get('verification') || 'ALL').toUpperCase();
    const verification = (FILTERS.includes(raw as VerificationFilter) ? raw : 'ALL') as VerificationFilter;

    const header = [
      'assignment_id', 'dataset_a', 'idsbr_a', 'nama_usaha_a', 'dataset_b', 'idsbr_b', 'nama_usaha_b',
      'similarity_score', 'status_penugasan', 'hasil_verifikasi', 'waktu_verifikasi', 'petugas',
    ];
    const lines: string[] = [header.join(DELIMITER)];

    let page = 1;
    let exported = 0;
    for (;;) {
      const data = await getFinalResults({ page, limit: PAGE, verification });
      for (const row of data.rows) {
        lines.push([
          row.assignmentId,
          row.recordA?.datasetName ?? '',
          row.recordA?.idsbr ?? '',
          row.recordA?.namaUsaha ?? '',
          row.recordB?.datasetName ?? '',
          row.recordB?.idsbr ?? '',
          row.recordB?.namaUsaha ?? '',
          formatScore(row.similarityScore),
          row.status,
          row.verificationResult ?? '',
          row.verifiedAt ? `${jakartaTime.format(new Date(row.verifiedAt))} WIB` : '',
          row.employee?.fullName ?? '',
        ].map(csvCell).join(DELIMITER));
        exported += 1;
      }
      if (page >= data.pagination.totalPages || data.rows.length === 0 || exported >= MAX_ROWS) break;
      page += 1;
    }

    await recordAuditLog({
      userId: user.id,
      action: 'EXPORT_RESULTS',
      entityType: 'assignment',
      metadata: { verification, rows: exported, format: 'csv' },
    });

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    // BOM agar Excel membaca UTF-8 dengan benar
    return new NextResponse('﻿' + lines.join('\r\n') + '\r\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="hasil-akhir-${verification.toLowerCase()}-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Export hasil akhir error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengekspor hasil akhir.' }, { status: 500 });
  }
}
