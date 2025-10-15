'use client'

import { useEffect, useRef, useState } from 'react'
import { Palette } from 'lucide-react'
import { useColorPalette } from '@/hooks/use-color-palette'
import { clsx } from 'clsx'

export function ColorPaletteSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { palette, setPalette, palettes, mounted } = useColorPalette()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!mounted) {
    return <div className="w-10 h-10" />
  }

  const paletteList = Object.values(palettes)

  const currentPalette = palettes[palette]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
        aria-label="Select color palette"
      >
        <Palette className="h-[1.2rem] w-[1.2rem]" />
        <span className="hidden sm:inline">{currentPalette?.label || 'Theme'}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-popover rounded-xl shadow-lg py-4 px-4 z-50 ring-1 ring-border">
            <h3 className="text-sm font-semibold text-popover-foreground mb-3">
              Choose Theme
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {paletteList.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setPalette(item.name)
                    setIsOpen(false)
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-accent',
                    palette === item.name && 'bg-accent ring-2 ring-primary'
                  )}
                  aria-label={`Select ${item.label} theme`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.preview}`} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-popover-foreground">
                      {item.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Complete color scheme
                    </div>
                  </div>
                  {palette === item.name && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
