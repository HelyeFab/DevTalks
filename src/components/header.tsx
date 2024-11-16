'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogIn, ChevronDown } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
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

    if (user.image && !imageError) {
      return (
        <img
          src={user.image}
          alt={user.name || 'User avatar'}
          className="h-8 w-8 rounded-full object-cover"
          onError={() => {
            console.log('Failed to load profile image:', user.image)
            setImageError(true)
          }}
          referrerPolicy="no-referrer"
        />
      )
    }

    return (
      <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
        {user.name ? getInitials(user.name) : 'U'}
      </div>
    )
  }

  const renderUserMenu = () => {
    if (!user) return null

    console.log('Rendering user menu:', { isAdmin, userEmail: user.email })

    return (
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 group"
        >
          {renderUserAvatar()}
          <span className="text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {user.name || 'User'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                onClick={() => setShowUserMenu(false)}
              >
                Admin Dashboard
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700"
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
          <div className="h-8 w-20 bg-gray-200 dark:bg-dark-700 rounded animate-pulse" />
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
          className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
        >
          <LogIn className="h-5 w-5" />
          <span>Sign In</span>
        </Link>
        <Link
          href="/auth/signup"
          className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-dark-800">
        <nav className="container mx-auto px-4 max-w-6xl flex items-center justify-between py-4">
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
          >
            DevTalks
          </Link>

          <div className="flex items-center gap-4 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800"
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
                  'text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors',
                  isActive(item.href) && 'text-primary-600 dark:text-primary-400'
                )}
              >
                {item.name}
              </Link>
            ))}

            <div className="h-6 w-px bg-gray-200 dark:bg-dark-700" />
            {renderAuthLinks()}
            <ThemeToggle />
          </div>
        </nav>

        {mobileMenuOpen && (
          <>
            <div className="absolute inset-x-0 top-full bg-white dark:bg-dark-900 shadow-lg md:hidden">
              <nav className="container mx-auto px-4 py-4">
                <div className="flex flex-col space-y-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        'text-lg py-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors',
                        isActive(item.href) && 'text-primary-600 dark:text-primary-400'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="h-px bg-gray-200 dark:bg-dark-700" />
                  {!loading && (
                    <>
                      {user ? (
                        <>
                          <div className="flex items-center gap-2 py-2">
                            {renderUserAvatar()}
                            <span className="text-gray-900 dark:text-gray-100">{user.name || 'User'}</span>
                          </div>
                          {isAdmin && (
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setMobileMenuOpen(false)}
                              className="text-lg py-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              Admin Dashboard
                            </Link>
                          )}
                          <button
                            onClick={handleSignOut}
                            className="text-lg py-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/auth/signin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-lg py-2 flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            <LogIn className="h-5 w-5" />
                            <span>Sign In</span>
                          </Link>
                          <Link
                            href="/auth/signup"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-lg py-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            Sign Up
                          </Link>
                        </>
                      )}
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
        <p>Are you sure you want to sign out?</p>
        <div className="mt-4 flex justify-end gap-4">
          <button
            onClick={() => setShowSignOutModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={confirmSignOut}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
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
        <p>An error occurred while signing out. Please try again.</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setShowErrorModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  )
}
