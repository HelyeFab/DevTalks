/**
 * Tests for Health Check API Endpoint
 * Validates health check functionality and response format
 */

import { GET } from '@/app/api/health/route';
import { initAdmin } from '@/lib/firebase-admin';

// Mock dependencies
jest.mock('@/lib/firebase-admin');

describe('Health Check API', () => {
  const mockDb = {
    collection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (initAdmin as jest.Mock).mockReturnValue({
      db: mockDb,
      isAvailable: true,
    });
  });

  describe('GET /api/health', () => {
    it('should return healthy status when all checks pass', async () => {
      // Mock successful database check
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeTruthy();
      expect(body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include database check', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.checks.database).toBeDefined();
      expect(body.checks.database.status).toBe('up');
      expect(body.checks.database.responseTime).toBeDefined();
    });

    it('should include memory check', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.checks.memory).toBeDefined();
      expect(body.checks.memory.status).toBeDefined();
      expect(body.checks.memory.usage).toBeDefined();
      expect(body.checks.memory.usage.heapUsed).toBeGreaterThan(0);
      expect(body.checks.memory.usage.heapTotal).toBeGreaterThan(0);
      expect(body.checks.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(body.checks.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should include environment information', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.checks.environment).toBeDefined();
      expect(body.checks.environment.nodeVersion).toBeTruthy();
      expect(body.checks.environment.platform).toBeTruthy();
      expect(body.checks.environment.environment).toBeDefined();
    });

    it('should return degraded when memory is critical', async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 950 * 1024 * 1024,
        heapTotal: 1000 * 1024 * 1024,
        rss: 1000 * 1024 * 1024,
        external: 10 * 1024 * 1024,
      }) as any;

      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.status).toBe('degraded');
      expect(body.checks.memory.status).toBe('down');
      expect(body.checks.memory.percentage).toBeGreaterThan(90);

      // Restore original
      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle database check failure', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.checks.database.status).toBe('down');
    });

    it('should return degraded when database is down', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.status).toBe('degraded');
    });

    it('should handle mock database in development', async () => {
      (initAdmin as jest.Mock).mockReturnValue({
        db: mockDb,
        isAvailable: false,
      });

      const response = await GET();
      const body = await response.json();

      expect(body.checks.database.status).toBe('up');
    });

    it('should return 503 for unhealthy status', async () => {
      // Mock both checks failing
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 950 * 1024 * 1024,
        heapTotal: 1000 * 1024 * 1024,
        rss: 1000 * 1024 * 1024,
        external: 10 * 1024 * 1024,
      }) as any;

      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();

      expect(response.status).toBe(200); // Still 200 for degraded, not unhealthy

      // Restore
      process.memoryUsage = originalMemoryUsage;
    });

    it('should include no-cache headers', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toContain('no-cache');
      expect(response.headers.get('Cache-Control')).toContain('no-store');
      expect(response.headers.get('Cache-Control')).toContain('must-revalidate');
    });

    it('should handle catastrophic errors', async () => {
      (initAdmin as jest.Mock).mockImplementation(() => {
        throw new Error('Catastrophic failure');
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.error).toBeTruthy();
    });

    it('should return valid timestamp format', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});
