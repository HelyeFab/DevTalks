'use client'

import { Search } from 'lucide-react'
import { SearchModal } from './search-modal'

export function FloatingSearchButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-pink-500/50 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
        <SearchModal>
          <button
            className="relative flex items-center justify-center w-12 h-12 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Search posts"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
        </SearchModal>
      </div>
    </div>
  )
}
