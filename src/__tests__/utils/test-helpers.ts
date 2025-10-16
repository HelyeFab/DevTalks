/**
 * Test Utilities and Helpers
 * Centralized testing utilities for consistent test setup
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Test data factories
 */

export const createMockBlogPost = (overrides = {}) => ({
  id: 'test-post-123',
  title: 'Test Blog Post',
  subtitle: 'A test subtitle',
  content: 'This is test content for a blog post. It contains some text.',
  excerpt: 'This is a test excerpt',
  image: '/images/test.jpg',
  imageAlt: 'Test image',
  tags: ['testing', 'jest', 'typescript'],
  author: {
    name: 'Test Author',
    email: 'test@example.com',
    image: '/images/author.jpg',
    uid: 'author-123',
    url: '/about',
  },
  date: '2024-01-01T00:00:00.000Z',
  publishedAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  slug: 'test-blog-post',
  published: true,
  upvotes: 5,
  readTime: 5,
  ...overrides,
});

export const createMockProject = (overrides = {}) => ({
  id: 'test-project-123',
  title: 'Test Project',
  description: 'A test project description',
  content: 'This is detailed project content',
  image: '/images/project.jpg',
  slug: 'test-project',
  technologies: ['React', 'TypeScript', 'Next.js'],
  githubUrl: 'https://github.com/test/project',
  liveUrl: 'https://test-project.com',
  featured: true,
  status: 'completed',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: '/images/avatar.jpg',
  emailVerified: true,
  isAdmin: false,
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
  ...overrides,
});

export const createMockAuthUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  displayName: 'Test User',
  photoURL: '/images/avatar.jpg',
  role: 'user' as const,
  isAdmin: false,
  isModerator: false,
  customClaims: {},
  ...overrides,
});

export const createMockComment = (overrides = {}) => ({
  id: 'test-comment-123',
  content: 'This is a test comment',
  author: {
    uid: 'author-123',
    name: 'Test Author',
    email: 'author@example.com',
    photoURL: '/images/avatar.jpg',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  parentId: null,
  replies: [],
  ...overrides,
});

export const createMockAnnouncement = (overrides = {}) => ({
  id: 'test-announcement-123',
  title: 'Test Announcement',
  content: 'This is a test announcement',
  slug: 'test-announcement',
  priority: 'normal' as const,
  published: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  publishedAt: '2024-01-01T00:00:00.000Z',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T00:00:00.000Z',
  author: {
    uid: 'admin-123',
    name: 'Admin',
    email: 'admin@example.com',
  },
  ...overrides,
});

/**
 * Mock Firebase Firestore responses
 */

export const createMockDocSnapshot = (data: any, id = 'test-id') => ({
  exists: () => !!data,
  id,
  data: () => data,
  ref: {
    id,
    path: `collection/${id}`,
  },
});

export const createMockQuerySnapshot = (docs: any[]) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map((doc, index) =>
    createMockDocSnapshot(doc, doc.id || `doc-${index}`)
  ),
  forEach: (callback: (doc: any) => void) => docs.forEach(callback),
});

/**
 * Mock API Response helpers
 */

export const createMockResponse = (data: any, status = 200, ok = true) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  blob: jest.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
  headers: new Headers(),
  redirected: false,
  type: 'basic' as ResponseType,
  url: '',
  clone: jest.fn(),
  body: null,
  bodyUsed: false,
  arrayBuffer: jest.fn(),
  formData: jest.fn(),
});

export const createMockRequest = (
  url: string,
  options: RequestInit = {}
) => ({
  url,
  method: options.method || 'GET',
  headers: new Headers(options.headers),
  body: options.body,
  json: async () => (options.body ? JSON.parse(options.body as string) : {}),
  text: async () => (options.body as string) || '',
  clone: jest.fn(),
  bodyUsed: false,
  arrayBuffer: jest.fn(),
  blob: jest.fn(),
  formData: jest.fn(),
});

/**
 * Custom render function with providers
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
}

export function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, { ...options });
}

/**
 * Wait utilities
 */

export const waitFor = async (
  callback: () => boolean,
  options: { timeout?: number; interval?: number } = {}
) => {
  const { timeout = 3000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (callback()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
};

/**
 * Date utilities
 */

export const createMockDate = (dateString = '2024-01-01T00:00:00.000Z') => {
  return new Date(dateString);
};

export const freezeTime = (dateString = '2024-01-01T00:00:00.000Z') => {
  const mockDate = createMockDate(dateString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  return mockDate;
};

export const unfreezeTime = () => {
  jest.restoreAllMocks();
};

/**
 * Error testing utilities
 */

export const expectToThrow = async (
  callback: () => Promise<any> | any,
  expectedError?: string | RegExp
) => {
  try {
    await callback();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect(error.message).toContain(expectedError);
      } else {
        expect(error.message).toMatch(expectedError);
      }
    }
  }
};

/**
 * Console mocking utilities
 */

export const mockConsole = () => {
  const originalConsole = { ...console };

  beforeEach(() => {
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
  });
};

/**
 * Local Storage mock
 */

export const mockLocalStorage = () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  return localStorageMock;
};

/**
 * Async utilities
 */

export const flushPromises = () =>
  new Promise((resolve) => setImmediate(resolve));

/**
 * Random data generators
 */

export const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

export const generateRandomEmail = () => {
  return `${generateRandomString()}@test.com`;
};

export const generateRandomUrl = () => {
  return `https://${generateRandomString()}.com`;
};

/**
 * Pagination helpers
 */

export const createMockPaginationResult = <T>(
  items: T[],
  page = 1,
  limit = 10
) => ({
  items: items.slice((page - 1) * limit, page * limit),
  pagination: {
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
    hasMore: page * limit < items.length,
  },
});

/**
 * Re-export common testing utilities
 */

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
