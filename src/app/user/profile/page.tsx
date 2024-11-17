'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import { Twitter, Github, Linkedin, Link as LinkIcon, Camera, Edit2 } from 'lucide-react'
import type { UserProfile } from '@/types/profile'

const DEFAULT_AVATAR = '/images/default-avatar.svg'
const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'

interface SocialLink {
  name: 'twitter' | 'github' | 'linkedin'
  icon: typeof Twitter | typeof Github | typeof Linkedin
  label: string
  placeholder: string
  baseUrl: string
}

const socialLinks: SocialLink[] = [
  {
    name: 'twitter',
    icon: Twitter,
    label: 'Twitter',
    placeholder: 'username',
    baseUrl: 'https://twitter.com/'
  },
  {
    name: 'github',
    icon: Github,
    label: 'GitHub',
    placeholder: 'username',
    baseUrl: 'https://github.com/'
  },
  {
    name: 'linkedin',
    icon: Linkedin,
    label: 'LinkedIn',
    placeholder: 'username or full URL',
    baseUrl: 'https://linkedin.com/in/'
  }
]

export default function UserProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false)
  const [adminSetupError, setAdminSetupError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [isEditingSocial, setIsEditingSocial] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [socialInputs, setSocialInputs] = useState<Record<string, string>>({})
  const [displayName, setDisplayName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
    if (user) {
      setDisplayName(user.displayName || '')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid)
        const profileSnap = await getDoc(profileRef)
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfile
          setProfileData(data)
          setSocialInputs(data.socialLinks || {})
        }
      }
    }
    fetchProfile()
  }, [user])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const storage = getStorage()
      const storageRef = ref(storage, `profile-pictures/${user.uid}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      await updateProfile(user, {
        photoURL: downloadURL
      })

      // Force refresh
      router.refresh()
    } catch (error) {
      console.error('Error updating profile picture:', error)
      setSaveError('Failed to update profile picture')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveError(null)

    try {
      await updateProfile(user, {
        displayName
      })

      setIsEditingProfile(false)
      // Force refresh
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      setSaveError('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetupAdmin = async () => {
    if (!user || user.email !== ADMIN_EMAIL) {
      setAdminSetupError('Only the admin email can set up admin privileges')
      return
    }

    setIsSettingUpAdmin(true)
    setAdminSetupError(null)

    try {
      const profileRef = doc(db, 'profiles', user.uid)
      await setDoc(profileRef, {
        isAdmin: true,
        email: user.email,
        name: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString()
      }, { merge: true })

      // Refresh profile data
      const profileSnap = await getDoc(profileRef)
      setProfileData(profileSnap.data() as UserProfile)
    } catch (error) {
      console.error('Error setting up admin:', error)
      setAdminSetupError('Failed to set up admin profile')
    } finally {
      setIsSettingUpAdmin(false)
    }
  }

  const handleSaveSocial = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const profileRef = doc(db, 'profiles', user.uid)
      await setDoc(profileRef, {
        socialLinks: socialInputs,
        updatedAt: new Date().toISOString()
      }, { merge: true })

      // Update local state
      setProfileData(prev => ({
        ...prev!,
        socialLinks: socialInputs,
        updatedAt: new Date().toISOString()
      }))
      setIsEditingSocial(false)
    } catch (error) {
      console.error('Error saving social links:', error)
      setSaveError('Failed to save social links')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSocialInputChange = (name: string, value: string) => {
    setSocialInputs(prev => ({
      ...prev,
      [name]: value
    }))
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

  if (!user) {
    return null // This will be handled by the useEffect redirect
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Your Profile</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative h-24 w-24 group">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'Profile picture'}
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = DEFAULT_AVATAR
                    target.onerror = null // Prevent infinite loop
                  }}
                />
              ) : (
                <Image
                  src={DEFAULT_AVATAR}
                  alt="Default profile picture"
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              )}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isSaving}
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div>
              {isEditingProfile ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900"
                    placeholder="Display Name"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-3 py-1 text-sm bg-pink-600 hover:bg-pink-700 text-white rounded-lg disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {user?.displayName || 'User'}
                    </h2>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{user?.email}</p>
                  {!isEditingSocial && (
                    <button
                      onClick={() => setIsEditingSocial(true)}
                      className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      <span>Edit Social Links</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Role
              </label>
              <p className="text-gray-900 dark:text-white">
                {profileData?.isAdmin ? 'Admin' : 'User'}
              </p>
            </div>

            {/* Social Links Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Social Links</h3>

              {isEditingSocial ? (
                <div className="space-y-4">
                  {socialLinks.map(({ name, icon: Icon, label, placeholder }) => (
                    <div key={name} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-gray-500" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={socialInputs[name] || ''}
                          onChange={(e) => handleSocialInputChange(name, e.target.value)}
                          placeholder={placeholder}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 dark:bg-gray-900"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setIsEditingSocial(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSocial}
                      disabled={isSaving}
                      className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  {saveError && (
                    <p className="text-red-500 mt-2 text-sm">{saveError}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {socialLinks.map(({ name, icon: Icon, label, baseUrl }) => {
                    const username = profileData?.socialLinks?.[name]
                    const url = username ? (
                      username.startsWith('http') ? username : `${baseUrl}${username}`
                    ) : null

                    return (
                      <div key={name} className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-500" />
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-700 flex items-center gap-1"
                          >
                            {label}
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-500">Not set</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {user.email === ADMIN_EMAIL && !profileData?.isAdmin && (
                <div>
                  <button
                    onClick={handleSetupAdmin}
                    disabled={isSettingUpAdmin}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isSettingUpAdmin ? 'Setting up...' : 'Setup Admin Profile'}
                  </button>
                  {adminSetupError && (
                    <p className="text-red-500 mt-2 text-sm">{adminSetupError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
