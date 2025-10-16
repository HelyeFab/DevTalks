// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Add custom matchers
// Note: In @testing-library/jest-dom v6+, /extend-expect is included in the main import

// Mock the next/navigation hooks
jest.mock('next/navigation', () => require('next-router-mock'));

// Mock the next-themes provider
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    systemTheme: 'light'
  })
}));

// Mock API routes
jest.mock('@/app/api/announcements/route');
jest.mock('@/app/api/posts/[postId]/upvote/route');
jest.mock('@/app/api/blog/route');

// Setup globals for fetch testing
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);
global.Request = jest.fn();
global.Headers = jest.fn();
global.Response = jest.fn(() => ({
  json: jest.fn(),
  text: jest.fn(),
  blob: jest.fn()
}));

// Set up mock console to capture logs during tests
beforeAll(() => {
  global.originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };

  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.log = global.originalConsole.log;
  console.error = global.originalConsole.error;
  console.warn = global.originalConsole.warn;
  console.info = global.originalConsole.info;
});

beforeEach(() => {
  jest.clearAllMocks();
});
