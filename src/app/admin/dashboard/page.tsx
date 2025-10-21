'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import {
  PenSquare,
  FileText,
  LogOut,
  Bell
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading, isAdmin, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const checkAuth = async () => {
      if (!user) {
        console.log('No user found, redirecting to signin')
        router.push('/auth')
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
       color: 'text-primary',
       bgColor: 'bg-primary/10',
     },
     {
       title: 'All Posts',
       description: 'Manage existing posts',
       icon: FileText,
       href: '/admin/posts',
       color: 'text-primary',
       bgColor: 'bg-primary/10',
     },
     {
       title: 'New Project',
       description: 'Create a new project',
       icon: PenSquare,
       href: '/admin/projects/new',
       color: 'text-primary',
       bgColor: 'bg-primary/10',
     },
     {
       title: 'All Projects',
       description: 'Manage existing projects',
       icon: FileText,
       href: '/admin/projects',
       color: 'text-primary',
       bgColor: 'bg-primary/10',
     },
     {
       title: 'Announcements',
       description: 'Manage site announcements',
       icon: Bell,
       href: '/admin/announcements',
       color: 'text-primary',
       bgColor: 'bg-primary/10',
     },
   ]

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Show nothing while loading
  if (loading || !user || !isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
         <button
           onClick={handleLogout}
           className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary rounded-lg hover:bg-accent transition-colors"
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
             className="flex items-start p-6 rounded-lg border border-border hover:border-primary transition-colors"
          >
            <div className={`p-3 rounded-lg ${item.bgColor} mr-4`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1">{item.title}</h2>
               <p className="text-sm text-muted-foreground">
                 {item.description}
               </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
