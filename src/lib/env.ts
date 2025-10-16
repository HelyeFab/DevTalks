/**
 * Environment variable validation and type-safe access
 * This ensures all required environment variables are present
 */

// Client-side environment variables (safe to expose)
export const clientEnv = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  recaptcha: {
    siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  },
} as const

// Server-side environment variables (must be kept secret)
export const serverEnv = {
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : undefined,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  recaptcha: {
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  nodeEnv: process.env.NODE_ENV,
} as const

/**
 * Validates that all required environment variables are present
 * Call this on server startup to fail fast if configuration is missing
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  // Required client variables
  const requiredClient = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ]

  for (const varName of requiredClient) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  // Required server variables (only in production)
  if (process.env.NODE_ENV === 'production') {
    const requiredServer = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
    ]

    for (const varName of requiredServer) {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Checks if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Checks if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Gets a client-side environment variable safely
 */
export function getClientEnv(key: keyof typeof clientEnv): string | undefined {
  const value = clientEnv[key]
  if (typeof value === 'object') {
    return undefined
  }
  return value
}

/**
 * Gets a server-side environment variable safely
 * WARNING: Only call this on the server side
 */
export function getServerEnv(
  category: keyof typeof serverEnv,
  key: string
): string | number | undefined {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv can only be called on the server side')
  }

  const categoryObj = serverEnv[category]
  if (typeof categoryObj === 'object' && categoryObj !== null) {
    return categoryObj[key as keyof typeof categoryObj]
  }

  return undefined
}

/**
 * Logs environment validation status
 * Call this on server startup for debugging
 */
export function logEnvStatus(): void {
  const validation = validateEnv()

  if (!validation.valid) {
    console.warn('⚠️  Missing environment variables:')
    validation.missing.forEach((varName) => {
      console.warn(`   - ${varName}`)
    })

    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Production build requires all environment variables')
      throw new Error('Missing required environment variables')
    } else {
      console.warn('⚠️  Development mode: continuing with missing variables')
    }
  } else {
    console.log('✅ All required environment variables are present')
  }
}

// Auto-validate on import in development
if (isDevelopment() && typeof window === 'undefined') {
  logEnvStatus()
}
