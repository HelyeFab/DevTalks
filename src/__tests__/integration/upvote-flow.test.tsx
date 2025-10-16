import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpvoteButton } from '@/components/upvote-button';
import * as authContext from '@/contexts/auth-context';
import * as blogLib from '@/lib/blog';

// Mocks
jest.mock('@/contexts/auth-context');
jest.mock('@/lib/blog');
jest.mock('@/app/api/posts/[postId]/upvote/route');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('Upvote Flow Integration', () => {
  const mockPostId = 'test-post-123';
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    getIdToken: jest.fn().mockResolvedValue('mock-token')
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth state - signed in
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false
    });

    // Default upvote status - not upvoted yet
    (blogLib.hasUserUpvoted as jest.Mock).mockResolvedValue(false);

    // Set up mock API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        upvoted: true,
        upvotes: 6
      })
    });
  });

  it('should handle the full upvote flow when user clicks upvote button', async () => {
    render(<UpvoteButton postId={mockPostId} initialUpvotes={5} />);

    // Wait for initial render and upvote status check
    await waitFor(() => {
      // Verify that hasUserUpvoted was called to check status
      expect(blogLib.hasUserUpvoted).toHaveBeenCalledWith(mockPostId, mockUser.uid);
    });

    // Get upvote button
    const buttonElement = screen.getByRole('button', { name: /upvote/i });

    // Click upvote button
    const user = userEvent.setup();
    await user.click(buttonElement);

    // Should call API with token
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/posts/${mockPostId}/upvote`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        })
      );
    });

    // Should update UI based on response
    await waitFor(() => {
      // Button should have updated count
      expect(buttonElement).toHaveTextContent('6');
      // Heart icon should be filled
      const heartIcon = buttonElement.querySelector('svg');
      expect(heartIcon).toHaveClass('fill-current');
      expect(heartIcon).toHaveClass('text-red-500');
    });
  });

  it('should redirect to signin page when unauthenticated user tries to upvote', async () => {
    // Mock unauthenticated user
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false
    });

    render(<UpvoteButton postId={mockPostId} initialUpvotes={5} />);

    // Upvote button should be a link to sign in
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', '/auth/signin');

    // Should not call hasUserUpvoted since user is not logged in
    expect(blogLib.hasUserUpvoted).not.toHaveBeenCalled();
  });

  it('should handle API error during upvote', async () => {
    // Set up API to throw error
    global.fetch = jest.fn().mockRejectedValue(new Error('API error'));

    render(<UpvoteButton postId={mockPostId} initialUpvotes={5} />);

    // Click upvote button
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));

    // Should show error toast
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update upvote')
      );
    });

    // Count should remain unchanged
    expect(screen.getByRole('button')).toHaveTextContent('5');
  });

  it('should handle upvote removal on second click when already upvoted', async () => {
    // Mock that user has already upvoted
    (blogLib.hasUserUpvoted as jest.Mock).mockResolvedValue(true);

    // Mock API to return upvote removed
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        upvoted: false,
        upvotes: 4
      })
    });

    render(<UpvoteButton postId={mockPostId} initialUpvotes={5} />);

    // First wait for initial render
    await waitFor(() => {
      const heartIcon = screen.getByRole('button').querySelector('svg');
      expect(heartIcon).toHaveClass('fill-current');
    });

    // Click to remove upvote
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));

    // Should call API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Should update UI to show upvote removed
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('4');
      const heartIcon = screen.getByRole('button').querySelector('svg');
      expect(heartIcon).not.toHaveClass('fill-current');
    });

    // Should show success toast
    expect(require('sonner').toast.success).toHaveBeenCalledWith(
      'Upvote removed'
    );
  });
});
