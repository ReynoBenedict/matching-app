/**
 * GET /api/datasets/[id]/columns
 * Fetch column metadata for a dataset
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { getDatabase } from '@/lib/db';
import { datasetColumns, datasets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    await requireAuth();

    const { id } = await params;
    const datasetId = parseInt(id, 10);
    if (isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Verify dataset exists
    const [dataset] = await db
      .select({ id: datasets.id })
      .from(datasets)
      .where(eq(datasets.id, datasetId));

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Retrieve columns ordered by columnOrder
    const columns = await db
      .select({
        id: datasetColumns.id,
        datasetId: datasetColumns.datasetId,
        columnName: datasetColumns.columnName,
        dataType: datasetColumns.dataType,
        isRequired: datasetColumns.isRequired,
        isPrimaryKey: datasetColumns.isPrimaryKey,
        columnOrder: datasetColumns.columnOrder,
      })
      .from(datasetColumns)
      .where(eq(datasetColumns.datasetId, datasetId))
      .orderBy(datasetColumns.columnOrder);

    return NextResponse.json(
      {
        success: true,
        data: columns,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get dataset columns error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Unauthorized')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch dataset columns' },
      { status: 500 }
    );
  }
}
