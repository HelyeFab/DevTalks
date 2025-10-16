import {
  getAllPosts,
  getPost,
  getPostBySlug,
  getMostUpvotedPosts,
  createPost,
  updatePost,
  deletePost,
  upvotePost,
  hasUserUpvoted
} from '@/lib/blog';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

// Mock Firebase modules
jest.mock('@/lib/firebase', () => ({
  db: {}
}));
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

// Sample blog post data for testing
const mockPostData = {
  title: 'Test Post',
  subtitle: 'A test post subtitle',
  content: 'This is a test post content.',
  excerpt: 'This is a test excerpt',
  image: 'https://example.com/image.jpg',
  imageAlt: 'Test image',
  tags: ['test', 'jest'],
  author: {
    name: 'Test Author',
    email: 'test@example.com',
    image: 'https://example.com/author.jpg',
    uid: 'author-123'
  },
  date: new Date().toISOString(),
  slug: 'test-post',
  published: true,
  publishedAt: new Date().toISOString(),
  upvotes: 0
};

// Mock post with ID
const mockPost = {
  id: 'post-123',
  ...mockPostData
};

describe('Blog Library Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth state for authenticated user tests
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        getIdToken: jest.fn().mockResolvedValue('mock-token')
      }
    });
  });

  describe('getAllPosts()', () => {
    it('should retrieve all posts with pagination', async () => {
      // Mock the Firestore query chain
      (collection as jest.Mock).mockReturnValue('posts-collection');
      (query as jest.Mock).mockReturnValue('posts-query');
      (orderBy as jest.Mock).mockReturnValue('posts-query-with-order');

      // Mock query results
      const mockDocs = [
        { id: 'post-1', data: () => ({ ...mockPostData, title: 'Post 1' }) },
        { id: 'post-2', data: () => ({ ...mockPostData, title: 'Post 2' }) },
        { id: 'post-3', data: () => ({ ...mockPostData, title: 'Post 3' }) }
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: mockDocs.length
      });

      // Call the function
      const result = await getAllPosts();

      // Check that it called Firestore correctly
      expect(collection).toHaveBeenCalledWith(db, 'blog_posts');
      expect(orderBy).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalled();

      // Check the returned data
      expect(result.items.length).toBe(3);
      expect(result.items[0].id).toBe('post-1');
      expect(result.items[0].title).toBe('Post 1');

      // Test pagination values
      expect(result.items).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBeDefined();
      expect(result.pagination.limit).toBeDefined();
      expect(result.pagination.total).toBeDefined();
      expect(result.pagination.totalPages).toBeDefined();
      expect(result.pagination.hasMore).toBeDefined();
    });

    it('should filter published posts when publishedOnly is true', async () => {
      // Mock posts with mix of published and unpublished
      const mockDocs = [
        { id: 'post-1', data: () => ({ ...mockPostData, title: 'Post 1', published: true }) },
        { id: 'post-2', data: () => ({ ...mockPostData, title: 'Post 2', published: false }) },
        { id: 'post-3', data: () => ({ ...mockPostData, title: 'Post 3', published: true }) }
      ];

      (collection as jest.Mock).mockReturnValue('posts-collection');
      (query as jest.Mock).mockReturnValue('posts-query');
      (orderBy as jest.Mock).mockReturnValue('posts-query-with-order');
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: mockDocs.length
      });

      // Call the function with publishedOnly = true
      const result = await getAllPosts({ publishedOnly: true });

      // Check that only published posts are returned
      expect(result.items.length).toBe(2);
      expect(result.items[0].title).toBe('Post 1');
      expect(result.items[1].title).toBe('Post 3');
    });
  });

  describe('getPost()', () => {
    it('should retrieve a post by ID', async () => {
      // Mock doc retrieval
      (doc as jest.Mock).mockReturnValue('post-doc-ref');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: mockPost.id,
        data: () => mockPostData
      });

      // Call the function
      const result = await getPost(mockPost.id);

      // Check that it called Firestore correctly
      expect(doc).toHaveBeenCalledWith(db, 'blog_posts', mockPost.id);
      expect(getDoc).toHaveBeenCalledWith('post-doc-ref');

      // Check the returned data
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockPost.id);
      expect(result?.title).toBe(mockPostData.title);
    });

    it('should return null when post does not exist', async () => {
      // Mock doc retrieval for non-existent document
      (doc as jest.Mock).mockReturnValue('post-doc-ref');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        id: 'non-existent',
        data: () => null
      });

      // Call the function
      const result = await getPost('non-existent');

      // Check that it returns null for non-existent post
      expect(result).toBeNull();
    });
  });

  describe('getPostBySlug()', () => {
    it('should retrieve a post by slug', async () => {
      // Mock the Firestore query chain
      (collection as jest.Mock).mockReturnValue('posts-collection');
      (query as jest.Mock).mockReturnValue('posts-query');
      (where as jest.Mock).mockReturnValue('posts-query-with-where');

      // Mock query results
      const mockDocs = [
        { id: mockPost.id, data: () => mockPostData }
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: mockDocs.length
      });

      // Call the function
      const result = await getPostBySlug(mockPost.slug);

      // Check that it called Firestore correctly
      expect(collection).toHaveBeenCalledWith(db, 'blog_posts');
      expect(where).toHaveBeenCalledWith('slug', '==', mockPost.slug);
      expect(getDocs).toHaveBeenCalled();

      // Check the returned data
      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockPost.id);
      expect(result?.title).toBe(mockPostData.title);
    });

    it('should respect the includeDrafts parameter', async () => {
      // Mock posts with mix of published and unpublished
      const publishedPost = { ...mockPostData, published: true };
      const draftPost = { ...mockPostData, published: false };

      const mockDocs = [
        { id: 'published-post', data: () => publishedPost }
      ];

      (collection as jest.Mock).mockReturnValue('posts-collection');
      (query as jest.Mock).mockReturnValue('posts-query');
      (where as jest.Mock).mockReturnValue('posts-query-with-where');
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: mockDocs.length
      });

      // Test with includeDrafts = false (default)
      const resultPublished = await getPostBySlug('test-post', false);
      expect(resultPublished).not.toBeNull();
      expect(resultPublished?.published).toBe(true);

      // Now test with draft post
      const mockDraftDocs = [
        { id: 'draft-post', data: () => draftPost }
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDraftDocs,
        empty: false,
        size: mockDraftDocs.length
      });

      // Should not return when includeDrafts = false
      const resultDraft1 = await getPostBySlug('test-post', false);
      expect(resultDraft1).toBeNull();

      // Should return when includeDrafts = true
      const resultDraft2 = await getPostBySlug('test-post', true);
      expect(resultDraft2).not.toBeNull();
      expect(resultDraft2?.published).toBe(false);
    });
  });

  describe('createPost()', () => {
    it('should create a new post', async () => {
      // Mock profile check
      (doc as jest.Mock).mockReturnValue('profile-doc-ref');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ isAdmin: true })
      });

      // Mock add document
      (collection as jest.Mock).mockReturnValue('posts-collection');
      (addDoc as jest.Mock).mockResolvedValue({
        id: 'new-post-id'
      });

      // Call the function
      const result = await createPost(mockPostData);

      // Check that it verified admin status
      expect(doc).toHaveBeenCalledWith(db, 'profiles', 'test-user-123');
      expect(getDoc).toHaveBeenCalledWith('profile-doc-ref');

      // Check that it created the post
      expect(collection).toHaveBeenCalledWith(db, 'blog_posts');
      expect(addDoc).toHaveBeenCalled();

      // Check the returned data
      expect(result.id).toBe('new-post-id');
      expect(result.title).toBe(mockPostData.title);
    });

    it('should throw error if user is not authenticated', async () => {
      // Mock unauthenticated user
      (getAuth as jest.Mock).mockReturnValue({
        currentUser: null
      });

      try {
        await createPost(mockPostData);
        fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('Failed to create post');
      }
    });

    it('should throw error if user is not an admin', async () => {
      // Restore the authenticated user
      (getAuth as jest.Mock).mockReturnValue({
        currentUser: {
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          getIdToken: jest.fn().mockResolvedValue('mock-token')
        }
      });

      // Mock profile check with non-admin user
      (doc as jest.Mock).mockReturnValue('profile-doc-ref');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ isAdmin: false })
      });

      try {
        await createPost(mockPostData);
        fail('Expected an error to be thrown');
      } catch (error: any) {
        expect(error.message).toBe('Failed to create post');
      }
    });
  });

  describe('updatePost()', () => {
    it('should update an existing post', async () => {
      // Mock update document
      (doc as jest.Mock).mockReturnValue('post-doc-ref');
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      // Call the function
      const updatedPost = { ...mockPost, title: 'Updated Title' };
      const result = await updatePost(updatedPost);

      // Check that it updated the post
      expect(doc).toHaveBeenCalledWith(db, 'blog_posts', mockPost.id);
      expect(updateDoc).toHaveBeenCalledWith('post-doc-ref', expect.objectContaining({
        title: 'Updated Title',
        updatedAt: expect.any(String)
      }));

      // Check the returned data
      expect(result).toEqual(updatedPost);
    });

    it('should throw error if post ID is missing', async () => {
      // Create post without ID
      const postWithoutId = { ...mockPostData };

      // Call the function and expect error
      await expect(updatePost(postWithoutId as any)).rejects.toThrow('Failed to update post');
    });
  });

  describe('deletePost()', () => {
    it('should delete a post', async () => {
      // Mock delete document
      (doc as jest.Mock).mockReturnValue('post-doc-ref');
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      // Call the function
      await deletePost(mockPost.id);

      // Check that it deleted the post
      expect(doc).toHaveBeenCalledWith(db, 'blog_posts', mockPost.id);
      expect(deleteDoc).toHaveBeenCalledWith('post-doc-ref');
    });
  });

  describe('getMostUpvotedPosts()', () => {
    it('should retrieve posts ordered by upvotes', async () => {
      // Mock the Firestore query chain
      (collection as jest.Mock).mockReturnValue('posts-collection');
      (query as jest.Mock).mockReturnValue('posts-query');
      (orderBy as jest.Mock).mockReturnValue('posts-query-with-order');
      (where as jest.Mock).mockReturnValue('posts-query-with-where');

      // Mock query results with different upvote counts
      const mockDocs = [
        { id: 'post-1', data: () => ({ ...mockPostData, title: 'Post 1', upvotes: 10, published: true, date: '2023-05-01T00:00:00.000Z' }) },
        { id: 'post-2', data: () => ({ ...mockPostData, title: 'Post 2', upvotes: 5, published: true, date: '2023-05-02T00:00:00.000Z' }) },
        { id: 'post-3', data: () => ({ ...mockPostData, title: 'Post 3', upvotes: 3, published: false, date: '2023-05-03T00:00:00.000Z' }) }
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
        empty: false,
        size: mockDocs.length
      });

      // Call the function
      const result = await getMostUpvotedPosts({
        limit: 2,
        publishedOnly: true,
        minUpvotes: 5,
        maxAgeDays: 30
      });

      // Check that it called Firestore correctly
      expect(collection).toHaveBeenCalledWith(db, 'blog_posts');
      expect(orderBy).toHaveBeenCalledWith('upvotes', 'desc');
      expect(getDocs).toHaveBeenCalled();

      // Check the returned data - should only return the top 2 published posts with >= 5 upvotes
      expect(result.length).toBe(2);
      expect(result[0].title).toBe('Post 1');
      expect(result[1].title).toBe('Post 2');
    });
  });

  describe('upvotePost() and hasUserUpvoted()', () => {
    beforeEach(() => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ upvoted: true, upvotes: 1 })
      });
    });

    it('should call the upvote API endpoint', async () => {
      // Call the function
      await upvotePost('post-123', 'user-123');

      // Check that it called the API endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/posts/post-123/upvote',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        })
      );
    });

    it('should throw error if user is not authenticated', async () => {
      // Mock unauthenticated user
      (getAuth as jest.Mock).mockReturnValue({
        currentUser: null
      });

      // Call the function and expect error
      await expect(upvotePost('post-123', 'user-123')).rejects.toThrow('Failed to upvote post');
    });

    it('should check if user has upvoted a post', async () => {
      // Mock document retrieval for upvote check
      (doc as jest.Mock).mockReturnValue('upvote-doc-ref');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true
      });

      // Call the function
      const result = await hasUserUpvoted('post-123', 'user-123');

      // Check that it queried the upvote document
      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledWith('upvote-doc-ref');
      expect(result).toBe(true);
    });

    it('should return false when user has not upvoted a post', async () => {
      // Mock document retrieval for upvote check
      (doc as jest.Mock).mockReturnValue('upvote-doc-ref');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false
      });

      // Call the function
      const result = await hasUserUpvoted('post-123', 'user-123');

      // Check result
      expect(result).toBe(false);
    });

    it('should handle null userId in hasUserUpvoted', async () => {
      // Call with null userId
      const result = await hasUserUpvoted('post-123', null);

      // Should return false without checking Firestore
      expect(result).toBe(false);
      expect(doc).not.toHaveBeenCalled();
      expect(getDoc).not.toHaveBeenCalled();
    });
  });
});
