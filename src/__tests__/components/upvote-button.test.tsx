import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpvoteButton } from '@/components/upvote-button';
import * as authContext from '@/contexts/auth-context';
import * as blogLib from '@/lib/blog';

// Mock dependencies
jest.mock('@/contexts/auth-context');
jest.mock('@/lib/blog');
jest.mock('next/navigation', () => require('next-router-mock'));
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('UpvoteButton Component', () => {
  const mockPostId = 'test-post-123';
  const mockInitialUpvotes = 5;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth state is not logged in
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });

    // Mock fetch implementation
    global.fetch = jest.fn();
  });

  it('should render sign in link when user is not logged in', () => {
    render(
      <UpvoteButton
        postId={mockPostId}
        initialUpvotes={mockInitialUpvotes}
      />
    );

    // Should show a link to sign in
    const linkElement = screen.getByRole('link', { name: /5/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/auth/signin');

    // Should show the initial upvote count
    expect(linkElement).toHaveTextContent('5');
  });

  it('should render upvote button when user is logged in', async () => {
    // Mock authenticated user
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: {
        uid: 'test-user',
        getIdToken: jest.fn().mockResolvedValue('mock-token')
      },
      loading: false
    });

    // Mock hasUserUpvoted to return false (user hasn't upvoted yet)
    (blogLib.hasUserUpvoted as jest.Mock).mockResolvedValue(false);

    render(
      <UpvoteButton
        postId={mockPostId}
        initialUpvotes={mockInitialUpvotes}
      />
    );

    // Should show button instead of link
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeInTheDocument();

    // Should show initial upvote count
    expect(buttonElement).toHaveTextContent('5');

    // Heart icon should not be filled (not upvoted yet)
    const heartIcon = buttonElement.querySelector('svg');
    expect(heartIcon).not.toHaveClass('fill-current');
  });

  it('should show filled heart when user has already upvoted', async () => {
    // Mock authenticated user
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: {
        uid: 'test-user',
        getIdToken: jest.fn().mockResolvedValue('mock-token')
      },
      loading: false
    });

    // Mock hasUserUpvoted to return true (user has already upvoted)
    (blogLib.hasUserUpvoted as jest.Mock).mockResolvedValue(true);

    render(
      <UpvoteButton
        postId={mockPostId}
        initialUpvotes={mockInitialUpvotes}
      />
    );

    // Wait for hasUserUpvoted check to complete
    await waitFor(() => {
      const buttonElement = screen.getByRole('button');
      const heartIcon = buttonElement.querySelector('svg');
      expect(heartIcon).toHaveClass('fill-current');
      expect(heartIcon).toHaveClass('text-red-500');
    });
  });

  it('should handle upvote action successfully', async () => {
    // Mock authenticated user
    const mockGetIdToken = jest.fn().mockResolvedValue('mock-token');
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: {
        uid: 'test-user',
        getIdToken: mockGetIdToken
      },
      loading: false
    });

    // Mock hasUserUpvoted to return false (user hasn't upvoted yet)
    (blogLib.hasUserUpvoted as jest.Mock).mockResolvedValue(false);

    // Mock successful fetch response for upvote
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        upvoted: true,
        upvotes: 6
      })
    });

    render(
      <UpvoteButton
        postId={mockPostId}
        initialUpvotes={mockInitialUpvotes}
      />
    );

    // Get upvote button and click it
    const buttonElement = screen.getByRole('button');
    const user = userEvent.setup();

    await act(async () => {
      await user.click(buttonElement);
    });

    // Verify correct API was called
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/posts/${mockPostId}/upvote`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      })
    );

    // Button should now show the updated upvote count and filled heart
    await waitFor(() => {
      expect(buttonElement).toHaveTextContent('6');
    });
  });

  it('should handle upvote action failure', async () => {
    // Mock authenticated user
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: {
        uid: 'test-user',
        getIdToken: jest.fn().mockResolvedValue('mock-token')
      },
      loading: false
    });

    // Mock hasUserUpvoted to return false (user hasn't upvoted yet)
    (blogLib.hasUserUpvoted as jest.Mock).mockResolvedValue(false);

    // Mock failed fetch response for upvote
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({
        error: 'Failed to update upvote'
      })
    });

    render(
      <UpvoteButton
        postId={mockPostId}
        initialUpvotes={mockInitialUpvotes}
      />
    );

    // Get upvote button and click it
    const buttonElement = screen.getByRole('button');
    const user = userEvent.setup();

    await act(async () => {
      await user.click(buttonElement);
    });

    // Upvote count should remain unchanged
    expect(buttonElement).toHaveTextContent('5');
  });

  it('should render different size variants correctly', () => {
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });

    // Test small size
    const { unmount } = render(
      <UpvoteButton
        postId={mockPostId}
        initialUpvotes={mockInitialUpvotes}
        size="small"
      />
    );

    expect(screen.getByRole('link')).toHaveClass('px-2 py-1 text-xs');
    unmount();

    // Test large size
    render(
      <UpvoteButton
        postId={mockPostId}
        initialUpvotes={mockInitialUpvotes}
        size="large"
      />
    );

    expect(screen.getByRole('link')).toHaveClass('px-5 py-2.5 text-base');
  });

  it('should handle showCount prop correctly', () => {
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });

    render(
      <UpvoteButton
        postId={mockPostId}
        initialUpvotes={mockInitialUpvotes}
        showCount={false}
      />
    );

    const linkElement = screen.getByRole('link');
    expect(linkElement).not.toHaveTextContent('5');
  });
});
