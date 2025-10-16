# Testing Documentation

## Test Strategy

### Unit Tests
- Component testing with React Testing Library
- Service layer testing with Jest
- Utility function testing

### Integration Tests
- API endpoint testing
- Firebase integration testing
- Authentication flow testing

### E2E Tests (To be implemented)
- Critical user journeys
- Cross-browser testing
- Mobile responsiveness

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/
├── __tests__/          # Integration tests
├── components/
│   └── __tests__/      # Component unit tests
├── lib/
│   └── __tests__/      # Utility tests
└── __mocks__/          # Mock data and modules
```

## Coverage Requirements

- Minimum overall coverage: 80%
- Critical paths: 90%
- New code: 85%

## Mocking

### Firebase Services
All Firebase services are mocked in `__mocks__/firebase/`

### External APIs
External API calls are mocked using MSW (Mock Service Worker)

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how

2. **Keep Tests Simple**
   - One assertion per test when possible
   - Clear test descriptions

3. **Use Testing Library Queries Correctly**
   - Prefer `getByRole` over `getByTestId`
   - Use `findBy` for async elements

4. **Mock Appropriately**
   - Mock at the boundary (API calls, external services)
   - Don't mock what you're testing

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-deployment checks