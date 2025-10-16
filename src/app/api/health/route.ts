/**
 * Health check endpoint
 * Returns basic health status of the application
 */

import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    memory: {
      status: 'up' | 'down';
      usage: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
        external: number;
      };
      percentage: number;
    };
    environment: {
      nodeVersion: string;
      platform: string;
      environment: string;
    };
  };
}

/**
 * GET /api/health
 * Basic health check endpoint
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    const dbCheck = await checkDatabase();

    // Check memory usage
    const memoryCheck = checkMemory();

    // Calculate overall status
    const status = calculateOverallStatus([
      dbCheck.status === 'up',
      memoryCheck.status === 'up',
    ]);

    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbCheck,
        memory: memoryCheck,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV || 'development',
        },
      },
    };

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    return NextResponse.json(result, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{
  status: 'up' | 'down';
  responseTime?: number;
}> {
  const startTime = Date.now();

  try {
    const { db, isAvailable } = initAdmin();

    if (!isAvailable) {
      // In development mode with mock DB
      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    }

    // Try to perform a simple operation
    // Note: Mock DB doesn't support limit, so we just check collection access
    const healthRef = db.collection('health_check');
    if (typeof healthRef.limit === 'function') {
      await healthRef.limit(1).get();
    }

    return {
      status: 'up',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): {
  status: 'up' | 'down';
  usage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  percentage: number;
} {
  const memUsage = process.memoryUsage();
  const percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  return {
    status: percentage < 90 ? 'up' : 'down',
    usage: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    },
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Calculate overall health status
 */
function calculateOverallStatus(checks: boolean[]): 'healthy' | 'degraded' | 'unhealthy' {
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c).length;

  if (passedChecks === totalChecks) {
    return 'healthy';
  } else if (passedChecks > 0) {
    return 'degraded';
  } else {
    return 'unhealthy';
  }
}
