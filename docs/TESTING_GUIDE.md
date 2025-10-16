# Testing Guide for DevTalks

Comprehensive testing documentation for the DevTalks Next.js application.

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Testing Utilities](#testing-utilities)
6. [Best Practices](#best-practices)
7. [Coverage Requirements](#coverage-requirements)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This project uses a comprehensive testing strategy covering:

- **Unit Tests**: Individual functions and utilities
- **Integration Tests**: API endpoints and data flows
- **Component Tests**: React components and UI behavior
- **E2E Tests**: End-to-end user workflows (scaffolded)

### Testing Stack

- **Test Runner**: Jest 29
- **Component Testing**: React Testing Library
- **Mocking**: Jest mocks + MSW (for API mocking)
- **Coverage**: Jest coverage reports (text, lcov, HTML)

---

## Test Infrastructure

### Jest Configuration

Located in `/config/jest.config.js`:

```javascript
{
  testEnvironment: 'jest-environment-jsdom',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 70,
      statements: 70
    },
    './src/lib/': {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  }
}
```

### Test Setup

Global test setup in `/config/jest.setup.js`:

- Mock Next.js navigation
- Mock theme provider
- Configure fetch mocks
- Setup console mocking

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="SEO"
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **Terminal**: Immediate feedback
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info` (for CI tools)
- **JSON Summary**: `coverage/coverage-summary.json`

---

## Test Structure

### Directory Organization

```
src/__tests__/
├── api/                    # API endpoint tests
│   ├── health.test.ts
│   ├── status.test.ts
│   └── search.test.ts
├── components/             # Component tests
│   ├── error-page.test.tsx
│   ├── post-card.test.tsx
│   └── upvote-button.test.tsx
├── contexts/               # Context provider tests
│   └── auth-context.test.tsx
├── integration/            # Integration tests
│   └── upvote-flow.test.tsx
├── lib/                    # Library/utility tests
│   ├── auth/
│   │   └── auth-utils.test.ts
│   ├── errors/
│   │   └── error-handler.test.ts
│   ├── seo/
│   │   ├── meta-generator.test.ts
│   │   └── structured-data.test.ts
│   └── blog.test.ts
├── e2e/                    # End-to-end tests
│   └── api-endpoints.test.ts
└── utils/                  # Test utilities
    ├── test-helpers.ts
    └── test-factories.ts
```

---

## Testing Utilities

### Test Helpers (`src/__tests__/utils/test-helpers.ts`)

Comprehensive utilities for test setup and common operations:

#### Mock Data Factories

```typescript
import { createMockBlogPost, createMockUser } from '@/__tests__/utils/test-helpers';

const post = createMockBlogPost({ title: 'Custom Title' });
const user = createMockUser({ isAdmin: true });
```

#### Mock API Responses

```typescript
import { createMockResponse } from '@/__tests__/utils/test-helpers';

const response = createMockResponse({ data: 'test' }, 200);
```

#### Mock Firestore

```typescript
import { createMockDocSnapshot, createMockQuerySnapshot } from '@/__tests__/utils/test-helpers';

const docSnap = createMockDocSnapshot({ id: '123', name: 'Test' });
const querySnap = createMockQuerySnapshot([doc1, doc2, doc3]);
```

### Test Factories (`src/__tests__/utils/test-factories.ts`)

Factory pattern for generating realistic test data:

```typescript
import { BlogPostFactory, ProjectFactory, UserFactory } from '@/__tests__/utils/test-factories';

// Single items
const post = BlogPostFactory.build();
const draft = BlogPostFactory.buildDraft();
const admin = UserFactory.buildAdmin();

// Multiple items
const posts = BlogPostFactory.buildMany(10);

// With overrides
const customPost = BlogPostFactory.build({
  title: 'Custom Title',
  tags: ['React', 'TypeScript']
});
```

---

## Best Practices

### 1. Test Organization

```typescript
describe('Feature Name', () => {
  describe('functionName()', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### 2. Descriptive Test Names

**Good:**
```typescript
it('should return 404 when post does not exist')
it('should validate email format before submission')
it('should display error message when API fails')
```

**Bad:**
```typescript
it('works correctly')
it('test function')
it('should pass')
```

### 3. Isolate Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset any shared state
});

afterEach(() => {
  // Clean up
});
```

### 4. Mock External Dependencies

```typescript
// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: {}
}));

// Mock API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' })
});
```

### 5. Test Error Cases

```typescript
it('should handle network errors gracefully', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

  await expect(fetchData()).rejects.toThrow('Network error');
});
```

### 6. Avoid Testing Implementation Details

**Good:** Test behavior
```typescript
it('should display user name after login', async () => {
  await userEvent.click(loginButton);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

**Bad:** Test implementation
```typescript
it('should call setState with user data', () => {
  // Testing internal state management
});
```

### 7. Use Factories for Complex Data

```typescript
// Instead of manually creating objects
const post = BlogPostFactory.build({
  upvotes: 100
});
```

---

## Coverage Requirements

### Global Thresholds

- **Branches**: 60%
- **Functions**: 65%
- **Lines**: 70%
- **Statements**: 70%

### Library Code (`src/lib/`)

Higher standards for critical business logic:

- **Branches**: 70%
- **Functions**: 75%
- **Lines**: 80%
- **Statements**: 80%

### Excluded from Coverage

- Type definition files (`*.d.ts`)
- Test files and mocks
- Layout/loading/error Next.js files
- Private/internal files (`_*.ts`)

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hooks

Using Husky:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test -- --bail --findRelatedTests",
      "pre-push": "npm test"
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Import Resolution Errors

**Problem:** `Cannot find module '@/lib/...'`

**Solution:** Check `moduleNameMapper` in `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

#### 2. Async Test Timeouts

**Problem:** Tests timing out

**Solution:** Increase timeout or use proper async handling:
```typescript
it('should load data', async () => {
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  }, { timeout: 5000 });
});
```

#### 3. Mock Not Working

**Problem:** Mocks not being applied

**Solution:** Ensure mocks are hoisted:
```typescript
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn()
}));

