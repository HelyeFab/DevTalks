'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogIn, ChevronDown } from 'lucide-react'
import { ColorPaletteSelector } from './ui/color-palette-selector'
import { Modal } from './modal'
import { clsx } from 'clsx'
import { useAuth } from '@/contexts/auth-context'

const navigation = [
  { name: 'Blog', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Projects', href: '/projects' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [imageError, setImageError] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const { user, loading, isAdmin, signOut } = useAuth()

  useEffect(() => {
    setMobileMenuOpen(false)
    setShowUserMenu(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    if (href.startsWith('/#')) {
      return false
    }
    return pathname.startsWith(href)
  }

  const handleSignOut = () => {
    setShowSignOutModal(true)
    setShowUserMenu(false)
  }

  const confirmSignOut = async () => {
    try {
      await signOut()
      setShowSignOutModal(false)
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
      setShowErrorModal(true)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const renderUserAvatar = () => {
    if (!user) return null

    if (user.photoURL && !imageError) {
      return (
        <img
          src={user.photoURL}
          alt={user.displayName || 'User avatar'}
          className="h-8 w-8 rounded-full object-cover object-center-top"
          onError={() => {
            console.log('Failed to load profile image:', user.photoURL)
            setImageError(true)
          }}
          referrerPolicy="no-referrer"
        />
      )
    }

    return (
      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
        {user.displayName ? getInitials(user.displayName) : 'U'}
      </div>
    )
  }

  const renderUserMenu = () => {
    if (!user) return null

    return (
      <div className="relative inline-block text-left" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 group"
        >
          {renderUserAvatar()}
          <span className="text-foreground group-hover:text-primary">
            {user.displayName || 'User'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg py-1 z-[100] ring-1 ring-border">
            <Link
              href="/user/profile"
              className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
              onClick={() => setShowUserMenu(false)}
            >
              Profile
            </Link>
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                onClick={() => setShowUserMenu(false)}
              >
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderAuthLinks = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-4">
          <div className="h-8 w-20 bg-muted rounded animate-pulse" />
        </div>
      )
    }

    if (user) {
      return renderUserMenu()
    }

    return (
      <div className="flex items-center gap-4">
        <Link
          href="/auth/signin"
          className="text-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          <LogIn className="h-5 w-5" />
          <span>Sign In</span>
        </Link>
        <Link
          href="/auth/signup"
          className="text-foreground hover:text-primary transition-colors"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-background backdrop-blur-md border-b border-border">
        <nav className="container mx-auto px-6 max-w-6xl flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-4 group"
          >
            <span className="hidden md:block font-mulish text-4xl font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors">
              DevTalks
            </span>
            <div className="flex items-center justify-center w-10 h-10 bg-primary group-hover:bg-primary-hover rounded-lg transition-colors">
              <span className="font-mulish text-base font-semibold tracking-wider text-primary-foreground">
                DT
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            <ColorPaletteSelector />
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-accent text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                href={item.href}
                key={item.name}
                className={clsx(
                  'text-foreground hover:text-primary transition-colors',
                  isActive(item.href) && 'text-primary'
                )}
              >
                {item.name}
              </Link>
            ))}

            <div className="h-6 w-px bg-border" />

            {renderAuthLinks()}
            <ColorPaletteSelector />
          </div>
        </nav>

        {mobileMenuOpen && (
          <>
            <div className="absolute inset-x-0 top-full bg-background shadow-lg md:hidden border-b border-border">
              <nav className="container mx-auto px-4 py-4">
                <div className="flex flex-col space-y-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        'text-lg py-2 text-foreground hover:text-primary transition-colors',
                        isActive(item.href) && 'text-primary'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}

                  {user && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="flex items-center gap-2 py-2">
                        {renderUserAvatar()}
                        <span className="text-foreground">{user.displayName || 'User'}</span>
                      </div>
                      <Link
                        href="/user/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg py-2 text-foreground hover:text-primary transition-colors"
                      >
                        Profile
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-lg py-2 text-foreground hover:text-primary transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="text-left text-lg py-2 text-foreground hover:text-primary transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  )}

                  {!user && (
                    <>
                      <div className="h-px bg-border" />
                      <Link
                        href="/auth/signin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg py-2 text-foreground hover:text-primary transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg py-2 text-foreground hover:text-primary transition-colors"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
            <div
              className="fixed inset-0 bg-black/20 md:hidden"
              style={{ top: '73px' }}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
          </>
        )}
      </header>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign Out Confirmation"
      >
        <p className="text-card-foreground">Are you sure you want to sign out?</p>
        <div className="mt-4 flex justify-end gap-4">
          <button
            onClick={() => setShowSignOutModal(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmSignOut}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
      >
        <p className="text-card-foreground">An error occurred while signing out. Please try again.</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowErrorModal(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  )
}
