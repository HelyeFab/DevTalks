/**
 * Application status endpoint
 * Provides detailed application metrics and status information
 */

import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

interface StatusResponse {
  application: {
    name: string;
    version: string;
    environment: string;
    uptime: number;
    startTime: string;
  };
  system: {
    platform: string;
    nodeVersion: string;
    memory: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    };
    cpu: {
      model: string;
      cores: number;
    };
  };
  services: {
    database: {
      status: 'connected' | 'disconnected';
      type: string;
    };
    firebase: {
      status: 'available' | 'unavailable';
      projectId?: string;
    };
  };
  metrics: {
    timestamp: string;
    requests?: number;
    errors?: number;
  };
}

// Simple in-memory metrics (in production, use Redis or similar)
const metrics = {
  requests: 0,
  errors: 0,
  startTime: new Date(),
};

/**
 * GET /api/status
 * Detailed application status
 */
export async function GET() {
  try {
    // Check services
    const services = await checkServices();

    // Get system info
    const systemInfo = getSystemInfo();

    const response: StatusResponse = {
      application: {
        name: 'DevTalks',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        startTime: metrics.startTime.toISOString(),
      },
      system: systemInfo,
      services,
      metrics: {
        timestamp: new Date().toISOString(),
        requests: metrics.requests,
        errors: metrics.errors,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to retrieve status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Check all external services
 */
async function checkServices() {
  const { db, isAvailable } = initAdmin();

  // Check database
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    if (isAvailable) {
      // Try to perform a simple operation
      const healthRef = db.collection('health_check');
      if (typeof healthRef.limit === 'function') {
        await healthRef.limit(1).get();
      }
      dbStatus = 'connected';
    } else {
      // Mock DB is available in development
      dbStatus = process.env.NODE_ENV === 'development' ? 'connected' : 'disconnected';
    }
  } catch (error) {
    console.error('Database check failed:', error);
  }

  return {
    database: {
      status: dbStatus,
      type: isAvailable ? 'firestore' : 'mock',
    },
    firebase: {
      status: isAvailable ? ('available' as const) : ('unavailable' as const),
      projectId: process.env.FIREBASE_PROJECT_ID,
    },
  };
}

/**
 * Get system information
 */
function getSystemInfo() {
  const memUsage = process.memoryUsage();
  const totalMemory = memUsage.heapTotal;
  const usedMemory = memUsage.heapUsed;

  return {
    platform: process.platform,
    nodeVersion: process.version,
    memory: {
      total: Math.round(totalMemory / 1024 / 1024), // MB
      used: Math.round(usedMemory / 1024 / 1024), // MB
      free: Math.round((totalMemory - usedMemory) / 1024 / 1024), // MB
      percentage: Math.round((usedMemory / totalMemory) * 100 * 100) / 100,
    },
    cpu: {
      model: process.env.CPU_MODEL || 'Unknown',
      cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1,
    },
  };
}

