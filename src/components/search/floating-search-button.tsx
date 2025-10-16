'use client'

import { Search } from 'lucide-react'
import { AdvancedSearchModal } from './advanced-search-modal'

export function FloatingSearchButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-primary/50 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
        <AdvancedSearchModal>
          <button
            type="button"
            className="relative flex items-center justify-center w-14 h-14 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-primary-foreground/20"
            aria-label="Search posts"
          >
            <Search className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
          </button>
        </AdvancedSearchModal>
      </div>
    </div>
  )

}
