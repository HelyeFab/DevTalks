'use client'

import { useState, useEffect } from 'react'
import { getAllPosts } from '@/lib/blog'

interface EditorData {
  popularTags: Array<{ name: string; count: number }>
  suggestedKeywords: string[]
  recentCategories: string[]
  loading: boolean
}

export function useEditorData() {
  const [data, setData] = useState<EditorData>({
    popularTags: [],
    suggestedKeywords: [],
    recentCategories: [],
    loading: true
  })

  useEffect(() => {
    async function fetchEditorData() {
      try {
        // Fetch all published posts to analyze patterns
        const result = await getAllPosts({ publishedOnly: true })
        const posts = result.items

        // Calculate popular tags
        const tagCounts: Record<string, number> = {}
        const categories = new Set<string>()

        posts.forEach(post => {
          // Count tag frequency
          post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })

          // Collect categories from SEO metadata
          if (post.seo?.category) {
            categories.add(post.seo.category)
          }
        })

        // Sort tags by frequency
        const popularTags = Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        // Generate suggested keywords based on popular tags
        const suggestedKeywords = popularTags
          .slice(0, 5)
          .map(tag => tag.name)

        setData({
          popularTags,
          suggestedKeywords,
          recentCategories: Array.from(categories).slice(0, 5),
          loading: false
        })
      } catch (error) {
        console.error('Error fetching editor data:', error)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchEditorData()
  }, [])

  return data
}
