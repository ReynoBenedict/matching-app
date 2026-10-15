/**
 * GET /api/matching/runs
 * Daftar proses pencocokan (matching_runs) yang tersimpan, terbaru lebih dulu.
 * Dipakai halaman Hasil Matching dan Penugasan untuk memilih run yang ada,
 * sehingga pengguna tidak perlu menebak threshold yang pernah dipakai.
 *
 * Akses: Superadmin dan Kepala BPS (hanya-baca).
 * Query opsional: datasetAId, datasetBId, limit (bawaan 50, maks 200).
 */

import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { requireAuth, UserRole } from '@/lib/auth/authorization';
import { getDatabase } from '@/lib/db';
import { datasets, matchingRuns } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== UserRole.SUPERADMIN && user.role !== UserRole.KEPALA_BPS) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Superadmin or Kepala BPS access required' },
        { status: 403 }
      );
    }

    const params = request.nextUrl.searchParams;
    const datasetAId = Number(params.get('datasetAId'));
    const datasetBId = Number(params.get('datasetBId'));
    const limit = Math.min(200, Math.max(1, Number(params.get('limit')) || 50));

    // anyOrder=1: pasangan dianggap sama walau urutan Dataset A/B dibalik.
    const anyOrder = params.get('anyOrder') === '1';
    const conditions = [];
    const hasA = Number.isInteger(datasetAId) && datasetAId > 0;
    const hasB = Number.isInteger(datasetBId) && datasetBId > 0;
    if (anyOrder && hasA && hasB) {
      conditions.push(
        or(
          and(eq(matchingRuns.datasetAId, datasetAId), eq(matchingRuns.datasetBId, datasetBId)),
          and(eq(matchingRuns.datasetAId, datasetBId), eq(matchingRuns.datasetBId, datasetAId))
        )!
      );
    } else {
      if (hasA) conditions.push(eq(matchingRuns.datasetAId, datasetAId));
      if (hasB) conditions.push(eq(matchingRuns.datasetBId, datasetBId));
    }

    const db = getDatabase();
    const runs = await db
      .select({
        id: matchingRuns.id,
        datasetAId: matchingRuns.datasetAId,
        datasetBId: matchingRuns.datasetBId,
        threshold: matchingRuns.threshold,
        columnMappings: matchingRuns.columnMappings,
        status: matchingRuns.status,
        totalCandidates: matchingRuns.totalCandidates,
        createdAt: matchingRuns.createdAt,
        completedAt: matchingRuns.completedAt,
      })
      .from(matchingRuns)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(matchingRuns.createdAt))
      .limit(limit);

    const ids = [...new Set(runs.flatMap((r) => [r.datasetAId, r.datasetBId]))];
    const names = new Map(
      ids.length
        ? (await db.select({ id: datasets.id, name: datasets.name }).from(datasets).where(inArray(datasets.id, ids))).map((d) => [d.id, d.name])
        : []
    );

    return NextResponse.json(
      {
        success: true,
        data: runs.map((r) => ({
          id: r.id,
          datasetA: { id: r.datasetAId, name: names.get(r.datasetAId) ?? `Dataset #${r.datasetAId}` },
          datasetB: { id: r.datasetBId, name: names.get(r.datasetBId) ?? `Dataset #${r.datasetBId}` },
          threshold: Number(r.threshold),
          columnMappings: r.columnMappings,
          status: r.status,
          totalCandidates: r.totalCandidates,
          createdAt: r.createdAt.toISOString(),
          completedAt: r.completedAt ? r.completedAt.toISOString() : null,
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.error('List matching runs error:', error);
    return NextResponse.json({ success: false, error: 'Gagal memuat daftar proses pencocokan.' }, { status: 500 });
  }
}
