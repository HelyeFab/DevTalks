'use client'

interface Props {
  status: 'active' | 'inactive'
  isSticky: boolean
  onStatusChange: (status: 'active' | 'inactive') => void
  onStickyChange: (isSticky: boolean) => void
}

export function AnnouncementStatus({ status, isSticky, onStatusChange, onStickyChange }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as 'active' | 'inactive')}
          className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="sticky"
          checked={isSticky}
          onChange={(e) => onStickyChange(e.target.checked)}
          className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
        />
        <label htmlFor="sticky" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Pin to Sticky Notes
        </label>
      </div>
    </div>
  )
}
