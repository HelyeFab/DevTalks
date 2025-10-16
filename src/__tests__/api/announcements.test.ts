import { NextRequest, NextResponse } from 'next/server';
import * as announcementRoutes from '@/app/api/announcements/route';
import { initAdmin } from '@/lib/firebase-admin';
import { withAuth } from '@/lib/auth-middleware';

// Mock dependencies
jest.mock('@/lib/firebase-admin');
jest.mock('@/lib/auth-middleware');

describe('Announcements API', () => {
  let mockRequest: NextRequest;
  let mockAuthContext: { userId: string; email: string; isAdmin: boolean };

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Mock fetch request
    mockRequest = {
      json: jest.fn(),
      headers: new Headers(),
      nextUrl: new URL('http://localhost:3000/api/announcements')
    } as unknown as NextRequest;

    // Mock auth context
    mockAuthContext = {
      userId: 'test-user-123',
      email: 'admin@example.com',
      isAdmin: true
    };

    // Mock the withAuth middleware to pass the auth context
    (withAuth as jest.Mock).mockImplementation((_req, handler) => {
      return handler(mockAuthContext);
    });

    // Mock Firestore
    const mockAdd = jest.fn().mockResolvedValue({ id: 'new-announcement-id' });
    const mockGet = jest.fn().mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'announcement-1',
          data: () => ({
            title: 'Test Announcement 1',
            content: 'Test content 1',
            createdAt: new Date().toISOString(),
            active: true
          }),
          ref: { id: 'announcement-1' }
        },
        {
          id: 'announcement-2',
          data: () => ({
            title: 'Test Announcement 2',
            content: 'Test content 2',
            createdAt: new Date().toISOString(),
            active: false
          }),
          ref: { id: 'announcement-2' }
        }
      ]
    });
    const mockOrderBy = jest.fn().mockReturnThis();
    const mockWhere = jest.fn().mockReturnThis();

    // Set up initAdmin mock
    (initAdmin as jest.Mock).mockReturnValue({
      db: {
        collection: jest.fn().mockReturnValue({
          add: mockAdd,
          get: mockGet,
          orderBy: mockOrderBy,
          where: mockWhere
        })
      }
    });
  });

  describe('GET /api/announcements', () => {
    it('should return announcements with proper formatting', async () => {
      // Call the handler
      const response = await announcementRoutes.GET();

      // Check response format
      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      // Parse response JSON
      const data = await response.json();

      // Check data structure
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toHaveProperty('id', 'announcement-1');
      expect(data[0]).toHaveProperty('title', 'Test Announcement 1');
      expect(data[0]).toHaveProperty('content', 'Test content 1');
      expect(data[0]).toHaveProperty('active', true);
      expect(data[0]).toHaveProperty('createdAt');
    });

    it('should handle Firestore errors gracefully', async () => {
      // Mock Firestore error
      (initAdmin as jest.Mock).mockReturnValue({
        db: {
          collection: jest.fn().mockReturnValue({
            get: jest.fn().mockRejectedValue(new Error('Database connection error'))
          })
        }
      });

      // Call the handler
      const response = await announcementRoutes.GET();

      // Check error response
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/announcements', () => {
    it('should create a new announcement when authorized', async () => {
      // Mock request body
      const mockAnnouncementData = {
        title: 'New Announcement',
        content: 'New announcement content',
        active: true
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(mockAnnouncementData);

      // Call the handler
      const response = await announcementRoutes.POST(mockRequest);

      // Check response
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id', 'new-announcement-id');
      expect(data).toHaveProperty('title', 'New Announcement');
    });

    it('should reject creation when user is not an admin', async () => {
      // Set user as non-admin
      mockAuthContext.isAdmin = false;

      // Mock request body
      (mockRequest.json as jest.Mock).mockResolvedValue({
        title: 'New Announcement',
        content: 'New announcement content'
      });

      // Call the handler
      const response = await announcementRoutes.POST(mockRequest);

      // Check error response
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Not authorized');
    });

    it('should validate required fields', async () => {
      // Mock invalid request body (missing required content)
      (mockRequest.json as jest.Mock).mockResolvedValue({
        title: 'New Announcement'
        // missing content field
      });

      // Call the handler
      const response = await announcementRoutes.POST(mockRequest);

      // Check validation error response
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('content is required');
    });

    it('should handle Firestore errors during creation', async () => {
      // Mock request body
      (mockRequest.json as jest.Mock).mockResolvedValue({
        title: 'New Announcement',
        content: 'New announcement content',
        active: true
      });

      // Mock Firestore error
      (initAdmin as jest.Mock).mockReturnValue({
        db: {
          collection: jest.fn().mockReturnValue({
            add: jest.fn().mockRejectedValue(new Error('Database write error'))
          })
        }
      });

      // Call the handler
      const response = await announcementRoutes.POST(mockRequest);

      // Check error response
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to create announcement');
    });
  });
});
