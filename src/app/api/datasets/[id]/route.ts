/**
 * GET /api/datasets/[id]
 * Fetch dataset detail with preview records
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { getDatabase } from '@/lib/db';
import { datasets, datasetRecords, users } from '@/lib/db/schema';
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

    // Get dataset details
    const [dataset] = await db
      .select({
        id: datasets.id,
        name: datasets.name,
        datasetType: datasets.datasetType,
        originalFileName: datasets.originalFileName,
        source: datasets.source,
        status: datasets.status,
        totalRecords: datasets.totalRecords,
        validRecords: datasets.validRecords,
        uploadedBy: datasets.uploadedBy,
        createdAt: datasets.createdAt,
        updatedAt: datasets.updatedAt,
        failureReason: datasets.failureReason,
      })
      .from(datasets)
      .where(eq(datasets.id, datasetId));

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Get preview records (first 10)
    const previewRecords = await db
      .select()
      .from(datasetRecords)
      .where(eq(datasetRecords.datasetId, datasetId))
      .limit(10);

    // Get uploader info
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

    return NextResponse.json(
      {
        success: true,
        data: {
          ...dataset,
          uploader: uploaderInfo,
          preview: previewRecords,
          previewCount: previewRecords.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get dataset detail error:', error);

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
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}
