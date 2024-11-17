'use client'

import { useState } from 'react'
import { Announcements } from './announcements/announcements'

type Tab = 'announcements' | 'sticky'

export function Aside() {
  const [activeTab, setActiveTab] = useState<Tab>('announcements')

  return (
    <aside className="w-full lg:w-80 space-y-6">
      {/* Tab buttons */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === 'announcements'
              ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setActiveTab('sticky')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
            activeTab === 'sticky'
              ? 'bg-white dark:bg-gray-700 text-pink-600 dark:text-pink-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Sticky Notes
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        {activeTab === 'announcements' ? (
          <Announcements type="all" />
        ) : (
          <Announcements type="sticky" />
        )}
      </div>
    </aside>
  )
}
