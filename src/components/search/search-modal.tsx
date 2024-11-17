'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Search as SearchIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

interface SearchResult {
  id: string
  title: string
  description: string
  slug: string
}

export function SearchModal({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const searchTerms = searchQuery.toLowerCase().split(' ')
        const postsRef = collection(db, 'blog_posts')
        const q = query(postsRef, where('published', '==', true))
        const querySnapshot = await getDocs(q)
        
        const searchResults: SearchResult[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          const content = (data.content || '').toLowerCase()
          const title = (data.title || '').toLowerCase()
          const description = (data.description || '').toLowerCase()
          
          // Check if any search term is included in the post
          const matchesSearch = searchTerms.some(term => 
            title.includes(term) || 
            description.includes(term) || 
            content.includes(term)
          )

          if (matchesSearch) {
            searchResults.push({
              id: doc.id,
              title: data.title,
              description: data.description,
              slug: data.slug,
            })
          }
        })

        setResults(searchResults)
      } catch (err) {
        console.error('Error searching posts:', err)
        setError('Failed to search posts. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }, 300) // Debounce delay

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  const handleOpenSearch = () => {
    setIsOpen(true)
    setSearchQuery('')
    setResults([])
  }

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
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 text-gray-900 dark:text-gray-100 bg-white dark:bg-dark-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="space-y-2">
            {results.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/blog/${result.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="block py-3 hover:bg-gray-50 dark:hover:bg-dark-700/50 -mx-4 px-4 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {result.title}
                    </h3>
                    {result.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : searchQuery.trim() && !isLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                No posts found matching your search.
              </p>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  )
}
