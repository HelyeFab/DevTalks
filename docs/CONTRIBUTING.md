# Contributing to DevTalks

Thank you for your interest in contributing to DevTalks! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for everyone, regardless of:
- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race
- Ethnicity
- Age
- Religion
- Nationality

### Expected Behavior

- Be respectful and considerate
- Use welcoming and inclusive language
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy toward others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other conduct deemed inappropriate

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git installed
- Firebase account
- Basic knowledge of Next.js, React, and TypeScript

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/DevTalks.git
   cd DevTalks
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/DevTalks.git
   ```

### Install Dependencies

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase credentials
3. Set up Firebase project (see [Getting Started Guide](guides/getting-started.md))

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Feature branch
git checkout -b feature/your-feature-name

# Bug fix branch
git checkout -b fix/bug-description

# Documentation
git checkout -b docs/what-you-are-documenting
```

### 2. Keep Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 3. Make Changes

- Write clean, readable code
- Follow the coding standards
- Add tests for new features
- Update documentation

### 4. Test Your Changes

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build project
npm run build
```

### 5. Commit Your Changes

Follow the [commit guidelines](#commit-guidelines)

```bash
git add .
git commit -m "feat: add new feature"
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

- Go to GitHub
- Click "New Pull Request"
- Select your branch
- Fill in the PR template
- Submit for review

## Coding Standards

### TypeScript

```typescript
// ✅ Good - Use types
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad - Avoid any
function getUser(id: any): any {
  // ...
}
```

### React Components

```typescript
// ✅ Good - Functional components with TypeScript
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {children}
    </button>
  );
}

// ❌ Bad - Missing types
export function Button({ children, onClick, variant }) {
  // ...
}
```

### File Naming

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-date.ts`)
- Hooks: `use-something.ts` (e.g., `use-auth.ts`)
- Types: `kebab-case.ts` (e.g., `user-types.ts`)

### Code Style

```typescript
// ✅ Good practices
- Use meaningful variable names
- Keep functions small and focused
- Add comments for complex logic
- Use early returns
- Avoid deep nesting

// Example
function calculateTotal(items: Item[]): number {
  if (items.length === 0) return 0;

  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad practices
- Single letter variables (except in loops)
- Long functions (> 50 lines)
- Deep nesting (> 3 levels)
- Magic numbers
```

### ESLint and Prettier

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint -- --fix

# Format code (if Prettier is configured)
npm run format
```

## Testing

### Unit Tests

Write unit tests for utilities and hooks:

```typescript
// __tests__/lib/format-date.test.ts
import { formatDate } from '@/lib/format-date';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-10-16');
    expect(formatDate(date)).toBe('October 16, 2025');
  });
});
```

### Component Tests

Test React components:

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

Aim for:
- 80%+ coverage for utilities
- 70%+ coverage for components
- 100% coverage for critical paths

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
feat(auth): add Google OAuth sign-in

# Bug fix
fix(comments): resolve nested reply rendering issue

# Documentation
docs(readme): update installation instructions

# Refactor
refactor(api): simplify user authentication logic

# Test
test(components): add tests for Header component

# Chore
chore(deps): update Firebase to v11.0.2
```

### Commit Message Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line max 72 characters
- Reference issues: "Fixes #123" or "Closes #456"

## Pull Request Process

### PR Checklist

Before submitting a PR:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Added tests for new features
- [ ] Updated documentation
- [ ] No console.log or debugging code
- [ ] Commits follow commit guidelines
- [ ] Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] All tests pass locally
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainers review your code
3. **Address Feedback**: Make requested changes
4. **Approval**: At least one maintainer approval required
5. **Merge**: Maintainer merges your PR

### Review Timeline

- Initial review: Within 3 business days
- Follow-up review: Within 2 business days
- Urgent fixes: Within 24 hours

## Issue Reporting

### Bug Reports

Include:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 118]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

### Feature Requests

Include:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
A clear description of what you want to happen

**Describe alternatives you've considered**
Alternative solutions you've thought about

**Additional context**
Add any other context or screenshots
```

## Project Structure

```
DevTalks/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── lib/          # Utility functions
│   ├── hooks/        # Custom hooks
│   ├── contexts/     # React contexts
│   └── types/        # TypeScript types
├── public/           # Static files
├── config/           # Configuration files
├── docs/             # Documentation
└── __tests__/        # Test files
```

## Questions?

If you have questions:

1. Check the [documentation](README.md)
2. Search [existing issues](https://github.com/OWNER/DevTalks/issues)
3. Ask in [discussions](https://github.com/OWNER/DevTalks/discussions)
4. Contact maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in the README

Thank you for contributing to DevTalks! 🎉

---

**Last updated:** 2025-10-16
