/**
 * Tests for Structured Data (Schema.org) Generator
 * Validates JSON-LD structured data generation
 */

import {
  generateWebSiteSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateBlogPostingSchema,
  generateArticleSchema,
  generateSoftwareApplicationSchema,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateFAQSchema,
  generateEventSchema,
  generateItemListSchema,
  generateProfilePageSchema,
  schemaToJsonLd,
  generateCombinedSchema,
} from '@/lib/seo/structured-data';
import { BlogPostFactory, ProjectFactory, AnnouncementFactory } from '@/__tests__/utils/test-factories';

describe('Structured Data Generator', () => {
  describe('generateWebSiteSchema()', () => {
    it('should generate valid WebSite schema', () => {
      const schema = generateWebSiteSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBeTruthy();
      expect(schema.url).toBeTruthy();
      expect(schema.description).toBeTruthy();
    });

    it('should include search action', () => {
      const schema = generateWebSiteSchema();

      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction['@type']).toBe('SearchAction');
      expect(schema.potentialAction.target).toBeDefined();
      expect(schema.potentialAction['query-input']).toBeTruthy();
    });

    it('should include publisher organization', () => {
      const schema = generateWebSiteSchema();

      expect(schema.publisher).toBeDefined();
      expect(schema.publisher['@type']).toBe('Organization');
    });
  });

  describe('generateOrganizationSchema()', () => {
    it('should generate valid Organization schema', () => {
      const schema = generateOrganizationSchema();

      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBeTruthy();
      expect(schema.url).toBeTruthy();
      expect(schema.logo).toBeTruthy();
    });

    it('should include social media profiles', () => {
      const schema = generateOrganizationSchema();

      expect(schema.sameAs).toBeDefined();
      expect(Array.isArray(schema.sameAs)).toBe(true);
    });
  });

  describe('generatePersonSchema()', () => {
    it('should generate valid Person schema', () => {
      const author = {
        name: 'John Doe',
        email: 'john@example.com',
        image: '/images/john.jpg',
      };

      const schema = generatePersonSchema(author);

      expect(schema['@type']).toBe('Person');
      expect(schema.name).toBe('John Doe');
      expect(schema.email).toBe('john@example.com');
      expect(schema.image).toBe('/images/john.jpg');
      expect(schema.url).toBeTruthy();
    });

    it('should handle optional fields', () => {
      const author = { name: 'Jane Smith' };
      const schema = generatePersonSchema(author);

      expect(schema.name).toBe('Jane Smith');
      expect(schema.email).toBeUndefined();
    });
  });

  describe('generateBlogPostingSchema()', () => {
    it('should generate valid BlogPosting schema', () => {
      const post = BlogPostFactory.build();
      const schema = generateBlogPostingSchema(post);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BlogPosting');
      expect(schema.headline).toBe(post.title);
      expect(schema.description).toBeTruthy();
    });

    it('should include author and publisher', () => {
      const post = BlogPostFactory.build();
      const schema = generateBlogPostingSchema(post);

      expect(schema.author).toBeDefined();
      expect(schema.author['@type']).toBe('Person');
      expect(schema.publisher).toBeDefined();
      expect(schema.publisher['@type']).toBe('Organization');
    });

    it('should include published and modified dates', () => {
      const post = BlogPostFactory.build({
        publishedAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });
      const schema = generateBlogPostingSchema(post);

      expect(schema.datePublished).toBeTruthy();
      expect(schema.dateModified).toBeTruthy();
    });

    it('should include article metadata', () => {
      const post = BlogPostFactory.build({
        tags: ['JavaScript', 'TypeScript'],
      });
      const schema = generateBlogPostingSchema(post);

      expect(schema.keywords).toContain('JavaScript');
      expect(schema.articleSection).toBe('JavaScript');
      expect(schema.wordCount).toBeGreaterThan(0);
    });

    it('should calculate word count from content', () => {
      const post = BlogPostFactory.build({
        content: 'Word '.repeat(100),
      });
      const schema = generateBlogPostingSchema(post);

      expect(schema.wordCount).toBeGreaterThan(90);
    });

    it('should include read time', () => {
      const post = BlogPostFactory.build({ readTime: 8 });
      const schema = generateBlogPostingSchema(post);

      expect(schema.timeRequired).toBe('PT8M');
    });

    it('should remove undefined values', () => {
      const post = BlogPostFactory.build({ image: undefined });
      const schema = generateBlogPostingSchema(post);

      expect('image' in schema).toBe(false);
    });
  });

  describe('generateArticleSchema()', () => {
    it('should generate valid Article schema', () => {
      const post = BlogPostFactory.build();
      const schema = generateArticleSchema(post);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Article');
      expect(schema.headline).toBe(post.title);
    });

    it('should include mainEntityOfPage', () => {
      const post = BlogPostFactory.build();
      const schema = generateArticleSchema(post);

      expect(schema.mainEntityOfPage).toBeDefined();
      expect(schema.mainEntityOfPage['@type']).toBe('WebPage');
      expect(schema.mainEntityOfPage['@id']).toContain(post.slug);
    });
  });

  describe('generateSoftwareApplicationSchema()', () => {
    it('should generate valid SoftwareApplication schema', () => {
      const project = ProjectFactory.build();
      const schema = generateSoftwareApplicationSchema(project);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('SoftwareApplication');
      expect(schema.name).toBe(project.title);
      expect(schema.description).toBe(project.description);
    });

    it('should include free pricing offer', () => {
      const project = ProjectFactory.build();
      const schema = generateSoftwareApplicationSchema(project);

      expect(schema.offers).toBeDefined();
      expect(schema.offers['@type']).toBe('Offer');
      expect(schema.offers.price).toBe('0');
      expect(schema.offers.priceCurrency).toBe('USD');
    });

    it('should include technologies', () => {
      const project = ProjectFactory.build({
        technologies: ['React', 'TypeScript', 'Node.js'],
      });
      const schema = generateSoftwareApplicationSchema(project);

      expect(schema.programmingLanguage).toEqual(['React', 'TypeScript', 'Node.js']);
      expect(schema.keywords).toContain('React');
    });

    it('should include repository URL', () => {
      const project = ProjectFactory.build({
        githubUrl: 'https://github.com/test/repo',
      });
      const schema = generateSoftwareApplicationSchema(project);

      expect(schema.codeRepository).toBe('https://github.com/test/repo');
    });

    it('should include dates when available', () => {
      const project = ProjectFactory.build({
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      });
      const schema = generateSoftwareApplicationSchema(project);

      expect(schema.dateCreated).toBeTruthy();
      expect(schema.dateModified).toBeTruthy();
    });
  });

  describe('generateBreadcrumbSchema()', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: 'Article', url: '/blog/article' },
      ];

      const schema = generateBreadcrumbSchema(breadcrumbs);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);
    });

    it('should set correct position for each item', () => {
      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
      ];

      const schema = generateBreadcrumbSchema(breadcrumbs);

      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[1].position).toBe(2);
    });

    it('should include full URLs', () => {
      const breadcrumbs = [{ name: 'Home', url: '/' }];
      const schema = generateBreadcrumbSchema(breadcrumbs);

      expect(schema.itemListElement[0].item).toMatch(/^https?:\/\//);
    });
  });

  describe('generateCollectionPageSchema()', () => {
    it('should generate valid CollectionPage schema', () => {
      const posts = BlogPostFactory.buildMany(5);
      const schema = generateCollectionPageSchema(posts);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('CollectionPage');
      expect(schema.mainEntity['@type']).toBe('ItemList');
    });

    it('should include all posts in item list', () => {
      const posts = BlogPostFactory.buildMany(3);
      const schema = generateCollectionPageSchema(posts);

      expect(schema.mainEntity.itemListElement).toHaveLength(3);
      expect(schema.numberOfItems).toBe(3);
    });

    it('should handle pagination', () => {
      const posts = BlogPostFactory.buildMany(5);
      const schema = generateCollectionPageSchema(posts, 2, 3);

      expect(schema.pageStart).toBe(2);
      expect(schema.pageEnd).toBe(3);
    });
  });

  describe('generateFAQSchema()', () => {
    it('should generate valid FAQPage schema', () => {
      const faqs = [
        { question: 'What is this?', answer: 'This is a test.' },
        { question: 'How does it work?', answer: 'It works well.' },
      ];

      const schema = generateFAQSchema(faqs);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
    });

    it('should format questions and answers correctly', () => {
      const faqs = [
        { question: 'Test question?', answer: 'Test answer.' },
      ];

      const schema = generateFAQSchema(faqs);
      const question = schema.mainEntity[0];

      expect(question['@type']).toBe('Question');
      expect(question.name).toBe('Test question?');
      expect(question.acceptedAnswer['@type']).toBe('Answer');
      expect(question.acceptedAnswer.text).toBe('Test answer.');
    });
  });

  describe('generateEventSchema()', () => {
    it('should generate valid Event schema', () => {
      const announcement = AnnouncementFactory.build({
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-06-30T23:59:59.000Z',
      });

      const schema = generateEventSchema(announcement);

      expect(schema).not.toBeNull();
      expect(schema?.['@context']).toBe('https://schema.org');
      expect(schema?.['@type']).toBe('Event');
    });

    it('should return null when no start date', () => {
      const announcement = AnnouncementFactory.build({
        startDate: undefined,
      });

      const schema = generateEventSchema(announcement);

      expect(schema).toBeNull();
    });

    it('should mark as online event', () => {
      const announcement = AnnouncementFactory.build({
        startDate: '2024-06-01T00:00:00.000Z',
      });

      const schema = generateEventSchema(announcement);

      expect(schema?.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
      expect(schema?.location['@type']).toBe('VirtualLocation');
    });
  });

  describe('generateItemListSchema()', () => {
    it('should generate valid ItemList schema', () => {
      const projects = ProjectFactory.buildMany(3);
      const schema = generateItemListSchema(projects);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('ItemList');
      expect(schema.numberOfItems).toBe(3);
    });

    it('should use custom list name', () => {
      const projects = ProjectFactory.buildMany(2);
      const schema = generateItemListSchema(projects, 'Featured Projects');

      expect(schema.name).toBe('Featured Projects');
    });

    it('should nest SoftwareApplication items', () => {
      const projects = ProjectFactory.buildMany(1);
      const schema = generateItemListSchema(projects);

      expect(schema.itemListElement[0].item['@type']).toBe('SoftwareApplication');
    });
  });

  describe('generateProfilePageSchema()', () => {
    it('should generate valid ProfilePage schema', () => {
      const profile = {
        name: 'John Doe',
        bio: 'Software engineer',
        image: '/images/john.jpg',
        url: '/about',
      };

      const schema = generateProfilePageSchema(profile);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('ProfilePage');
      expect(schema.mainEntity['@type']).toBe('Person');
    });

    it('should include person details', () => {
      const profile = {
        name: 'Jane Smith',
        bio: 'Developer and writer',
        url: '/profile',
      };

      const schema = generateProfilePageSchema(profile);

      expect(schema.mainEntity.name).toBe('Jane Smith');
      expect(schema.mainEntity.description).toBe('Developer and writer');
    });
  });

  describe('schemaToJsonLd()', () => {
    it('should convert schema to formatted JSON string', () => {
      const schema = { '@type': 'WebSite', name: 'Test' };
      const jsonLd = schemaToJsonLd(schema);

      expect(typeof jsonLd).toBe('string');
      expect(jsonLd).toContain('"@type"');
      expect(jsonLd).toContain('WebSite');
    });

    it('should format JSON with indentation', () => {
      const schema = { '@type': 'Thing' };
      const jsonLd = schemaToJsonLd(schema);

      expect(jsonLd).toContain('\n');
      expect(jsonLd).toContain('  ');
    });
  });

  describe('generateCombinedSchema()', () => {
    it('should combine multiple schemas into @graph', () => {
      const schema1 = { '@type': 'WebSite', name: 'Site' };
      const schema2 = { '@type': 'Organization', name: 'Org' };

      const combined = generateCombinedSchema(schema1, schema2);

      expect(combined['@context']).toBe('https://schema.org');
      expect(combined['@graph']).toHaveLength(2);
      expect(combined['@graph'][0]['@type']).toBe('WebSite');
      expect(combined['@graph'][1]['@type']).toBe('Organization');
    });

    it('should handle empty schemas array', () => {
      const combined = generateCombinedSchema();

      expect(combined['@graph']).toHaveLength(0);
    });
  });
});
