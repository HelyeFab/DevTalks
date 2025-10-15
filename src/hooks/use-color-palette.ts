'use client'

import { useEffect, useState } from 'react'
import { colorPalettes, defaultPalette } from '@/lib/theme-colors'

const STORAGE_KEY = 'color-palette'

export function useColorPalette() {
  const [palette, setPaletteState] = useState<string>(defaultPalette)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && colorPalettes[stored]) {
      setPaletteState(stored)
      applyPalette(stored)
    } else {
      applyPalette(defaultPalette)
    }
  }, [])

  const setPalette = (newPalette: string) => {
    if (!colorPalettes[newPalette]) return

    setPaletteState(newPalette)
    localStorage.setItem(STORAGE_KEY, newPalette)
    applyPalette(newPalette)
  }

  const applyPalette = (paletteName: string) => {
    const palette = colorPalettes[paletteName]
    if (!palette) return

    const root = document.documentElement
    const colors = palette.colors

    // Apply all color variables
    root.style.setProperty('--background', colors.background)
    root.style.setProperty('--foreground', colors.foreground)
    root.style.setProperty('--card', colors.card)
    root.style.setProperty('--card-foreground', colors.cardForeground)
    root.style.setProperty('--popover', colors.popover)
    root.style.setProperty('--popover-foreground', colors.popoverForeground)
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--primary-foreground', colors.primaryForeground)
    root.style.setProperty('--primary-hover', colors.primaryHover)
    root.style.setProperty('--secondary', colors.secondary)
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground)
    root.style.setProperty('--muted', colors.muted)
    root.style.setProperty('--muted-foreground', colors.mutedForeground)
    root.style.setProperty('--accent', colors.accent)
    root.style.setProperty('--accent-foreground', colors.accentForeground)
    root.style.setProperty('--border', colors.border)
    root.style.setProperty('--input', colors.input)
    root.style.setProperty('--ring', colors.ring)

    // Handle pattern class for Playful Pets theme
    if (palette.pattern) {
      root.classList.add('theme-with-pattern')
    } else {
      root.classList.remove('theme-with-pattern')
    }

    // Store the theme name as a data attribute
    root.setAttribute('data-color-palette', paletteName)
  }

  return {
    palette,
    setPalette,
    palettes: colorPalettes,
    mounted,
  }
}
