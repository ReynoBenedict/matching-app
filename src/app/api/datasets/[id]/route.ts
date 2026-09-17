/**
 * GET  /api/datasets/[id]    - dataset detail
 * DELETE /api/datasets/[id] - permanently delete a dataset and its dependent data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireSuperadmin } from '@/lib/auth/authorization';
import { getDatabase } from '@/lib/db';
import {
  datasets,
  datasetColumns,
  datasetRecords,
  matchingCandidates,
  matchingRuns,
  users,
} from '@/lib/db/schema';
import { eq, inArray, or } from 'drizzle-orm';
import { recordAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const datasetId = parseInt(id, 10);
    if (isNaN(datasetId)) {
      return NextResponse.json({ error: 'Invalid dataset ID' }, { status: 400 });
    }

    const db = getDatabase();
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, datasetId));
    if (!dataset) return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });

    const previewRecords = await db
      .select()
      .from(datasetRecords)
      .where(eq(datasetRecords.datasetId, datasetId))
      .limit(10);

    let uploaderInfo = null;
    if (dataset.uploadedBy) {
      const [uploader] = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          username: users.username,
        })
        .from(users)
        .where(eq(users.id, dataset.uploadedBy));
      uploaderInfo = uploader || null;
    }

    return NextResponse.json({
      success: true,
      data: { ...dataset, uploader: uploaderInfo, preview: previewRecords, previewCount: previewRecords.length },
    });
  } catch (error) {
    console.error('Get dataset detail error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperadmin();
    const { id } = await params;
    const datasetId = parseInt(id, 10);
    if (isNaN(datasetId)) {
      return NextResponse.json({ success: false, error: 'Invalid dataset ID' }, { status: 400 });
    }

    const db = getDatabase();
    const [dataset] = await db
      .select({ id: datasets.id, name: datasets.name })
      .from(datasets)
      .where(eq(datasets.id, datasetId));

    if (!dataset) {
      return NextResponse.json({ success: false, error: 'Dataset tidak ditemukan.' }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // matching_runs did not historically have a dataset FK, so explicitly
      // remove its candidates/runs before deleting the dataset. New schemas
      // also have cascade FKs as a second line of protection.
      const runs = await tx
        .select({ id: matchingRuns.id })
        .from(matchingRuns)
        .where(or(eq(matchingRuns.datasetAId, datasetId), eq(matchingRuns.datasetBId, datasetId)));
      const runIds = runs.map((run) => run.id);

      if (runIds.length > 0) {
        await tx.delete(matchingCandidates).where(inArray(matchingCandidates.matchingRunId, runIds));
        await tx.delete(matchingRuns).where(inArray(matchingRuns.id, runIds));
      }

      // dataset_records -> assignments/matching_candidates and
      // dataset_columns -> dataset are configured with ON DELETE CASCADE.
      await tx.delete(datasets).where(eq(datasets.id, datasetId));
    });

    await recordAuditLog({
      userId: user.id,
      action: 'DELETE_DATASET',
      entityType: 'DATASET',
      entityId: datasetId,
      metadata: { datasetName: dataset.name },
    });

    console.info(`Dataset ${datasetId} deleted by user ${user.id}`);
    return NextResponse.json({
      success: true,
      message: `Dataset "${dataset.name}" berhasil dihapus permanen.`,
      datasetId,
    });
  } catch (error) {
    console.error('Delete dataset error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: 'Dataset gagal dihapus.' }, { status: 500 });
  }
}