// Before test code
```

#### 4. Memory Leaks

**Problem:** `Jest did not exit one second after the test run completed`

**Solution:** Clean up timers and subscriptions:
```typescript
afterEach(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});
```

#### 5. Flaky Tests

**Problem:** Tests pass/fail inconsistently

**Solution:**
- Remove time-dependent logic
- Use `waitFor` for async operations
- Avoid testing race conditions
- Mock random/time functions

---

## Writing New Tests

### Unit Test Template

```typescript
/**
 * Tests for [Feature Name]
 * Validates [what it does]
 */

import { functionToTest } from '@/lib/module';
import { MockFactory } from '@/__tests__/utils/test-factories';

describe('[Feature Name]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('functionToTest()', () => {
    it('should handle normal case', () => {
      const input = MockFactory.build();
      const result = functionToTest(input);
      expect(result).toBeDefined();
    });

    it('should handle edge case', () => {
      // Test edge cases
    });

    it('should throw on invalid input', () => {
      expect(() => functionToTest(null)).toThrow();
    });
  });
});
```

### Component Test Template

```typescript
/**
 * Tests for [Component Name]
 * Validates [component behavior]
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component } from '@/components/component';

describe('[Component Name]', () => {
  it('should render with props', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('value')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const onClickMock = jest.fn();
    const user = userEvent.setup();

    render(<Component onClick={onClickMock} />);

    await user.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalled();
  });
});
```

### API Test Template

```typescript
/**
 * Tests for [API Endpoint]
 * Validates [endpoint behavior]
 */

import { GET, POST } from '@/app/api/endpoint/route';
import { NextRequest } from 'next/server';

describe('[API Endpoint]', () => {
  it('should return success response', async () => {
    const request = new NextRequest('https://example.com/api/endpoint');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
  });

  it('should validate request parameters', async () => {
    const request = new NextRequest('https://example.com/api/endpoint');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
```

---

## Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Internal Resources

- Test Utilities: `src/__tests__/utils/test-helpers.ts`
- Test Factories: `src/__tests__/utils/test-factories.ts`
- Example Tests: `src/__tests__/lib/blog.test.ts`

---

## Maintenance

### Updating Test Dependencies

```bash
# Update Jest and related packages
npm update jest @testing-library/react @testing-library/jest-dom

# Check for outdated packages
npm outdated
```

### Reviewing Coverage

```bash
# Generate detailed coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Performance

Monitor test performance:

```bash
# Show slowest tests
npm test -- --verbose --testTimeout=10000
```

---

## Contributing

When adding new features:

1. Write tests **before** or **alongside** implementation
2. Ensure tests pass locally
3. Maintain or improve coverage percentage
4. Follow naming conventions
5. Document complex test scenarios
6. Use factories for test data
7. Keep tests focused and readable

---

## Contact

For questions about testing:
- Review this guide
- Check existing test examples
- Consult the team

---

**Last Updated**: January 2025
**Maintained By**: DevTalks Development Team
