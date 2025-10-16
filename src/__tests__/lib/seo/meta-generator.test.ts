/**
 * Tests for Meta Generator
 * Validates meta tag generation for different content types
 */

import {
  generateTitle,
  generateDescription,
  extractKeywords,
  generateBlogPostMetadata,
  generateProjectMetadata,
  generateListingMetadata,
  generateProfileMetadata,
  generateDefaultMetadata,
  mergeMetadata,
  META_LIMITS,
} from '@/lib/seo/meta-generator';
import { BlogPostFactory, ProjectFactory } from '@/__tests__/utils/test-factories';

describe('Meta Generator', () => {
  describe('generateTitle()', () => {
    it('should generate title with site name', () => {
      const title = generateTitle('Test Article', { includeSiteName: true });
      expect(title).toContain('Test Article');
      expect(title).toContain('|');
    });

    it('should generate title without site name', () => {
      const title = generateTitle('Test Article', { includeSiteName: false });
      expect(title).toBe('Test Article');
      expect(title).not.toContain('|');
    });

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(100);
      const title = generateTitle(longTitle, { maxLength: 60 });
      expect(title.length).toBeLessThanOrEqual(60);
    });

    it('should handle category format', () => {
      const title = generateTitle('JavaScript', { format: 'category' });
      expect(title).toContain('JavaScript Articles');
    });

    it('should truncate main title when combined with site name exceeds limit', () => {
      const longTitle = 'A Very Long Title That Will Need To Be Truncated When Combined';
      const title = generateTitle(longTitle, { includeSiteName: true, maxLength: 60 });
      expect(title.length).toBeLessThanOrEqual(60);
      expect(title).toContain('|');
    });
  });

  describe('generateDescription()', () => {
    it('should extract description from content', () => {
      const content = 'This is a test paragraph with some content to extract.';
      const description = generateDescription(content);
      expect(description).toBeTruthy();
      expect(description.length).toBeLessThanOrEqual(META_LIMITS.description);
    });

    it('should use excerpt when provided', () => {
      const content = 'Long content that should be ignored.';
      const excerpt = 'Short excerpt to use.';
      const description = generateDescription(content, { excerpt });
      expect(description).toContain('Short excerpt');
    });

    it('should respect maxLength', () => {
      const longContent = 'A'.repeat(500);
      const description = generateDescription(longContent, { maxLength: 100 });
      expect(description.length).toBeLessThanOrEqual(100);
    });

    it('should handle social media length limits', () => {
      const content = 'A'.repeat(500);
      const description = generateDescription(content, { forSocial: true });
      expect(description.length).toBeLessThanOrEqual(META_LIMITS.descriptionSocial);
    });

    it('should strip HTML/Markdown from content', () => {
      const content = '# Heading\n\nThis is **bold** text with [links](url).';
      const description = generateDescription(content);
      // Should extract plain text
      expect(description).not.toContain('#');
      expect(description).not.toContain('**');
    });
  });

  describe('extractKeywords()', () => {
    it('should extract keywords from tags', () => {
      const tags = ['JavaScript', 'TypeScript', 'React'];
      const keywords = extractKeywords('Some content', tags);
      expect(keywords).toContain('javascript');
      expect(keywords).toContain('typescript');
      expect(keywords).toContain('react');
    });

    it('should find technical keywords in content', () => {
      const content = 'This article covers React, TypeScript, and Node.js development.';
      const keywords = extractKeywords(content);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.some(k => ['react', 'typescript', 'node'].includes(k))).toBe(true);
    });

    it('should limit keywords to max count', () => {
      const tags = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
      const keywords = extractKeywords('Content', tags);
      expect(keywords.length).toBeLessThanOrEqual(META_LIMITS.keywords);
    });

    it('should prioritize tags over content keywords', () => {
      const tags = ['priority-tag'];
      const content = 'This mentions React and TypeScript';
      const keywords = extractKeywords(content, tags);
      expect(keywords[0]).toBe('priority-tag');
    });

    it('should convert keywords to lowercase', () => {
      const tags = ['JavaScript', 'TypeScript'];
      const keywords = extractKeywords('', tags);
      expect(keywords.every(k => k === k.toLowerCase())).toBe(true);
    });
  });

  describe('generateBlogPostMetadata()', () => {
    it('should generate complete metadata for blog post', () => {
      const post = BlogPostFactory.build();
      const metadata = generateBlogPostMetadata(post);

      expect(metadata.title).toBeTruthy();
      expect(metadata.description).toBeTruthy();
      expect(metadata.keywords).toBeTruthy();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.twitter).toBeDefined();
      expect(metadata.alternates?.canonical).toBeTruthy();
    });

    it('should set article type in OpenGraph', () => {
      const post = BlogPostFactory.build();
      const metadata = generateBlogPostMetadata(post);

      expect(metadata.openGraph?.type).toBe('article');
    });

    it('should include author information', () => {
      const post = BlogPostFactory.build({
        author: {
          name: 'John Doe',
          email: 'john@example.com',
          uid: 'john-123',
          url: '/about',
        },
      });
      const metadata = generateBlogPostMetadata(post);

      expect(metadata.authors).toEqual([{
        name: 'John Doe',
        url: '/about',
      }]);
      expect(metadata.creator).toBe('John Doe');
    });

    it('should include published and modified times', () => {
      const post = BlogPostFactory.build({
        publishedAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });
      const metadata = generateBlogPostMetadata(post);

      expect(metadata.openGraph?.publishedTime).toBeTruthy();
      expect(metadata.openGraph?.modifiedTime).toBeTruthy();
    });

    it('should include tags in OpenGraph', () => {
      const post = BlogPostFactory.build({
        tags: ['JavaScript', 'TypeScript', 'Testing'],
      });
      const metadata = generateBlogPostMetadata(post);

      expect(metadata.openGraph?.tags).toEqual(['JavaScript', 'TypeScript', 'Testing']);
    });

    it('should generate OG image URL', () => {
      const post = BlogPostFactory.build();
      const metadata = generateBlogPostMetadata(post, { generateOGImage: true });

      expect(metadata.openGraph?.images).toHaveLength(1);
      expect(metadata.openGraph?.images?.[0].url).toContain('/api/og');
    });

    it('should use post image when OG generation is disabled', () => {
      const post = BlogPostFactory.build({ image: '/test-image.jpg' });
      const metadata = generateBlogPostMetadata(post, { generateOGImage: false });

      expect(metadata.openGraph?.images?.[0].url).toContain('/test-image.jpg');
    });
  });

  describe('generateProjectMetadata()', () => {
    it('should generate complete metadata for project', () => {
      const project = ProjectFactory.build();
      const metadata = generateProjectMetadata(project);

      expect(metadata.title).toBeTruthy();
      expect(metadata.description).toBeTruthy();
      expect(metadata.keywords).toBeTruthy();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.twitter).toBeDefined();
    });

    it('should set website type in OpenGraph', () => {
      const project = ProjectFactory.build();
      const metadata = generateProjectMetadata(project);

      expect(metadata.openGraph?.type).toBe('website');
    });

    it('should include technologies as keywords', () => {
      const project = ProjectFactory.build({
        technologies: ['React', 'TypeScript', 'Next.js'],
      });
      const metadata = generateProjectMetadata(project);

      const keywords = metadata.keywords;
      expect(keywords).toContain('react');
      expect(keywords).toContain('typescript');
    });

    it('should include project URLs in metadata', () => {
      const project = ProjectFactory.build({
        githubUrl: 'https://github.com/test/project',
        liveUrl: 'https://project.com',
      });
      const metadata = generateProjectMetadata(project);

      expect(metadata.other?.['og:see_also']).toContain('github.com');
      expect(metadata.other?.['og:see_also']).toContain('project.com');
    });
  });

  describe('generateListingMetadata()', () => {
    it('should generate metadata for blog listing', () => {
      const metadata = generateListingMetadata({
        title: 'Blog',
        description: 'Latest blog posts',
        path: 'blog',
        type: 'blog',
      });

      expect(metadata.title).toContain('Blog');
      expect(metadata.description).toBe('Latest blog posts');
      expect(metadata.openGraph?.url).toContain('blog');
    });

    it('should include count in metadata when provided', () => {
      const metadata = generateListingMetadata({
        title: 'Projects',
        description: 'My projects',
        path: 'projects',
        type: 'projects',
        count: 15,
      });

      expect(metadata.other?.['og:article:count']).toBe('15');
    });

    it('should format category listings', () => {
      const metadata = generateListingMetadata({
        title: 'JavaScript',
        description: 'JavaScript articles',
        path: 'blog/category/javascript',
        type: 'category',
        category: 'JavaScript',
      });

      expect(metadata.title).toContain('JavaScript');
    });
  });

  describe('generateProfileMetadata()', () => {
    it('should generate metadata for profile page', () => {
      const metadata = generateProfileMetadata({
        name: 'John Doe',
        bio: 'Software engineer and blogger',
        image: '/images/john.jpg',
      });

      expect(metadata.title).toContain('About John Doe');
      expect(metadata.description).toContain('Software engineer');
      expect(metadata.openGraph?.type).toBe('profile');
    });

    it('should include social links when provided', () => {
      const metadata = generateProfileMetadata({
        name: 'Jane Smith',
        bio: 'Developer',
        socials: {
          github: 'https://github.com/jane',
          linkedin: 'https://linkedin.com/in/jane',
        },
      });

      expect(metadata.other?.['profile:github']).toBeTruthy();
      expect(metadata.other?.['profile:linkedin']).toBeTruthy();
    });

    it('should parse first and last name for OpenGraph', () => {
      const metadata = generateProfileMetadata({
        name: 'John Doe',
        bio: 'Developer',
      });

      expect(metadata.openGraph?.firstName).toBe('John');
      expect(metadata.openGraph?.lastName).toBe('Doe');
    });
  });

  describe('generateDefaultMetadata()', () => {
    it('should generate default metadata', () => {
      const metadata = generateDefaultMetadata();

      expect(metadata.title).toBeTruthy();
      expect(metadata.description).toBeTruthy();
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.twitter).toBeDefined();
    });

    it('should support noindex option', () => {
      const metadata = generateDefaultMetadata({ noindex: true });

      expect(metadata.robots?.index).toBe(false);
      expect(metadata.robots?.follow).toBe(false);
    });

    it('should allow custom title and description', () => {
      const metadata = generateDefaultMetadata({
        title: 'Custom Title',
        description: 'Custom description',
      });

      expect(metadata.title).toContain('Custom Title');
      expect(metadata.description).toBe('Custom description');
    });
  });

  describe('mergeMetadata()', () => {
    it('should merge custom metadata with base', () => {
      const base = generateDefaultMetadata();
      const custom = {
        keywords: 'custom, keywords',
      };

      const merged = mergeMetadata(base, custom);

      expect(merged.keywords).toBe('custom, keywords');
      expect(merged.title).toBe(base.title);
    });

    it('should deep merge OpenGraph data', () => {
      const base = generateDefaultMetadata();
      const custom = {
        openGraph: {
          locale: 'es-ES',
        },
      };

      const merged = mergeMetadata(base, custom);

      expect(merged.openGraph?.locale).toBe('es-ES');
      expect(merged.openGraph?.type).toBe(base.openGraph?.type);
    });

    it('should override twitter card type', () => {
      const base = generateDefaultMetadata();
      const custom = {
        twitter: {
          card: 'summary' as const,
        },
      };

      const merged = mergeMetadata(base, custom);

      expect(merged.twitter?.card).toBe('summary');
    });
  });
});
