'use client'

import { ref, deleteObject, listAll, getMetadata, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export interface ImageMetadata {
  path: string
  url: string
  name: string
  contentType: string
  size: number
  timeCreated: string
  altText?: string
  originalName?: string
  inUse?: boolean
}

export async function deleteImage(path: string): Promise<void> {
  try {
    const imageRef = ref(storage, path)
    await deleteObject(imageRef)
    console.log('Image deleted successfully:', path)
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
}

export async function listImages(prefix = 'blog-images'): Promise<ImageMetadata[]> {
  try {
    console.log('Listing images from prefix:', prefix)
    const folderRef = ref(storage, prefix)
    const result = await listAll(folderRef)
    
    const metadataPromises = result.items.map(async (item) => {
      try {
        const [metadata, url] = await Promise.all([
          getMetadata(item),
          getDownloadURL(item)
        ])

        return {
          path: item.fullPath,
          url,
          name: item.name,
          contentType: metadata.contentType || '',
          size: metadata.size,
          timeCreated: metadata.timeCreated,
          altText: metadata.customMetadata?.altText,
          originalName: metadata.customMetadata?.originalName,
        }
      } catch (error) {
        console.error('Error processing image:', item.fullPath, error)
        return null
      }
    })

    const results = await Promise.all(metadataPromises)
    const validResults = results.filter((item): item is ImageMetadata => item !== null)
    
    console.log('Successfully listed images:', validResults.length)
    return validResults
  } catch (error) {
    console.error('Error listing images:', error)
    throw new Error('Failed to list images')
  }
}

export async function cleanupUnusedImages(usedImages: string[]): Promise<void> {
  try {
    const allImages = await listImages()
    const unusedImages = allImages.filter(img => !usedImages.includes(img.url))
    
    for (const image of unusedImages) {
      await deleteImage(image.path)
      console.log('Cleaned up unused image:', image.path)
    }
  } catch (error) {
    console.error('Error cleaning up images:', error)
    throw new Error('Failed to cleanup images')
  }
}
