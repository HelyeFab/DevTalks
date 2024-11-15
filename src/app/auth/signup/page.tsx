'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { FirebaseError } from 'firebase/app'
import { AlertCircle } from 'lucide-react'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signUp } = useAuth()

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
        default:
          return 'Failed to create an account'
      }
    }
    return 'An unexpected error occurred'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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
      setError('')
      setLoading(true)
      await signUp(email, password, name)
      router.push('/blog')
    } catch (error) {
      console.error('Sign up error:', error)
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = validatePassword(password)
  const strengthPercentage = 
    Object.values(passwordStrength.requirements).filter(Boolean).length * 20

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your account
            </Link>
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-sm text-red-700 dark:text-red-400">{error}</div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
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
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
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
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
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
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm dark:bg-gray-800"
                placeholder="Confirm Password"
              />
            </div>
          </div>

          {password && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
              <div className="text-xs text-gray-600 dark:text-gray-400">
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
