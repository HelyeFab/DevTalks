# Testing Quick Reference Card

Quick reference for common testing patterns in DevTalks.

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate"
```

---

## Import Test Utilities

```typescript
// Test helpers and factories
import {
  createMockBlogPost,
  createMockUser,
  createMockResponse,
} from '@/__tests__/utils/test-helpers';

import {
  BlogPostFactory,
  UserFactory,
  ProjectFactory,
} from '@/__tests__/utils/test-factories';

// Testing library
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

---

## Common Patterns

### Creating Test Data

```typescript
// Using helpers
const post = createMockBlogPost({ title: 'Custom Title' });
const user = createMockUser({ isAdmin: true });

// Using factories
const post = BlogPostFactory.build();
const posts = BlogPostFactory.buildMany(10);
const admin = UserFactory.buildAdmin();
```

### Mocking Firebase

```typescript
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock Firestore responses
const mockDoc = createMockDocSnapshot({ id: '123', name: 'Test' });
const mockQuery = createMockQuerySnapshot([doc1, doc2]);
```

### Mocking API Calls

```typescript
global.fetch = jest.fn().mockResolvedValue(
  createMockResponse({ data: 'test' }, 200)
);
```

### Testing Components

```typescript
it('should render and handle click', async () => {
  const user = userEvent.setup();
  const onClickMock = jest.fn();

  render(<Button onClick={onClickMock}>Click me</Button>);

  await user.click(screen.getByText('Click me'));
  expect(onClickMock).toHaveBeenCalled();
});
```

### Testing API Endpoints

```typescript
it('should return success response', async () => {
  const request = new NextRequest('https://example.com/api/test');
  const response = await GET(request);

  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('data');
});
```

### Testing Async Functions

```typescript
it('should load data', async () => {
  const result = await loadData();
  expect(result).toBeDefined();
});

// With waitFor
it('should update UI', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Testing Errors

```typescript
it('should throw on invalid input', () => {
  expect(() => functionName(null)).toThrow('Invalid input');
});

// Async errors
it('should handle API errors', async () => {
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

---

## Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('functionName()', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      // Test
    });

    it('should throw on error', () => {
      // Test
    });
  });
});
```

---

## Common Assertions

```typescript
// Basic assertions
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeDefined();
expect(value).toBeNull();
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeGreaterThan(10);
expect(value).toBeLessThan(100);
expect(value).toBeCloseTo(3.14, 2);

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain(item);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(2);

// React Testing Library
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent('text');
expect(element).toHaveAttribute('href', '/link');
expect(element).toBeVisible();
expect(element).toBeDisabled();
```

---

## Coverage Thresholds

| Area | Lines | Functions | Branches | Statements |
|------|-------|-----------|----------|------------|
| Global | 70% | 65% | 60% | 70% |
| Libraries | 80% | 75% | 70% | 80% |

---

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests focused and simple**
4. **Mock external dependencies**
5. **Test error cases**
6. **Clean up after tests**
7. **Use factories for test data**
8. **Follow AAA pattern** (Arrange, Act, Assert)

---

## Useful Links

- Full Guide: `/docs/TESTING_GUIDE.md`
- Test Helpers: `/src/__tests__/utils/test-helpers.ts`
- Test Factories: `/src/__tests__/utils/test-factories.ts`
- Example Tests: `/src/__tests__/lib/blog.test.ts`

---

**Last Updated**: January 2025
