/**
 * GET /api/datasets
 * Fetch all datasets with pagination and filters
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { getDatabase } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await requireAuth();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const status = searchParams.get('status');
    const datasetType = searchParams.get('datasetType');

    // Validate pagination params
    const validLimit = Math.min(Math.max(1, limit), 100);
    const validPage = Math.max(1, page);
    const offset = (validPage - 1) * validLimit;

    const db = getDatabase();

    // Build conditions array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];

    if (status) {
      conditions.push(eq(datasets.status, status as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    if (datasetType) {
      conditions.push(eq(datasets.datasetType, datasetType));
    }

    // Build and execute query
    const baseQuery = db
      .select({
        id: datasets.id,
        name: datasets.name,
        datasetType: datasets.datasetType,
        originalFileName: datasets.originalFileName,
        status: datasets.status,
        totalRecords: datasets.totalRecords,
        validRecords: datasets.validRecords,
        uploadedBy: datasets.uploadedBy,
        createdAt: datasets.createdAt,
        updatedAt: datasets.updatedAt,
        failureReason: datasets.failureReason,
      })
      .from(datasets);

    let results: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (conditions.length === 0) {
      results = await baseQuery.orderBy(desc(datasets.createdAt)).limit(validLimit).offset(offset);
    } else if (conditions.length === 1) {
      results = await baseQuery.where(conditions[0]).orderBy(desc(datasets.createdAt)).limit(validLimit).offset(offset);
    } else {
      results = await baseQuery
        .where(sql`${sql.join(conditions, sql` AND `)}`)
        .orderBy(desc(datasets.createdAt))
        .limit(validLimit)
        .offset(offset);
    }

    return NextResponse.json(
      {
        success: true,
        data: results,
        pagination: {
          page: validPage,
          limit: validLimit,
          total: results.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get datasets error:', error);

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
      { error: 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}
