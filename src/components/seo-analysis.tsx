'use client'

import { AlertTriangle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'

interface SEOAnalysisProps {
  title: string
  metaTitle?: string
  metaDescription?: string
  content: string
  focusKeyword?: string
  slug: string
  imageAlt?: string
}

interface SEOCheck {
  label: string
  status: 'pass' | 'warning' | 'fail'
  message: string
  score: number
}

export function SEOAnalysis({
  title,
  metaTitle,
  metaDescription,
  content,
  focusKeyword,
  slug,
  imageAlt
}: SEOAnalysisProps) {
  // Removed useMemo - 2025 best practice: only memoize when profiling shows performance issues
  const checks: SEOCheck[] = []
  let totalScore = 0

    // 1. Title Length Check (50-60 characters optimal)
    const titleToCheck = metaTitle || title
    const titleLength = titleToCheck.length
    if (titleLength >= 50 && titleLength <= 60) {
      checks.push({
        label: 'Title Length',
        status: 'pass',
        message: `Perfect! (${titleLength} characters)`,
        score: 15
      })
      totalScore += 15
    } else if (titleLength >= 40 && titleLength < 70) {
      checks.push({
        label: 'Title Length',
        status: 'warning',
        message: `Could be better (${titleLength} characters). Aim for 50-60.`,
        score: 10
      })
      totalScore += 10
    } else {
      checks.push({
        label: 'Title Length',
        status: 'fail',
        message: `${titleLength < 40 ? 'Too short' : 'Too long'} (${titleLength} characters)`,
        score: 0
      })
    }

    // 2. Meta Description Length (50-160 characters)
    if (metaDescription) {
      const descLength = metaDescription.length
      if (descLength >= 120 && descLength <= 160) {
        checks.push({
          label: 'Meta Description',
          status: 'pass',
          message: `Excellent! (${descLength} characters)`,
          score: 15
        })
        totalScore += 15
      } else if (descLength >= 50 && descLength < 200) {
        checks.push({
          label: 'Meta Description',
          status: 'warning',
          message: `Could be optimized (${descLength} characters). Aim for 120-160.`,
          score: 10
        })
        totalScore += 10
      } else {
        checks.push({
          label: 'Meta Description',
          status: 'fail',
          message: `${descLength < 50 ? 'Too short' : 'Too long'} (${descLength} characters)`,
          score: 0
        })
      }
    } else {
      checks.push({
        label: 'Meta Description',
        status: 'fail',
        message: 'Missing meta description',
        score: 0
      })
    }

    // 3. Focus Keyword in Title
    if (focusKeyword) {
      const titleLower = titleToCheck.toLowerCase()
      const keywordLower = focusKeyword.toLowerCase()
      if (titleLower.includes(keywordLower)) {
        checks.push({
          label: 'Keyword in Title',
          status: 'pass',
          message: `Focus keyword found in title!`,
          score: 10
        })
        totalScore += 10
      } else {
        checks.push({
          label: 'Keyword in Title',
          status: 'warning',
          message: 'Focus keyword not in title',
          score: 0
        })
      }

      // 4. Keyword in Meta Description
      if (metaDescription) {
        const descLower = metaDescription.toLowerCase()
        if (descLower.includes(keywordLower)) {
          checks.push({
            label: 'Keyword in Description',
            status: 'pass',
            message: 'Focus keyword found in meta description!',
            score: 10
          })
          totalScore += 10
        } else {
          checks.push({
            label: 'Keyword in Description',
            status: 'warning',
            message: 'Focus keyword not in meta description',
            score: 0
          })
        }
      }

      // 5. Keyword Density in Content
      const contentLower = content.toLowerCase()
      const keywordCount = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
      const wordCount = content.split(/\s+/).length
      const density = (keywordCount / wordCount) * 100

      if (density >= 0.5 && density <= 2.5) {
        checks.push({
          label: 'Keyword Density',
          status: 'pass',
          message: `Good keyword density (${density.toFixed(2)}%)`,
          score: 10
        })
        totalScore += 10
      } else if (density > 0 && density < 5) {
        checks.push({
          label: 'Keyword Density',
          status: 'warning',
          message: `${density < 0.5 ? 'Too low' : 'Too high'} keyword density (${density.toFixed(2)}%)`,
          score: 5
        })
        totalScore += 5
      } else {
        checks.push({
          label: 'Keyword Density',
          status: 'fail',
          message: density === 0 ? 'Keyword not found in content' : `Keyword stuffing detected (${density.toFixed(2)}%)`,
          score: 0
        })
      }
    } else {
      checks.push({
        label: 'Focus Keyword',
        status: 'warning',
        message: 'No focus keyword set',
        score: 0
      })
    }

    // 6. Content Length (optimal: 1000-2000 words)
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length
    if (wordCount >= 1000 && wordCount <= 3000) {
      checks.push({
        label: 'Content Length',
        status: 'pass',
        message: `Great content length (${wordCount} words)`,
        score: 15
      })
      totalScore += 15
    } else if (wordCount >= 500) {
      checks.push({
        label: 'Content Length',
        status: 'warning',
        message: `${wordCount < 1000 ? 'Consider adding more content' : 'Very long content'} (${wordCount} words)`,
        score: 10
      })
      totalScore += 10
    } else {
      checks.push({
        label: 'Content Length',
        status: 'fail',
        message: `Too short (${wordCount} words). Aim for 1000+.`,
        score: 0
      })
    }

    // 7. Slug Check
    const slugLength = slug.length
    if (slugLength > 0 && slugLength <= 60 && /^[a-z0-9-]+$/.test(slug)) {
      checks.push({
        label: 'URL Slug',
        status: 'pass',
        message: 'SEO-friendly slug',
        score: 10
      })
      totalScore += 10
    } else {
      checks.push({
        label: 'URL Slug',
        status: 'warning',
        message: slugLength === 0 ? 'Slug is empty' : 'Slug could be optimized',
        score: 5
      })
      totalScore += 5
    }

    // 8. Image Alt Text
    if (imageAlt && imageAlt.length > 10) {
      checks.push({
        label: 'Image Alt Text',
        status: 'pass',
        message: 'Alt text provided for featured image',
        score: 10
      })
      totalScore += 10
    } else {
      checks.push({
        label: 'Image Alt Text',
        status: 'warning',
        message: imageAlt ? 'Alt text too short' : 'No alt text for featured image',
        score: 0
      })
    }

    // 9. Heading Structure
    const h1Count = (content.match(/<h1|^#\s/gm) || []).length
    const h2Count = (content.match(/<h2|^##\s/gm) || []).length

    if (h1Count <= 1 && h2Count >= 2) {
      checks.push({
        label: 'Heading Structure',
        status: 'pass',
        message: 'Good heading hierarchy',
        score: 10
      })
      totalScore += 10
    } else {
      checks.push({
        label: 'Heading Structure',
        status: 'warning',
        message: h1Count > 1 ? 'Multiple H1 tags detected' : 'Add more H2 headings',
        score: 5
      })
      totalScore += 5
    }

    // 10. Content Freshness (Year in Title)
    const currentYear = new Date().getFullYear()
    const hasYear = titleToCheck.includes(currentYear.toString())

    if (hasYear) {
      checks.push({
        label: 'Content Freshness',
        status: 'pass',
        message: `Year (${currentYear}) included in title - signals fresh content!`,
        score: 10
      })
      totalScore += 10
    } else {
      checks.push({
        label: 'Content Freshness',
        status: 'warning',
        message: `Add "${currentYear}" to title for freshness signal (14% of ranking algorithm!)`,
        score: 0
      })
    }

  const maxScore = 115
  const scorePercentage = Math.round((totalScore / maxScore) * 100)
  const scoreColor = scorePercentage >= 80 ? 'text-green-600' : scorePercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
  const scoreBg = scorePercentage >= 80 ? 'bg-green-100 dark:bg-green-900/20' : scorePercentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          SEO Analysis
        </h3>
        <div className={`${scoreBg} ${scoreColor} px-4 py-2 rounded-lg font-bold text-lg`}>
          {scorePercentage}%
        </div>
      </div>

      <div className="space-y-3">
        {checks.map((check, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="mt-0.5">
              {check.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {check.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
              {check.status === 'fail' && <XCircle className="h-5 w-5 text-red-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground">{check.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
            </div>
            <div className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {check.score}/{
                check.label === 'Title Length' || check.label === 'Meta Description' || check.label === 'Content Length' ? '15' :
                check.label.includes('Keyword') || check.label === 'URL Slug' || check.label === 'Image Alt Text' || check.label === 'Heading Structure' || check.label === 'Content Freshness' ? '10' : '5'
              }
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {scorePercentage >= 80 && 'Excellent! Your post is well-optimized for search engines.'}
          {scorePercentage >= 60 && scorePercentage < 80 && 'Good start! Address the warnings to improve SEO.'}
          {scorePercentage < 60 && 'Needs improvement. Focus on the failed checks first.'}
        </p>
      </div>
    </div>
  )
}
