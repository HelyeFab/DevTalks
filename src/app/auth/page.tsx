'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { FaGoogle } from 'react-icons/fa'
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { AlertCircle } from 'lucide-react'

type AuthMode = 'signin' | 'signup'

export default function Auth() {
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get('mode') as AuthMode) || 'signin'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, signInWithGoogle, signUp } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    return {
      isValid: Object.values(requirements).every(Boolean),
      requirements,
    }
  }

  const getErrorMessage = (error: unknown) => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'This email is already registered'
        case 'auth/invalid-email':
          return 'Invalid email address'
        case 'auth/operation-not-allowed':
          return 'Email/password accounts are not enabled'
        case 'auth/weak-password':
          return 'Password is too weak'
        case 'auth/user-not-found':
          return 'No account found with this email'
        case 'auth/wrong-password':
          return 'Incorrect password'
        default:
          return 'An authentication error occurred'
      }
    }
    return 'An unexpected error occurred'
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const auth = getAuth()
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Email sign in error:', error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      return setError('Passwords do not match')
    }

    const { isValid, requirements } = validatePassword(password)
    if (!isValid) {
      const missing = []
      if (!requirements.length) missing.push('at least 8 characters')
      if (!requirements.uppercase) missing.push('an uppercase letter')
      if (!requirements.lowercase) missing.push('a lowercase letter')
      if (!requirements.number) missing.push('a number')
      if (!requirements.special) missing.push('a special character')
      return setError(`Password must contain ${missing.join(', ')}`)
    }

    if (!name.trim()) {
      return setError('Name is required')
    }

    try {
      setLoading(true)
      await signUp(email, password, name)
      router.push('/')
    } catch (error) {
      console.error('Sign up error:', error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign in error:', error)
      setError('Failed to sign in with Google.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const passwordStrength = validatePassword(password)
  const strengthPercentage =
    Object.values(passwordStrength.requirements).filter(Boolean).length * 20

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            {mode === 'signin' ? 'Sign in to DevTalks' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'signin'
              ? 'Join our community of developers'
              : 'Start your journey with DevTalks'
            }
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-muted p-1">
          <button
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              mode === 'signin'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              mode === 'signup'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              <div className="text-sm text-destructive">{error}</div>
            </div>
          </div>
        )}

        {/* Google Sign In */}
        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg shadow-sm bg-card text-card-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle className="h-5 w-5" />
            {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        {mode === 'signin' ? (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="sr-only">
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Confirm Password"
              />
            </div>

            {password && (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strengthPercentage >= 80
                        ? 'bg-green-500'
                        : strengthPercentage >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${strengthPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Password must contain:
                  <ul className="mt-1 space-y-1">
                    <li className={passwordStrength.requirements.length ? 'text-green-600 dark:text-green-400' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={passwordStrength.requirements.uppercase ? 'text-green-600 dark:text-green-400' : ''}>
                      • One uppercase letter
                    </li>
                    <li className={passwordStrength.requirements.lowercase ? 'text-green-600 dark:text-green-400' : ''}>
                      • One lowercase letter
                    </li>
                    <li className={passwordStrength.requirements.number ? 'text-green-600 dark:text-green-400' : ''}>
                      • One number
                    </li>
                    <li className={passwordStrength.requirements.special ? 'text-green-600 dark:text-green-400' : ''}>
                      • One special character
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
