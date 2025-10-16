'use client'

import { useState } from 'react'
import { X, Upload, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from './modal'

interface LocalImage {
  alt: string
  src: string
  originalPath: string
}

interface ImageUploadHelperProps {
  localImages: Array<{ alt: string; src: string; isLocal: boolean }>
  onImagesUploaded: (mappings: Record<string, string>) => void
  onSkip: () => void
}

export function ImageUploadHelper({ localImages, onImagesUploaded, onSkip }: ImageUploadHelperProps) {
  const [isOpen, setIsOpen] = useState(localImages.length > 0)
  const [uploadedMappings, setUploadedMappings] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const localImagesList: LocalImage[] = localImages
    .filter(img => img.isLocal)
    .map(img => ({
      alt: img.alt,
      src: img.src,
      originalPath: img.src
    }))

  const handleFileUpload = async (localPath: string, file: File) => {
    setUploading(prev => ({ ...prev, [localPath]: true }))

    try {
      // Create a FormData object to upload the image
      const formData = new FormData()
      formData.append('image', file)
      formData.append('path', `blog-images/${Date.now()}-${file.name}`)

      // Call your image upload API
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const { url } = await response.json()

      setUploadedMappings(prev => ({
        ...prev,
        [localPath]: url
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(prev => ({ ...prev, [localPath]: false }))
    }
  }

  const handleComplete = () => {
    onImagesUploaded(uploadedMappings)
    setIsOpen(false)
  }

  const handleSkip = () => {
    onSkip()
    setIsOpen(false)
  }

  if (localImagesList.length === 0) {
    return null
  }

  const uploadedCount = Object.keys(uploadedMappings).length
  const totalCount = localImagesList.length
  const allUploaded = uploadedCount === totalCount

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleSkip}
      title="Local Images Detected"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Your markdown contains {totalCount} local image{totalCount > 1 ? 's' : ''}</p>
            <p className="mt-1 text-blue-600 dark:text-blue-300">
              Upload them to Firebase Storage or skip to use the original paths
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {localImagesList.map((img, index) => {
            const isUploaded = uploadedMappings[img.originalPath]
            const isUploading = uploading[img.originalPath]

            return (
              <div
                key={index}
                className="flex items-start gap-3 p-4 border border-border rounded-lg"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{img.originalPath}</p>
                  {img.alt && (
                    <p className="text-xs text-muted-foreground mt-1">Alt: {img.alt}</p>
                  )}

                  {isUploaded && (
                    <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Uploaded</span>
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {isUploaded ? (
                    <button
                      type="button"
                      onClick={() => {
                        const newMappings = { ...uploadedMappings }
                        delete newMappings[img.originalPath]
                        setUploadedMappings(newMappings)
                      }}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Remove uploaded image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(img.originalPath, file)
                          }
                        }}
                        disabled={isUploading}
                      />
                      <div
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                          isUploading
                            ? 'bg-muted text-muted-foreground cursor-wait'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </div>
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress */}
        {uploadedCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {uploadedCount} / {totalCount}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(uploadedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Skip for Now
          </button>
          <button
            type="button"
            onClick={handleComplete}
            disabled={!allUploaded && uploadedCount > 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              allUploaded
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : uploadedCount > 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {allUploaded ? 'Complete' : uploadedCount > 0 ? 'Upload All First' : 'Continue Without Uploading'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
