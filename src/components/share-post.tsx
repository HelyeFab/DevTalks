'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Link2, Twitter, Facebook, Linkedin, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface SharePostProps {
  title: string
  url: string
}

export function SharePost({ title, url }: SharePostProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const shareItems = [
    {
      name: 'Copy Link',
      Icon: Link2,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url)
          toast.success('Link copied to clipboard!')
        } catch (err) {
          toast.error('Failed to copy link')
        }
        setIsOpen(false)
      }
    },
    {
      name: 'Twitter',
      Icon: Twitter,
      onClick: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank')
        setIsOpen(false)
      }
    },
    {
      name: 'Facebook',
      Icon: Facebook,
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        setIsOpen(false)
      }
    },
    {
      name: 'LinkedIn',
      Icon: Linkedin,
      onClick: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
        setIsOpen(false)
      }
    },
    {
      name: 'WhatsApp',
      Icon: MessageCircle,
      onClick: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, '_blank')
        setIsOpen(false)
      }
    }
  ]

  return (
    <div className="relative" ref={dropdownRef} style={{ position: 'static' }}>
      <button
        onClick={(e) => {
          e.stopPropagation() // Prevent card click
          setIsOpen(!isOpen)
        }}
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Share post"
      >
        <Share2 className="h-4 w-4" />
      </button>

      {isOpen && (
        <div 
          className="fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1"
          style={{
            top: dropdownRef.current ? 
              Math.min(
                dropdownRef.current.getBoundingClientRect().bottom + 5,
                window.innerHeight - 220
              ) : 0,
            left: dropdownRef.current ? 
              Math.min(
                dropdownRef.current.getBoundingClientRect().left,
                window.innerWidth - 192
              ) : 0,
          }}
        >
          {shareItems.map((item) => {
            const IconComponent = item.Icon
            return (
              <button
                key={item.name}
                onClick={(e) => {
                  e.stopPropagation() // Prevent card click
                  item.onClick()
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {item.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
