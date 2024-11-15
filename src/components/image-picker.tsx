'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import imageCompression from 'browser-image-compression'

interface ImagePickerProps {
  onImageSelected: (url: string, alt?: string) => void
  currentImage?: string
  currentAlt?: string
  className?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const STORAGE_PATH = 'blog-images'
const MIN_DIMENSIONS = { width: 600, height: 400 } // More reasonable minimum size
const RECOMMENDED_DIMENSIONS = { width: 1200, height: 630 } // Social media recommended
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
}

export function ImagePicker({ 
  onImageSelected, 
  currentImage, 
  currentAlt = '', 
  className = '' 
}: ImagePickerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState(currentImage)
  const [error, setError] = useState<string | null>(null)
  const [altText, setAltText] = useState(currentAlt)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        resolve(
          img.width >= MIN_DIMENSIONS.width && 
          img.height >= MIN_DIMENSIONS.height
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve(false)
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const validateFile = async (file: File): Promise<string | null> => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image size should be less than 5MB.'
    }
    const hasSufficientDimensions = await validateDimensions(file)
    if (!hasSufficientDimensions) {
      return `Image dimensions should be at least ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} pixels.`
    }
    return null
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset states
    setError(null)
    setUploadProgress(0)

    try {
      // Validate file
      const validationError = await validateFile(file)
      if (validationError) {
        setError(validationError)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      setIsUploading(true)
      console.log('Starting image upload process:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        timestamp: new Date().toISOString()
      })

      // Compress image
      setUploadProgress(10)
      console.log('Compressing image...')
      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS)
      setUploadProgress(30)
      console.log('Compression complete:', {
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      })

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
        console.log('Preview URL created')
      }
      reader.readAsDataURL(compressedFile)
      setUploadProgress(40)

      // Generate filename and path
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '')
      const uniqueFilename = `${timestamp}-${sanitizedName}`
      const fullPath = `${STORAGE_PATH}/${uniqueFilename}`
      
      console.log('Preparing upload:', {
        path: fullPath,
        sanitizedName,
        uniqueFilename
      })

      // Create storage reference
      const storageRef = ref(storage, fullPath)
      setUploadProgress(50)

      // Upload to Firebase Storage
      console.log('Starting Firebase upload...')
      const metadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          altText: altText || '',
          originalSize: file.size.toString(),
          compressedSize: compressedFile.size.toString(),
        }
      }

      const snapshot = await uploadBytes(storageRef, compressedFile, metadata)
      setUploadProgress(80)
      console.log('Upload complete:', {
        fullPath: snapshot.metadata.fullPath,
        size: `${(snapshot.metadata.size / 1024 / 1024).toFixed(2)}MB`,
        contentType: snapshot.metadata.contentType,
        timeCreated: snapshot.metadata.timeCreated
      })

      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref)
      setUploadProgress(100)
      console.log('Download URL obtained:', {
        url: downloadUrl,
        path: fullPath
      })

      onImageSelected(downloadUrl, altText)
    } catch (error) {
      console.error('Detailed upload error:', error)
      setError(error instanceof Error 
        ? `Upload failed: ${error.message}` 
        : 'Failed to upload image. Please try again.'
      )
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClick = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const handleRemove = () => {
    setPreviewUrl(undefined)
    setError(null)
    setAltText('')
    onImageSelected('', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAltTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAltText = e.target.value
    setAltText(newAltText)
    if (previewUrl) {
      onImageSelected(previewUrl, newAltText)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={ALLOWED_FILE_TYPES.join(',')}
        className="hidden"
        aria-label="Upload image"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {previewUrl ? (
        <div className="space-y-4">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={previewUrl}
              alt={altText || "Post cover"}
              fill
              className="object-cover rounded-lg"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              title="Remove image"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label htmlFor="alt-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alt Text (for accessibility)
            </label>
            <input
              id="alt-text"
              type="text"
              value={altText}
              onChange={handleAltTextChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
              placeholder="Describe the image for screen readers"
            />
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="w-full aspect-[16/9] flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
          aria-label="Upload image"
        >
          <Upload className="h-8 w-8 text-gray-400 dark:text-gray-600" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isUploading ? 'Uploading...' : 'Click to upload cover image'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            JPEG, PNG or WebP, min {MIN_DIMENSIONS.width}x{MIN_DIMENSIONS.height} pixels
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Recommended: {RECOMMENDED_DIMENSIONS.width}x{RECOMMENDED_DIMENSIONS.height} for social media
          </span>
          {isUploading && (
            <div className="w-full max-w-xs mt-2">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
        </button>
      )}
    </div>
  )
}
