'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { PenSquare, Trash2, Eye } from 'lucide-react'
import { getAllPosts, deletePost, updatePost, type BlogPost } from '@/lib/blog'

export default function PostsList() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting to signin - User:', !!user, 'Admin:', isAdmin)
      router.push('/auth/signin')
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    async function fetchPosts() {
      try {
        console.log('Fetching all posts including drafts...')
        const fetchedPosts = await getAllPosts(false) // Get all posts, including drafts
        console.log('Fetched posts:', fetchedPosts)
        setPosts(fetchedPosts)
      } catch (error) {
        console.error('Error fetching posts:', error)
        setError('Failed to load posts')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchPosts()
    }
  }, [user, isAdmin])

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      await deletePost(postId)
      setPosts(posts.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      setError('Failed to delete post')
    }
  }

  const handleTogglePublish = async (post: BlogPost) => {
    if (!post.id) return

    try {
      const newStatus = !post.published
      await updatePost(post.id, { 
        published: newStatus,
        publishedAt: newStatus ? new Date().toISOString() : null
      })
      setPosts(posts.map(p => 
        p.id === post.id ? { 
          ...p, 
          published: newStatus,
          publishedAt: newStatus ? new Date().toISOString() : null
        } : p
      ))
    } catch (error) {
      console.error('Error updating post:', error)
      setError('Failed to update post')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create New Post
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {post.subtitle}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePublish(post)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {post.published && (
                        <Link
                          href={`/blog/${post.slug}`}
                          className="p-1 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500"
                          title="View"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                      )}
                      <Link
                        href={`/admin/posts/edit/${post.id}`}
                        className="p-1 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500"
                        title="Edit"
                      >
                        <PenSquare className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => post.id && handleDelete(post.id)}
                        className="p-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
