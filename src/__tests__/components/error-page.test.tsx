/**
 * Tests for Error Page Component
 * Validates error boundary behavior and display
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPage from '@/app/error';
import { logClientError } from '@/lib/errors';

// Mock error logging
jest.mock('@/lib/errors', () => ({
  logClientError: jest.fn(),
}));

describe('Error Page Component', () => {
  const mockReset = jest.fn();
  const mockError = new Error('Test error message');

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'history', {
      writable: true,
      value: { back: jest.fn() },
    });
  });

  it('should render error page with message', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText('We encountered an unexpected error')
    ).toBeInTheDocument();
  });

  it('should log error on mount', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(logClientError).toHaveBeenCalledWith(
      mockError,
      undefined,
      expect.objectContaining({
        page: 'global-error',
      })
    );
  });

  it('should display error digest when available', () => {
    const errorWithDigest = Object.assign(new Error('Test error'), {
      digest: 'abc123',
    });

    render(<ErrorPage error={errorWithDigest} reset={mockReset} />);

    expect(screen.getAllByText(/abc123/i).length).toBeGreaterThan(0);
  });

  it('should call reset when "Try Again" is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorPage error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByText('Try Again');
    await user.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('should go back when "Go Back" is clicked', async () => {
    const user = userEvent.setup();
    render(<ErrorPage error={mockError} reset={mockReset} />);

    const goBackButton = screen.getByText('Go Back');
    await user.click(goBackButton);

    expect(window.history.back).toHaveBeenCalled();
  });

  it('should have home link', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);

    const homeLink = screen.getByText('Home');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should display helpful suggestions', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(screen.getByText(/Try refreshing the page/i)).toBeInTheDocument();
    expect(screen.getByText(/Go back to the previous page/i)).toBeInTheDocument();
    expect(screen.getByText(/Return to the home page/i)).toBeInTheDocument();
  });

  it('should show development info in dev mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(screen.getByText('Development Info')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should hide development info in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(screen.queryByText('Development Info')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should show stack trace in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const errorWithStack = new Error('Test error');
    errorWithStack.stack = 'Error: Test error\n  at TestFile.js:10:15';

    render(<ErrorPage error={errorWithStack} reset={mockReset} />);

    expect(screen.getByText('View Stack Trace')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should render within html and body tags', () => {
    const { container } = render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(container.querySelector('html')).toBeInTheDocument();
    expect(container.querySelector('body')).toBeInTheDocument();
  });

  it('should re-log error when error changes', () => {
    const { rerender } = render(<ErrorPage error={mockError} reset={mockReset} />);

    expect(logClientError).toHaveBeenCalledTimes(1);

    const newError = new Error('New error');
    rerender(<ErrorPage error={newError} reset={mockReset} />);

    expect(logClientError).toHaveBeenCalledTimes(2);
  });
});
