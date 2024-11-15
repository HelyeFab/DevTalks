'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { 
  PenSquare, 
  FileText, 
  Settings, 
  BarChart3, 
  Image as ImageIcon,
  LogOut 
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading, isAdmin, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const checkAuth = async () => {
      if (!user) {
        console.log('No user found, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      if (!isAdmin) {
        console.log('User not admin, redirecting to home:', user.email)
        router.push('/')
        return
      }

      console.log('Auth check passed:', { email: user.email, isAdmin })
    }

    checkAuth()
  }, [user, loading, isAdmin, router])

  const menuItems = [
    {
      title: 'New Post',
      description: 'Create a new blog post',
      icon: PenSquare,
      href: '/admin/posts/new',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Posts',
      description: 'Manage your blog posts',
      icon: FileText,
      href: '/admin/posts',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Images',
      description: 'Manage uploaded images',
      icon: ImageIcon,
      href: '/admin/images',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Analytics',
      description: 'View site analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'Settings',
      description: 'Manage site settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Show nothing while loading
  if (loading || !user || !isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-start p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
          >
            <div className={`p-3 rounded-lg ${item.bgColor} mr-4`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">{item.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
