'use client'

import { useMemo, useState } from 'react'
import { Lightbulb, Wand2, Calendar, TrendingUp, Copy, Check } from 'lucide-react'

interface SEOSuggestionsProps {
  title: string
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
  tags: string[]
  onApplySuggestion: (field: 'title' | 'metaTitle' | 'metaDescription', value: string) => void
}

interface Suggestion {
  id: string
  type: 'title' | 'metaTitle' | 'metaDescription'
  icon: 'year' | 'keyword' | 'power' | 'length'
  label: string
  suggestion: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

const POWER_WORDS = [
  'Complete', 'Ultimate', 'Essential', 'Comprehensive', 'Best', 'Top',
  'Guide', 'Tutorial', 'Explained', 'Mastering', 'Advanced', 'Beginner',
  'Pro', 'Expert', 'Quick', 'Easy', 'Simple', 'Practical'
]

const CURRENT_YEAR = new Date().getFullYear()

export function SEOSuggestions({
  title,
  metaTitle,
  metaDescription,
  focusKeyword,
  tags,
  onApplySuggestion
}: SEOSuggestionsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const suggestions = useMemo(() => {
    const suggs: Suggestion[] = []
    const titleToCheck = metaTitle || title

    // 1. Add Year to Title (Highest Priority from SEO Audit!)
    if (!titleToCheck.includes(CURRENT_YEAR.toString())) {
      const yearAdded = `${titleToCheck} ${CURRENT_YEAR}`
      const yearAddedOptimal = yearAdded.length <= 60 ? yearAdded :
        `${titleToCheck.substring(0, 55 - CURRENT_YEAR.toString().length - 1)} ${CURRENT_YEAR}`

      suggs.push({
        id: 'add-year',
        type: metaTitle ? 'metaTitle' : 'title',
        icon: 'year',
        label: 'Add Current Year',
        suggestion: yearAddedOptimal,
        reason: `Google prioritizes fresh content. Adding "${CURRENT_YEAR}" signals recency and can improve rankings.`,
        priority: 'high'
      })
    }

    // 2. Front-load Focus Keyword in Title
    if (focusKeyword && titleToCheck && !titleToCheck.toLowerCase().startsWith(focusKeyword.toLowerCase().substring(0, 10))) {
      // Extract main keyword (first word if multi-word)
      const mainKeyword = focusKeyword.split(' ')[0]
      const titleLower = titleToCheck.toLowerCase()

      if (titleLower.includes(focusKeyword.toLowerCase())) {
        // Keyword exists but not at the front
        const optimized = `${focusKeyword}: ${titleToCheck.replace(new RegExp(focusKeyword, 'i'), '').trim()}`
        if (optimized.length <= 60) {
          suggs.push({
            id: 'frontload-keyword',
            type: metaTitle ? 'metaTitle' : 'title',
            icon: 'keyword',
            label: 'Front-load Keyword',
            suggestion: optimized,
            reason: 'Keywords at the start of titles have more weight. Front-loading can improve click-through rates.',
            priority: 'high'
          })
        }
      } else {
        // Keyword missing entirely
        const withKeyword = `${focusKeyword} - ${titleToCheck}`
        if (withKeyword.length <= 60) {
          suggs.push({
            id: 'add-keyword',
            type: metaTitle ? 'metaTitle' : 'title',
            icon: 'keyword',
            label: 'Add Focus Keyword',
            suggestion: withKeyword,
            reason: 'Focus keyword is missing from title. Adding it is crucial for SEO.',
            priority: 'high'
          })
        }
      }
    }

    // 3. Add Power Words to Title
    const hasPowerWord = POWER_WORDS.some(word =>
      titleToCheck.toLowerCase().includes(word.toLowerCase())
    )

    if (!hasPowerWord && titleToCheck.length < 50) {
      const powerWord = focusKeyword && focusKeyword.toLowerCase().includes('tutorial') ? 'Complete' :
                       focusKeyword && focusKeyword.toLowerCase().includes('guide') ? 'Ultimate' :
                       titleToCheck.toLowerCase().includes('how') ? 'Complete' : 'Essential'

      const withPowerWord = `${powerWord} ${titleToCheck}`
      if (withPowerWord.length <= 60) {
        suggs.push({
          id: 'add-power-word',
          type: metaTitle ? 'metaTitle' : 'title',
          icon: 'power',
          label: 'Add Power Word',
          suggestion: withPowerWord,
          reason: 'Power words like "Complete," "Ultimate," or "Essential" increase click-through rates.',
          priority: 'medium'
        })
      }
    }

    // 4. Optimize Title Length (50-60 chars is optimal)
    const titleLength = titleToCheck.length
    if (titleLength < 40) {
      // Title too short - suggest expansion
      const expansion = focusKeyword && !titleToCheck.includes(focusKeyword) ?
        `${titleToCheck}: ${focusKeyword} Guide ${CURRENT_YEAR}` :
        `${titleToCheck} - Complete Guide ${CURRENT_YEAR}`

      if (expansion.length <= 60) {
        suggs.push({
          id: 'expand-title',
          type: metaTitle ? 'metaTitle' : 'title',
          icon: 'length',
          label: 'Expand Title',
          suggestion: expansion,
          reason: `Title is only ${titleLength} characters. Optimal length is 50-60 characters for better SEO.`,
          priority: 'medium'
        })
      }
    } else if (titleLength > 60) {
      // Title too long - suggest truncation
      const truncated = titleToCheck.substring(0, 57) + '...'
      suggs.push({
        id: 'truncate-title',
        type: metaTitle ? 'metaTitle' : 'title',
        icon: 'length',
        label: 'Shorten Title',
        suggestion: truncated,
        reason: `Title is ${titleLength} characters. Google truncates at ~60. Shorter titles perform better.`,
        priority: 'high'
      })
    }

    // 5. Optimize Meta Description
    if (!metaDescription || metaDescription.length < 120) {
      // Generate meta description from title, keyword, and tags
      const keywords = [focusKeyword, ...tags.slice(0, 2)].filter(Boolean).join(', ')
      const cta = 'Learn more'

      let generated = `Learn ${focusKeyword || title.toLowerCase()} with our comprehensive guide. `
      generated += `Master ${keywords}. ${cta}!`

      if (generated.length >= 120 && generated.length <= 155) {
        suggs.push({
          id: 'generate-meta-desc',
          type: 'metaDescription',
          icon: 'keyword',
          label: 'Generate Meta Description',
          suggestion: generated,
          reason: metaDescription ?
            `Current description is only ${metaDescription.length} chars. Optimal is 120-155.` :
            'Meta description is missing. This is critical for SEO and click-through rates.',
          priority: 'high'
        })
      }
    }

    // 6. Add Call-to-Action to Meta Description
    if (metaDescription && !metaDescription.match(/learn|discover|get|start|find|master|explore/i)) {
      const ctaWords = ['Learn more →', 'Get started →', 'Discover how →', 'Start learning →']
      const randomCTA = ctaWords[Math.floor(Math.random() * ctaWords.length)]

      // Add CTA if there's room
      const withCTA = metaDescription.length + randomCTA.length + 1 <= 155 ?
        `${metaDescription} ${randomCTA}` :
        metaDescription.substring(0, 155 - randomCTA.length - 4) + `... ${randomCTA}`

      suggs.push({
        id: 'add-cta',
        type: 'metaDescription',
        icon: 'power',
        label: 'Add Call-to-Action',
        suggestion: withCTA,
        reason: 'CTAs in meta descriptions can increase click-through rates by 20-30%.',
        priority: 'medium'
      })
    }

    // Sort by priority
    return suggs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [title, metaTitle, metaDescription, focusKeyword, tags])

  const handleApply = (suggestion: Suggestion) => {
    onApplySuggestion(suggestion.type, suggestion.suggestion)
  }

  const handleCopy = (suggestion: Suggestion) => {
    navigator.clipboard.writeText(suggestion.suggestion)
    setCopiedId(suggestion.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Check className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Excellent SEO Optimization!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your content follows all SEO best practices. No suggestions at this time.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">SEO Suggestions</h3>
        <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
          {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
        </span>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`border rounded-lg p-4 space-y-3 transition-colors ${
              suggestion.priority === 'high'
                ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                : suggestion.priority === 'medium'
                ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10'
                : 'border-border bg-muted/30'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {suggestion.icon === 'year' && <Calendar className="h-4 w-4 text-blue-600" />}
                {suggestion.icon === 'keyword' && <TrendingUp className="h-4 w-4 text-purple-600" />}
                {suggestion.icon === 'power' && <Wand2 className="h-4 w-4 text-green-600" />}
                {suggestion.icon === 'length' && <Lightbulb className="h-4 w-4 text-yellow-600" />}
                <span className="font-medium text-sm">{suggestion.label}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                suggestion.priority === 'high'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : suggestion.priority === 'medium'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {suggestion.priority}
              </span>
            </div>

            {/* Reason */}
            <p className="text-sm text-muted-foreground">
              {suggestion.reason}
            </p>

            {/* Suggestion Preview */}
            <div className="bg-background border border-border rounded p-3">
              <p className="text-sm font-mono text-foreground">
                {suggestion.suggestion}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {suggestion.suggestion.length} characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleApply(suggestion)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Wand2 className="h-4 w-4" />
                Apply Suggestion
              </button>
              <button
                onClick={() => handleCopy(suggestion)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                title="Copy to clipboard"
              >
                {copiedId === suggestion.id ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Pro tip:</strong> Applying these suggestions can improve your search rankings and click-through rates by 20-40%.
        </p>
      </div>
    </div>
  )
}
