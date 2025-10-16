import { NextRequest } from 'next/server';
import { GET as getBlogPosts } from '@/app/api/blog/route';
import { POST as createBlogPost } from '@/app/api/blog/route';
import { GET as getAnnouncements } from '@/app/api/announcements/route';
import { POST as createAnnouncement } from '@/app/api/announcements/route';
import { POST as upvotePost } from '@/app/api/posts/[postId]/upvote/route';
import { withAuth } from '@/lib/auth-middleware';
import { initAdmin } from '@/lib/firebase-admin';

// Mock dependencies
jest.mock('@/lib/firebase-admin');
jest.mock('@/lib/auth-middleware');
jest.mock('@/lib/blog');
jest.mock('@/lib/announcements');

describe('API Endpoints E2E Tests', () => {
  let mockRequest: NextRequest;
  let mockAuthContext: { userId: string; email: string; isAdmin: boolean };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock request
    mockRequest = {
      json: jest.fn().mockResolvedValue({}),
      headers: new Headers({
        'Authorization': 'Bearer mock-token'
      }),
      nextUrl: new URL('http://localhost:3000/api')
    } as unknown as NextRequest;

    // Mock auth context
    mockAuthContext = {
      userId: 'test-user-123',
      email: 'test@example.com',
      isAdmin: true
    };

    // Mock the auth middleware
    (withAuth as jest.Mock).mockImplementation((_req, handler) => {
      return handler(mockAuthContext);
    });

    // Mock Firestore
    const mockAddDoc = jest.fn().mockResolvedValue({ id: 'new-doc-id' });
    const mockGetDocs = jest.fn().mockResolvedValue({
      empty: false,
      docs: [
        {
          id: 'doc-1',
          data: () => ({
            title: 'Test Document 1',
            content: 'Test content 1',
            createdAt: new Date().toISOString()
          }),
          ref: { id: 'doc-1' }
        },
        {
          id: 'doc-2',
          data: () => ({
            title: 'Test Document 2',
            content: 'Test content 2',
            createdAt: new Date().toISOString()
          }),
          ref: { id: 'doc-2' }
        }
      ]
    });

    // Set up initAdmin mock
    (initAdmin as jest.Mock).mockReturnValue({
      db: {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ title: 'Test' }),
              id: 'test-doc'
            }),
            collection: jest.fn().mockReturnValue({
              doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ exists: true })
              })
            })
          }),
          add: mockAddDoc,
          get: mockGetDocs,
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis()
        }),
        runTransaction: jest.fn().mockImplementation(async (cb) => {
          const transaction = {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ upvotes: 5 })
            }),
            update: jest.fn(),
            delete: jest.fn(),
            set: jest.fn()
          };
          return cb(transaction);
        })
      }
    });
  });

  describe('Blog API', () => {
    it('should fetch blog posts', async () => {
      const request = { url: 'http://localhost:3000/api/blog' } as unknown as NextRequest;
      const response = await getBlogPosts(request);

      // Verify response structure
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData.posts || responseData)).toBe(true);
    });

    it('should create a new blog post when authorized', async () => {
      // Mock request body for creating post
      const newPostData = {
        title: 'New Test Post',
        subtitle: 'Test Subtitle',
        content: 'Test content for new post',
        excerpt: 'Test excerpt',
        tags: ['test']
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(newPostData);

      const response = await createBlogPost(mockRequest);

      // Verify post was created
      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData.id).toBeDefined();
      expect(responseData.title).toBe(newPostData.title);
    });

    it('should reject blog post creation when not authorized', async () => {
      // Set user as non-admin
      mockAuthContext.isAdmin = false;

      const response = await createBlogPost(mockRequest);

      // Should return unauthorized
      expect(response.status).toBe(401);

      const responseData = await response.json();
      expect(responseData.error).toBeDefined();
    });
  });

  describe('Announcements API', () => {
    it('should fetch announcements', async () => {
      // The announcements GET handler doesn't expect an argument
      const response = await getAnnouncements();

      // Verify response
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(Array.isArray(responseData)).toBe(true);
    });

    it('should create a new announcement when authorized', async () => {
      // Mock announcement data
      const announcementData = {
        title: 'New Announcement',
        content: 'This is a test announcement',
        active: true
      };

      (mockRequest.json as jest.Mock).mockResolvedValue(announcementData);

      const response = await createAnnouncement(mockRequest);

      // Verify announcement was created
      expect(response.status).toBe(201);

      const responseData = await response.json();
      expect(responseData.id).toBeDefined();
      expect(responseData.title).toBe(announcementData.title);
    });
  });

  describe('Upvote API', () => {
    let upvoteContext: { params: { postId: string } };

    beforeEach(() => {
      // Mock route params
      upvoteContext = {
        params: { postId: 'test-post-123' }
      };
    });

    it('should upvote a post when user has not upvoted yet', async () => {
      // Mock that upvote doc doesn't exist (not yet upvoted)
      const mockDocGet = jest.fn().mockResolvedValue({ exists: false });

      // Update the mock collection to return the specific behavior for this test
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ upvotes: 5, title: 'Test Post' })
            }),
            collection: jest.fn().mockReturnValue({
              doc: jest.fn().mockReturnValue({
                get: mockDocGet
              })
            })
          })
        }),
        runTransaction: jest.fn().mockImplementation(async (cb) => {
          const transaction = {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ upvotes: 5 })
            }),
            update: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            set: jest.fn()
          };
          return cb(transaction);
        })
      };

      (initAdmin as jest.Mock).mockReturnValueOnce({ db: mockDb });

      const response = await upvotePost(mockRequest, upvoteContext as any);

      // Verify upvote was successful
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.upvoted).toBe(true);
      expect(responseData.upvotes).toBeDefined();
    });

    it('should remove upvote when user has already upvoted', async () => {
      // Mock that upvote doc exists (already upvoted)
      const mockDocGet = jest.fn().mockResolvedValue({ exists: true });

      // Update the mock collection to return the specific behavior for this test
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ upvotes: 5, title: 'Test Post' })
            }),
            collection: jest.fn().mockReturnValue({
              doc: jest.fn().mockReturnValue({
                get: mockDocGet
              })
            })
          })
        }),
        runTransaction: jest.fn().mockImplementation(async (cb) => {
          const transaction = {
            get: jest.fn().mockResolvedValue({
              exists: true,
              data: () => ({ upvotes: 5 })
            }),
            update: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            set: jest.fn()
          };
          return cb(transaction);
        })
      };

      (initAdmin as jest.Mock).mockReturnValueOnce({ db: mockDb });

      const response = await upvotePost(mockRequest, upvoteContext as any);

      // Verify upvote was removed
      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.upvoted).toBe(false);
      expect(responseData.upvotes).toBeDefined();
    });

    it('should return 404 when post does not exist', async () => {
      // Mock post not found
      const mockDb = {
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false }),
            collection: jest.fn().mockReturnValue({
              doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ exists: false })
              })
            })
          })
        })
      };

      (initAdmin as jest.Mock).mockReturnValueOnce({ db: mockDb });

      const response = await upvotePost(mockRequest, upvoteContext as any);

      // Verify not found response
      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData.error).toBe('Post not found');
    });
  });
});
