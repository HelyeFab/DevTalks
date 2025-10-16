import React from 'react';
import { render, screen } from '@testing-library/react';
import { PostCard } from '@/components/post-card';
import * as authContext from '@/contexts/auth-context';
import { BlogPost } from '@/types/blog';
import { format } from 'date-fns';

// Mock dependencies
jest.mock('@/contexts/auth-context');
jest.mock('next/navigation', () => require('next-router-mock'));
jest.mock('@/components/upvote-button', () => ({
  UpvoteButton: ({ initialUpvotes }: { postId: string; initialUpvotes: number }) => (
    <button data-testid="upvote-button">
      Upvote ({initialUpvotes})
    </button>
  )
}));

describe('PostCard Component', () => {
  // Sample post data to use in tests
  const mockPost: BlogPost = {
    id: 'test-post-123',
    title: 'Test Post Title',
    subtitle: 'Test Post Subtitle',
    content: 'This is test content for the post.',
    excerpt: 'This is a test excerpt',
    image: 'https://example.com/image.jpg',
    imageAlt: 'Test Image Alt Text',
    slug: 'test-post-title',
    author: {
      name: 'Test Author',
      email: 'author@example.com',
      image: 'https://example.com/author.jpg',
      uid: 'author-123'
    },
    date: new Date('2023-01-01').toISOString(),
    published: true,
    publishedAt: new Date('2023-01-01').toISOString(),
    tags: ['test', 'jest'],
    upvotes: 10,
    readTime: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default auth context mock
    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      isAdmin: false
    });
  });

  it('should render post details correctly', () => {
    render(<PostCard post={mockPost} />);

    // Check that all expected elements are rendered
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    // Note: The subtitle is not rendered in the actual component
    expect(screen.getByText('This is a test excerpt')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();

    // Check formatted date is present
    const formattedDate = format(new Date(mockPost.date), 'MMMM d, yyyy');
    expect(screen.getByText(new RegExp(`${formattedDate}`))).toBeInTheDocument();

    // Check read time is present
    expect(screen.getByText(/5 min read/i)).toBeInTheDocument();

    // Check tags are rendered
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('jest')).toBeInTheDocument();

    // Check that the image is rendered with correct attributes
    const images = screen.getAllByRole('img');
    const mainImage = images[0]; // First image is the post image
    expect(mainImage).toHaveAttribute('src', expect.stringContaining('image.jpg'));
    expect(mainImage).toHaveAttribute('alt', 'Test Post Title'); // The component uses post.title for alt

    // Check that upvote button is present
    expect(screen.getByTestId('upvote-button')).toBeInTheDocument();
  });

  it('should render with default image when image is not provided', () => {
    const postWithoutImage = { ...mockPost, image: undefined, imageAlt: undefined };
    render(<PostCard post={postWithoutImage} />);

    // Check that a default image is rendered
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('should redirect when clicked', () => {
    const mockRouter = require('next-router-mock').default;
    const spy = jest.spyOn(mockRouter, 'push');

    render(<PostCard post={mockPost} />);

    // Find the article element and click it
    const article = screen.getByRole('article');
    article.click();

    // Check navigation was triggered with correct path
    expect(spy).toHaveBeenCalledWith('/blog/test-post-title');
  });

  it('should handle card with missing data gracefully', () => {
    // Create a minimal post with only required fields
    const minimalPost: BlogPost = {
      id: 'min-post',
      title: 'Minimal Post',
      subtitle: '', // Required by the type
      content: 'Minimal content',
      slug: 'minimal-post',
      author: {
        name: 'Minimal Author',
        email: 'minimal@example.com'
      },
      date: new Date().toISOString(),
      published: true,
      tags: []
    };

    render(<PostCard post={minimalPost} />);

    // Should render without crashing
    expect(screen.getByText('Minimal Post')).toBeInTheDocument();
    expect(screen.getByText('Minimal Author')).toBeInTheDocument();
  });
});
