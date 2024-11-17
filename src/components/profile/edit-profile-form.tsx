'use client'

import { useState, useRef, useEffect } from 'react'
import { User, updateProfile } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth } from '@/lib/firebase'
import Image from 'next/image'
import { getProfile, updateProfile as updateProfileData } from '@/lib/profile'
import type { UserProfile } from '@/types/profile'

const DEFAULT_AVATAR = '/images/default-avatar.svg'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface SocialLinks {
  twitter?: string
  github?: string
  linkedin?: string
}

interface EditProfileFormProps {
  user: User
  onClose: () => void
  onUpdate: () => void
}

export function EditProfileForm({ user, onClose, onUpdate }: EditProfileFormProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [bio, setBio] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Load existing profile data
  useEffect(() => {
    async function loadProfile() {
      const profile = await getProfile(user.uid)
      if (profile) {
        setBio(profile.bio || '')
        setSocialLinks(profile.socialLinks || {})
      }
    }
    loadProfile()
  }, [user.uid])

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image size should be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSocialLinkChange = (platform: keyof SocialLinks) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSocialLinks(prev => ({
      ...prev,
      [platform]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Update profile picture if changed
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0]
        const storage = getStorage()
        const imageRef = ref(storage, `profile-pictures/${user.uid}`)
        await uploadBytes(imageRef, file)
        const photoURL = await getDownloadURL(imageRef)
        await updateProfile(auth.currentUser!, { photoURL })
      }

      // Update display name
      if (displayName.trim() !== user.displayName) {
        await updateProfile(auth.currentUser!, {
          displayName: displayName.trim() || null
        })
      }

      // Update profile data in Firestore
      await updateProfileData(user.uid, {
        bio,
        socialLinks,
      })

      onUpdate()
      onClose()
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture */}
      <div className="flex flex-col items-center">
        <div 
          onClick={handleImageClick}
          className="relative h-24 w-24 cursor-pointer group"
        >
          <Image
            src={previewImage || user.photoURL || DEFAULT_AVATAR}
            alt="Profile picture"
            width={96}
            height={96}
            className="rounded-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm">Change</span>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Max file size: 5MB
        </p>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-pink-500 focus:ring-pink-500"
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-pink-500 focus:ring-pink-500"
          placeholder="Tell us about yourself..."
        />
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Social Links</h3>
        <div>
          <label htmlFor="twitter" className="block text-sm text-gray-600 dark:text-gray-400">
            Twitter
          </label>
          <input
            type="url"
            id="twitter"
            value={socialLinks.twitter || ''}
            onChange={handleSocialLinkChange('twitter')}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-pink-500 focus:ring-pink-500"
            placeholder="https://twitter.com/username"
          />
        </div>
        <div>
          <label htmlFor="github" className="block text-sm text-gray-600 dark:text-gray-400">
            GitHub
          </label>
          <input
            type="url"
            id="github"
            value={socialLinks.github || ''}
            onChange={handleSocialLinkChange('github')}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-pink-500 focus:ring-pink-500"
            placeholder="https://github.com/username"
          />
        </div>
        <div>
          <label htmlFor="linkedin" className="block text-sm text-gray-600 dark:text-gray-400">
            LinkedIn
          </label>
          <input
            type="url"
            id="linkedin"
            value={socialLinks.linkedin || ''}
            onChange={handleSocialLinkChange('linkedin')}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-pink-500 focus:ring-pink-500"
            placeholder="https://linkedin.com/in/username"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
