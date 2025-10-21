'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface Props {
  onSubmit: (reason: string) => Promise<void>
  onClose: () => void
}

const REPORT_REASONS = [
  'Spam or advertising',
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Misinformation',
  'Inappropriate content',
  'Other (please specify)'
]

export function ReportModal({ onSubmit, onClose }: Props) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const finalReason = selectedReason === 'Other (please specify)'
      ? customReason
      : selectedReason

    if (!finalReason || finalReason.trim().length < 10) {
      setError('Please provide a detailed reason (at least 10 characters)')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(finalReason)
    } catch (err) {
      setError('Failed to submit report. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-lg shadow-xl max-w-md w-full" style={{ backgroundColor: 'var(--card)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: `1px solid var(--border)` }}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-xl font-semibold">Report Comment</h2>
          </div>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Help us understand what's wrong with this comment. Reports are anonymous.
          </p>

          {/* Reason selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              Reason for reporting
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent"
              style={{
                backgroundColor: 'var(--input)',
                color: 'var(--foreground)',
                borderColor: 'var(--border)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
              required
            >
              <option value="">Select a reason...</option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom reason textarea */}
          {selectedReason === 'Other (please specify)' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Please provide details
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={4}
                placeholder="Describe the issue..."
                className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent resize-none"
                style={{
                  backgroundColor: 'var(--input)',
                  color: 'var(--foreground)',
                  borderColor: 'var(--border)',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
                required
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.color = 'var(--foreground)')}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--destructive)',
                color: 'var(--destructive-foreground)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && selectedReason) {
                  e.currentTarget.style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
