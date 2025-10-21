'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useAdmin } from '@/contexts/admin-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Shield, AlertTriangle, Trash2, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import type { Comment, ReportCommentData } from '@/types/comment'
import { formatDistanceToNow } from 'date-fns'

interface ReportedComment {
  comment: Comment
  reports: ReportCommentData[]
}

export default function AdminCommentsPage() {
  const [reportedComments, setReportedComments] = useState<ReportedComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/')
      toast.error('Access denied. Admin privileges required.')
    }
  }, [isAdmin, adminLoading, router])

  useEffect(() => {
    if (isAdmin && user) {
      fetchReportedComments()
    }
  }, [isAdmin, user])

  const fetchReportedComments = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/admin/comments/reports', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reported comments')
      }

      const data = await response.json()
      setReportedComments(data)
    } catch (error) {
      console.error('Error fetching reported comments:', error)
      toast.error('Failed to load reported comments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (
    reportId: string,
    commentId: string,
    action: 'dismiss' | 'hide' | 'delete'
  ) => {
    if (!user) return

    try {
      const response = await fetch('/api/admin/comments/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ reportId, commentId, action })
      })

      if (!response.ok) {
        throw new Error('Failed to process report')
      }

      toast.success(`Report ${action}ed successfully`)
      fetchReportedComments() // Refresh the list
    } catch (error) {
      console.error('Error processing report:', error)
      toast.error('Failed to process report')
    }
  }

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold">Comment Moderation</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage reported comments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Reports</p>
                <p className="text-3xl font-bold text-yellow-600">{reportedComments.length}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-yellow-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                <p className="text-3xl font-bold text-blue-600">
                  {reportedComments.reduce((acc, rc) => acc + rc.reports.length, 0)}
                </p>
              </div>
              <Shield className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comments Flagged</p>
                <p className="text-3xl font-bold text-red-600">{reportedComments.length}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Reported Comments */}
        <div className="space-y-6">
          {reportedComments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-12 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                No reported comments to review at this time.
              </p>
            </div>
          ) : (
            reportedComments.map(({ comment, reports }) => (
              <div
                key={comment.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Comment Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{comment.author.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                        {reports.length} {reports.length === 1 ? 'report' : 'reports'}
                      </span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 mb-4">{comment.content}</p>

                    {/* Reports */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Report Reasons:
                      </p>
                      {reports.map((report, idx) => (
                        <div
                          key={report.id}
                          className="pl-4 border-l-2 border-yellow-400 py-1"
                        >
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {idx + 1}. {report.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() =>
                      handleAction(reports[0].id || '', comment.id, 'dismiss')
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Dismiss Report
                  </button>
                  <button
                    onClick={() =>
                      handleAction(reports[0].id || '', comment.id, 'hide')
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:text-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 rounded-md transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide Comment
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to permanently delete this comment?')) {
                        handleAction(reports[0].id || '', comment.id, 'delete')
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Comment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
