/**
 * Tests for Status API Endpoint
 * Validates application status reporting
 */

import { GET } from '@/app/api/status/route';
import { initAdmin } from '@/lib/firebase-admin';

// Mock dependencies
jest.mock('@/lib/firebase-admin');

describe('Status API', () => {
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

  describe('GET /api/status', () => {
    it('should return application status', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.application).toBeDefined();
      expect(body.system).toBeDefined();
      expect(body.services).toBeDefined();
      expect(body.metrics).toBeDefined();
    });

    it('should include application information', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.application.name).toBe('DevTalks');
      expect(body.application.version).toBeTruthy();
      expect(body.application.environment).toBeDefined();
      expect(body.application.uptime).toBeGreaterThanOrEqual(0);
      expect(body.application.startTime).toBeTruthy();
    });

    it('should include system information', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.system.platform).toBeTruthy();
      expect(body.system.nodeVersion).toBeTruthy();
      expect(body.system.memory).toBeDefined();
      expect(body.system.memory.total).toBeGreaterThan(0);
      expect(body.system.memory.used).toBeGreaterThan(0);
      expect(body.system.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(body.system.cpu).toBeDefined();
    });

    it('should include services status', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.services.database).toBeDefined();
      expect(body.services.database.status).toBe('connected');
      expect(body.services.database.type).toBeTruthy();
      expect(body.services.firebase).toBeDefined();
      expect(body.services.firebase.status).toBe('available');
    });

    it('should include metrics', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.metrics.timestamp).toBeTruthy();
      expect(body.metrics.requests).toBeDefined();
      expect(body.metrics.errors).toBeDefined();
    });

    it('should show disconnected database when unavailable', async () => {
      (initAdmin as jest.Mock).mockReturnValue({
        db: mockDb,
        isAvailable: false,
      });

      const response = await GET();
      const body = await response.json();

      expect(body.services.database.type).toBe('mock');
      expect(body.services.firebase.status).toBe('unavailable');
    });

    it('should handle database check errors gracefully', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error('Connection failed')),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      expect(body.services.database.status).toBe('disconnected');
    });

    it('should include no-cache headers', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();

      expect(response.headers.get('Cache-Control')).toContain('no-cache');
    });

    it('should handle catastrophic errors', async () => {
      (initAdmin as jest.Mock).mockImplementation(() => {
        throw new Error('Fatal error');
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBeTruthy();
    });

    it('should calculate memory percentage correctly', async () => {
      const mockHealthRef = {
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ empty: true }),
      };
      mockDb.collection.mockReturnValue(mockHealthRef);

      const response = await GET();
      const body = await response.json();

      const { used, total, percentage } = body.system.memory;
      const calculatedPercentage = Math.round((used / total) * 100 * 100) / 100;

      expect(Math.abs(percentage - calculatedPercentage)).toBeLessThan(1);
    });
  });
});
