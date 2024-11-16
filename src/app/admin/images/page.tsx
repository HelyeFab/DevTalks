'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { ImageMetadata, listImages, deleteImage } from '@/lib/storage'
import { getAllPosts } from '@/lib/blog'
import Image from 'next/image'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/modal'

export default function ImagesPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [images, setImages] = useState<ImageMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null)
  const [usedImages, setUsedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting to signin - User:', !!user, 'Admin:', isAdmin)
      router.push('/auth/signin')
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get all posts to check which images are in use
        const posts = await getAllPosts(false) // Include drafts
        const usedImageUrls = new Set(posts.map(post => post.image).filter(Boolean))
        setUsedImages(usedImageUrls)

        // Get all images from storage
        const imagesList = await listImages()
        const imagesWithUsage = imagesList.map(img => ({
          ...img,
          inUse: usedImageUrls.has(img.url)
        }))
        setImages(imagesWithUsage)
      } catch (error) {
        console.error('Error loading images:', error)
        setError('Failed to load images. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      loadImages()
    }
  }, [user, isAdmin])

  const handleDelete = async (image: ImageMetadata) => {
    if (image.inUse) {
      setError('Cannot delete image that is in use by a post')
      return
    }

    setSelectedImage(image)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedImage) return

    try {
      await deleteImage(selectedImage.path)
      setImages(images.filter(img => img.path !== selectedImage.path))
      setShowDeleteModal(false)
      setSelectedImage(null)
    } catch (error) {
      console.error('Error deleting image:', error)
      setError('Failed to delete image. Please try again.')
    }
  }

  if (loading) {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Image Management</h1>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading images...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image.path}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover rounded-lg"
                />
              </div>
              
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium truncate" title={image.originalName}>
                  {image.originalName || image.name}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{(image.size / 1024).toFixed(1)} KB</span>
                  <span>{new Date(image.timeCreated).toLocaleDateString()}</span>
                </div>

                {image.altText && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate" title={image.altText}>
                    Alt: {image.altText}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  {image.inUse ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                      In use
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full">
                      Unused
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(image)}
                    disabled={image.inUse}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={image.inUse ? 'Cannot delete image in use' : 'Delete image'}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedImage(null)
        }}
        title="Confirm Delete"
      >
        <div className="mt-2">
          <p>Are you sure you want to delete this image? This action cannot be undone.</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 rounded-lg transition-colors"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedImage(null)
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            onClick={confirmDelete}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
