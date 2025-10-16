import React from 'react';
import { render, screen } from '@testing-library/react';
import { BlogList } from '@/components/blog-list';
import { BlogPost } from '@/types/blog';

// Mock the PostCard component
jest.mock('@/components/post-card', () => ({
  PostCard: ({ post }: { post: BlogPost }) => (
    <div data-testid={`post-card-${post.id}`}>
      <h3>{post.title}</h3>
    </div>
  )
}));

describe('BlogList Component', () => {
  // Create mock posts for testing
  const mockPosts: BlogPost[] = [
    {
      id: 'post-1',
      title: 'First Test Post',
      subtitle: 'First Post Subtitle',
      content: 'Content for first post',
      excerpt: 'First post excerpt',
      slug: 'first-test-post',
      author: {
        name: 'Test Author',
        email: 'author@example.com'
      },
      date: '2023-01-01T00:00:00.000Z',
      published: true,
      tags: ['test']
    },
    {
      id: 'post-2',
      title: 'Second Test Post',
      subtitle: 'Second Post Subtitle',
      content: 'Content for second post',
      excerpt: 'Second post excerpt',
      slug: 'second-test-post',
      author: {
        name: 'Test Author',
        email: 'author@example.com'
      },
      date: '2023-01-02T00:00:00.000Z',
      published: true,
      tags: ['test']
    },
    {
      id: 'post-3',
      title: 'Third Test Post',
      subtitle: 'Third Post Subtitle',
      content: 'Content for third post',
      excerpt: 'Third post excerpt',
      slug: 'third-test-post',
      author: {
        name: 'Test Author',
        email: 'author@example.com'
      },
      date: '2023-01-03T00:00:00.000Z',
      published: true,
      tags: ['test']
    }
  ];

  it('should render multiple blog posts', () => {
    render(<BlogList posts={mockPosts} />);

    // Check that all posts are rendered
    expect(screen.getByTestId('post-card-post-1')).toBeInTheDocument();
    expect(screen.getByTestId('post-card-post-2')).toBeInTheDocument();
    expect(screen.getByTestId('post-card-post-3')).toBeInTheDocument();

    // Verify post titles
    expect(screen.getByText('First Test Post')).toBeInTheDocument();
    expect(screen.getByText('Second Test Post')).toBeInTheDocument();
    expect(screen.getByText('Third Test Post')).toBeInTheDocument();
  });

  it('should render nothing when no posts are provided', () => {
    render(<BlogList posts={[]} />);

    // The component should render an empty grid container
    const container = document.querySelector('.grid.grid-cols-1.gap-12');
    expect(container).not.toBeNull();
    expect(container?.children.length).toBe(0);
  });
});
