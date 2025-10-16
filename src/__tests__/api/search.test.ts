/**
 * Tests for Search API Endpoint
 * Validates search functionality across content types
 */

import { GET } from '@/app/api/search/route';
import { NextRequest } from 'next/server';
import { getAllPosts } from '@/lib/blog';
import { getAllProjects } from '@/lib/projects';
import { getAllAnnouncements } from '@/lib/announcements';
import { BlogPostFactory, ProjectFactory, AnnouncementFactory } from '@/__tests__/utils/test-factories';

// Mock dependencies
jest.mock('@/lib/blog');
jest.mock('@/lib/projects');
jest.mock('@/lib/announcements');

describe('Search API', () => {
  const createRequest = (params: Record<string, string>) => {
    const url = new URL('https://example.com/api/search');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (getAllPosts as jest.Mock).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false },
    });
    (getAllProjects as jest.Mock).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false },
    });
    (getAllAnnouncements as jest.Mock).mockResolvedValue([]);
  });

  describe('GET /api/search', () => {
    it('should require search query', async () => {
      const request = createRequest({});
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('required');
    });

    it('should require minimum query length', async () => {
      const request = createRequest({ q: 'a' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('at least 2 characters');
    });

    it('should search blog posts', async () => {
      const posts = [
        BlogPostFactory.build({ title: 'React Tutorial', tags: ['React'] }),
        BlogPostFactory.build({ title: 'Vue Guide', tags: ['Vue'] }),
      ];

      (getAllPosts as jest.Mock).mockResolvedValue({
        items: posts,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'React' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.results).toBeDefined();
      expect(body.results.length).toBeGreaterThan(0);
      expect(body.results[0].type).toBe('post');
      expect(body.results[0].title).toContain('React');
    });

    it('should search projects', async () => {
      const projects = [
        ProjectFactory.build({
          title: 'E-Commerce Platform',
          technologies: ['React', 'Node.js'],
        }),
        ProjectFactory.build({
          title: 'Blog System',
          technologies: ['Next.js'],
        }),
      ];

      (getAllProjects as jest.Mock).mockResolvedValue({
        items: projects,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'E-Commerce' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.results.some((r: any) => r.type === 'project')).toBe(true);
    });

    it('should search announcements', async () => {
      const announcements = [
        AnnouncementFactory.build({ title: 'New Feature Release' }),
        AnnouncementFactory.build({ title: 'Maintenance Notice' }),
      ];

      (getAllAnnouncements as jest.Mock).mockResolvedValue(announcements);

      const request = createRequest({ q: 'Feature' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.results.some((r: any) => r.type === 'announcement')).toBe(true);
    });

    it('should calculate relevance scores', async () => {
      const posts = [
        BlogPostFactory.build({
          title: 'JavaScript Basics',
          subtitle: 'Learn JavaScript',
          content: 'JavaScript tutorial content',
        }),
        BlogPostFactory.build({
          title: 'Advanced Topics',
          subtitle: 'Deep dive',
          content: 'Some content about JavaScript',
        }),
      ];

      (getAllPosts as jest.Mock).mockResolvedValue({
        items: posts,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'JavaScript' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.results[0].relevanceScore).toBeGreaterThan(0);
      // First result (title match) should have higher score
      expect(body.results[0].relevanceScore).toBeGreaterThan(
        body.results[1].relevanceScore
      );
    });

    it('should sort results by relevance', async () => {
      const posts = [
        BlogPostFactory.build({
          title: 'Other Topic',
          content: 'This mentions TypeScript once',
        }),
        BlogPostFactory.build({
          title: 'TypeScript Guide',
          subtitle: 'Complete TypeScript tutorial',
        }),
      ];

      (getAllPosts as jest.Mock).mockResolvedValue({
        items: posts,
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'TypeScript' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.results[0].title).toContain('TypeScript Guide');
    });

    it('should respect limit parameter', async () => {
      const posts = BlogPostFactory.buildMany(10, { content: 'test content' });

      (getAllPosts as jest.Mock).mockResolvedValue({
        items: posts,
        pagination: { page: 1, limit: 10, total: 10, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'test', limit: '5' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.results.length).toBeLessThanOrEqual(5);
    });

    it('should filter by type', async () => {
      const posts = [BlogPostFactory.build({ title: 'Post about React' })];
      const projects = [ProjectFactory.build({ title: 'React Project' })];

      (getAllPosts as jest.Mock).mockResolvedValue({
        items: posts,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      });
      (getAllProjects as jest.Mock).mockResolvedValue({
        items: projects,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'React', type: 'post' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.results.every((r: any) => r.type === 'post')).toBe(true);
    });

    it('should match tags in posts', async () => {
      const posts = [
        BlogPostFactory.build({
          title: 'Unrelated Title',
          tags: ['JavaScript', 'Testing'],
        }),
      ];

      (getAllPosts as jest.Mock).mockResolvedValue({
        items: posts,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'JavaScript' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.results.length).toBeGreaterThan(0);
      expect(body.results[0].tags).toContain('JavaScript');
    });

    it('should match technologies in projects', async () => {
      const projects = [
        ProjectFactory.build({
          title: 'Some Project',
          technologies: ['TypeScript', 'React'],
        }),
      ];

      (getAllProjects as jest.Mock).mockResolvedValue({
        items: projects,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'TypeScript' });
      const response = await GET(request);
      const body = await response.json();

      const projectResult = body.results.find((r: any) => r.type === 'project');
      expect(projectResult).toBeDefined();
      expect(projectResult.tags).toContain('TypeScript');
    });

    it('should return empty results for no matches', async () => {
      const posts = [BlogPostFactory.build({ title: 'Unrelated Post' })];

      (getAllPosts as jest.Mock).mockResolvedValue({
        items: posts,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'NonexistentTopic' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.results).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('should include cache headers', async () => {
      const request = createRequest({ q: 'test' });
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBeTruthy();
      expect(response.headers.get('Cache-Control')).toContain('public');
    });

    it('should handle search errors gracefully', async () => {
      (getAllPosts as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createRequest({ q: 'test' });
      const response = await GET(request);

      // Should still return 200 with empty results
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.results).toEqual([]);
    });

    it('should return query in response', async () => {
      const request = createRequest({ q: 'test query' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.query).toBe('test query');
    });

    it('should return total count', async () => {
      const posts = BlogPostFactory.buildMany(3, { content: 'test' });

      (getAllPosts as jest.Mock).mockResolvedValue({
        items: posts,
        pagination: { page: 1, limit: 10, total: 3, totalPages: 1, hasMore: false },
      });

      const request = createRequest({ q: 'test' });
      const response = await GET(request);
      const body = await response.json();

      expect(body.total).toBe(body.results.length);
    });
  });
});
