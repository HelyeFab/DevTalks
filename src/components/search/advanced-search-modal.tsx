'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Search as SearchIcon, Loader2, Filter, X, Calendar, Tag, User } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { BlogPost } from '@/types/blog'

interface SearchFilters {
  query: string
  tags: string[]
  author: string
  dateFrom: string
  dateTo: string
  sortBy: 'date' | 'title' | 'relevance'
  sortOrder: 'asc' | 'desc'
}

interface SearchResult extends BlogPost {
  relevanceScore?: number
}

export function AdvancedSearchModal({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableAuthors, setAvailableAuthors] = useState<string[]>([])
  const [isLoadingFilters, setIsLoadingFilters] = useState(false)

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    author: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'relevance',
    sortOrder: 'desc'
  })

  // Load available tags and authors when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFilterOptions()
    }
  }, [isOpen])

  // Perform search when filters change
  useEffect(() => {
    if (!isOpen) return

    const delayDebounce = setTimeout(async () => {
      await performSearch()
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [filters, isOpen])

  const loadFilterOptions = async () => {
    setIsLoadingFilters(true)
    try {
      const postsRef = collection(db, 'blog_posts')
      const q = query(
        postsRef,
        where('published', '==', true),
        orderBy('date', 'desc')
      )
      const querySnapshot = await getDocs(q)

      const tags = new Set<string>()
      const authors = new Set<string>()

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach((tag: string) => tags.add(tag))
        }
        if (data.author?.name) {
          authors.add(data.author.name)
        }
      })

      setAvailableTags(Array.from(tags).sort())
      setAvailableAuthors(Array.from(authors).sort())
    } catch (err) {
      console.error('Error loading filter options:', err)
    } finally {
      setIsLoadingFilters(false)
    }
  }

  const performSearch = async () => {
    // If no search criteria, clear results
    if (!filters.query.trim() && filters.tags.length === 0 && !filters.author && !filters.dateFrom && !filters.dateTo) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const postsRef = collection(db, 'blog_posts')
      // Add pagination limit of 100 posts to improve performance
      const q = query(
        postsRef,
        where('published', '==', true),
        orderBy('date', 'desc'),
        limit(100)
      )
      const querySnapshot = await getDocs(q)

      const searchResults: SearchResult[] = []
      const searchTerms = filters.query.toLowerCase().split(' ').filter(term => term.length > 0)

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const post: BlogPost = {
          id: doc.id,
          title: data.title || '',
          subtitle: data.subtitle || '',
          content: data.content || '',
          excerpt: data.excerpt || '',
          image: data.image,
          imageAlt: data.imageAlt,
          tags: data.tags || [],
          author: data.author || { name: '', email: '' },
          date: data.date || '',
          slug: data.slug || '',
          published: data.published || false,
          upvotes: data.upvotes || 0,
          readTime: data.readTime || 0
        }

        // Apply filters
        let matches = true
        let relevanceScore = 0

        // Text search
        if (filters.query.trim()) {
          const title = post.title.toLowerCase()
          const content = post.content.toLowerCase()
          const excerpt = (post.excerpt || '').toLowerCase()

          const titleMatches = searchTerms.filter(term => title.includes(term)).length
          const contentMatches = searchTerms.filter(term => content.includes(term)).length
          const excerptMatches = searchTerms.filter(term => excerpt.includes(term)).length

          if (titleMatches === 0 && contentMatches === 0 && excerptMatches === 0) {
            matches = false
          } else {
            // Calculate relevance score
            relevanceScore = (titleMatches * 3) + (excerptMatches * 2) + contentMatches
          }
        }

        // Tag filter
        if (filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some(tag => post.tags.includes(tag))
          if (!hasMatchingTag) {
            matches = false
          } else {
            relevanceScore += filters.tags.filter(tag => post.tags.includes(tag)).length
          }
        }

        // Author filter
        if (filters.author && post.author.name !== filters.author) {
          matches = false
        }

        // Date filters
        if (filters.dateFrom) {
          const postDate = new Date(post.date)
          const fromDate = new Date(filters.dateFrom)
          if (postDate < fromDate) {
            matches = false
          }
        }

        if (filters.dateTo) {
          const postDate = new Date(post.date)
          const toDate = new Date(filters.dateTo)
          toDate.setHours(23, 59, 59, 999) // End of day
          if (postDate > toDate) {
            matches = false
          }
        }

        if (matches) {
          searchResults.push({ ...post, relevanceScore })
        }
      })

      // Sort results
      searchResults.sort((a, b) => {
        switch (filters.sortBy) {
          case 'title':
            return filters.sortOrder === 'asc'
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title)
          case 'date':
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
          case 'relevance':
          default:
            return (b.relevanceScore || 0) - (a.relevanceScore || 0)
        }
      })

      setResults(searchResults)
    } catch (err) {
      console.error('Error searching posts:', err)
      setError('Failed to search posts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilter('tags', [...filters.tags, tag])
    }
  }

  const removeTag = (tag: string) => {
    updateFilter('tags', filters.tags.filter(t => t !== tag))
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      tags: [],
      author: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'relevance',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = filters.tags.length > 0 || filters.author || filters.dateFrom || filters.dateTo

  return (
    <>
      {children ? (
        <div onClick={() => setIsOpen(true)}>
          {children}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <SearchIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Search posts</span>
        </button>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Search Posts"
      >
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              className="w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-3 top-3.5">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {hasActiveFilters && (
                <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                  {filters.tags.length + (filters.author ? 1 : 0) + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  onChange={(e) => e.target.value && addTag(e.target.value)}
                  value=""
                  disabled={isLoadingFilters}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{isLoadingFilters ? 'Loading tags...' : 'Select a tag...'}</option>
                  {availableTags.filter(tag => !filters.tags.includes(tag)).map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Author
                </label>
                <select
                  value={filters.author}
                  onChange={(e) => updateFilter('author', e.target.value)}
                  disabled={isLoadingFilters}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{isLoadingFilters ? 'Loading authors...' : 'Any author'}</option>
                  {availableAuthors.map(author => (
                    <option key={author} value={author}>{author}</option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="title">Title</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => updateFilter('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Results */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {results.length} post{results.length !== 1 ? 's' : ''}
                </p>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/blog/${result.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="block py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-4 px-4 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {result.title}
                      </h3>
                      {result.excerpt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {result.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{result.author.name}</span>
                        <span>{new Date(result.date).toLocaleDateString()}</span>
                        {result.tags.length > 0 && (
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {result.tags.length > 3 && (
                              <span className="text-gray-400">+{result.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (filters.query.trim() || hasActiveFilters) && !isLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                No posts found matching your search criteria.
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  )
}
