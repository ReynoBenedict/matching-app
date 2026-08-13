/**
 * POST /api/datasets/upload
 * Authenticated endpoint for uploading CSV datasets
 * Requires authentication and authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/authorization';
import { uploadDataset } from '@/lib/services/dataset-upload';
import { UPLOAD_CONFIG } from '@/lib/config/upload';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const datasetType = formData.get('datasetType') as string | null;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!datasetType) {
      return NextResponse.json(
        { error: 'Dataset type is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds limit of ${UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 413 }
      );
    }

    // Validate file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (
      !fileExtension ||
      !UPLOAD_CONFIG.SUPPORTED_EXTENSIONS.includes(fileExtension)
    ) {
      return NextResponse.json(
        {
          error: `Unsupported file type. Supported types: ${UPLOAD_CONFIG.SUPPORTED_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate MIME type (secondary check)
    if (
      file.type &&
      !UPLOAD_CONFIG.SUPPORTED_MIME_TYPES.includes(file.type)
    ) {
      return NextResponse.json(
        { error: 'Invalid file MIME type' },
        { status: 400 }
      );
    }

    // Validate dataset type
    if (
      !UPLOAD_CONFIG.SUPPORTED_DATASET_TYPES.includes(
        datasetType.toUpperCase()
      )
    ) {
      return NextResponse.json(
        {
          error: `Unsupported dataset type. Supported types: ${UPLOAD_CONFIG.SUPPORTED_DATASET_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Read file content as text
    const fileContent = await file.text();

    // Validate that file is actually readable as text
    if (!fileContent) {
      return NextResponse.json(
        { error: 'File is empty or cannot be read' },
        { status: 400 }
      );
    }

    // Process the upload through the service layer
    const uploadResult = await uploadDataset(
      fileContent,
      file.name.replace(/\.[^/.]+$/, ''), // Remove extension for dataset name
      datasetType.toUpperCase(),
      file.name,
      user.id
    );

    // Record audit log
    await recordAuditLog({
      userId: user.id,
      action: uploadResult.success ? 'DATASET_UPLOADED' : 'DATASET_UPLOAD_FAILED',
      entityType: 'dataset',
      entityId: uploadResult.datasetId,
      metadata: {
        fileName: file.name,
        datasetType,
        success: uploadResult.success,
        totalRecords: uploadResult.totalRecords,
        validRecords: uploadResult.validRecords,
        errorCount: uploadResult.errors?.length || 0,
      },
    });

    // Return appropriate response
    if (!uploadResult.success) {
      // Return errors but not the entire dataset
      const response = {
        success: false,
        datasetId: uploadResult.datasetId,
        status: uploadResult.status,
        message: uploadResult.message,
        errorCount: uploadResult.errors?.length || 0,
      };

      // Only include first few errors for debugging, not all
      if (uploadResult.errors && uploadResult.errors.length > 0) {
        const errorResponse = response as typeof response & { errors: unknown[] };
        errorResponse.errors = uploadResult.errors.slice(0, 10).map((e) => ({
          type: e.type,
          message: e.message,
          rowNumber: e.rowNumber,
          columnName: e.columnName,
        }));
      }

      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        datasetId: uploadResult.datasetId,
        status: uploadResult.status,
        totalRecords: uploadResult.totalRecords,
        validRecords: uploadResult.validRecords,
        message: uploadResult.message,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Dataset upload error:', error);

    // Handle authentication errors
    if (
      error instanceof Error &&
      error.message.includes('Unauthorized')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes('Forbidden')
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Generic error response - do not expose stack traces or internals
    return NextResponse.json(
      { error: 'Failed to upload dataset' },
      { status: 500 }
    );
  }
}
