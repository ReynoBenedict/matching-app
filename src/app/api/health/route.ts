import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    const dbStatus = await checkDatabaseConnection();
    
    // Prepare health check response
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      phase: 'Phase 1 - Foundation',
      services: {
        database: dbStatus,
        modelService: {
          status: 'not_implemented',
          note: 'Model service will be implemented in later phases'
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        databaseConfigured: !!process.env.DATABASE_URL,
        modelServiceConfigured: !!process.env.MODEL_SERVICE_URL
      }
    };

    // Return success response
    return NextResponse.json(health, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    // Return error response
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      phase: 'Phase 1 - Foundation'
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}