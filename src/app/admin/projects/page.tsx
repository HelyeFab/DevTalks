'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PenSquare, Trash2, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { getAllProjects, deleteProject, updateProject, type Project } from '@/lib/projects'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { toast } from 'sonner'

export default function ProjectsList() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting to signin - User:', !!user, 'Admin:', isAdmin)
      router.push('/auth')
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    async function fetchProjects() {
      try {
        console.log('Fetching all projects...')
        const result = await getAllProjects()
        console.log('Fetched projects:', result)
        setProjects(result.items)
      } catch (error) {
        console.error('Error fetching projects:', error)
        setError('Failed to load projects')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchProjects()
    }
  }, [user, isAdmin])

  const handleToggleFeatured = async (project: Project) => {
    if (!project.id) return

    try {
      const newStatus = !project.featured
      await updateProject(project.id, { featured: newStatus })
      setProjects(projects.map(p =>
        p.id === project.id ? { ...p, featured: newStatus } : p
      ))
    } catch (error) {
      console.error('Error updating project:', error)
      setError('Failed to update project')
    }
  }

  const handleDelete = async (projectId: string) => {
    setProjectToDelete(projectId)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return

    try {
      await deleteProject(projectToDelete)
      setProjects(projects.filter(project => project.id !== projectToDelete))
      toast.success('Project deleted successfully')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setProjectToDelete(null)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/admin/projects/new"
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Create New
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Technologies
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {project.subtitle}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleFeatured(project)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.featured
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {project.featured ? 'Featured' : 'Standard'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech: string) => (
                        <span
                          key={tech}
                          className="px-2 py-1 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/projects/${project.slug}`}
                        className="p-1 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      <Link
                        href={`/admin/projects/edit/${project.id}`}
                        className="p-1 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500"
                        title="Edit"
                      >
                        <PenSquare className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => project.id && handleDelete(project.id)}
                        className="p-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
