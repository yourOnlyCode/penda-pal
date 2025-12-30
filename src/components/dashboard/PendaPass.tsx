'use client'

import { User } from '@prisma/client'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Edit2, MapPin, Save, X, Camera, Video, Share2, ImageIcon, Upload, Pencil, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ActivityCalendar } from './ActivityCalendar'
import { PendaPassEditor } from './PendaPassEditor'
import { getThemeColors, PendaPassTheme } from '@/lib/themes'

interface PendaPassProps {
  user: User & {
    coverImage?: string | null
    city?: string | null
    country?: string | null
    placesVisited?: string[]
    placesWishlist?: string[]
    pendapassTheme?: string | null
  }
  isOwnProfile?: boolean
  activePenpalId?: string
}

export function PendaPass({ user, isOwnProfile = false, activePenpalId }: PendaPassProps) {
  const router = useRouter()
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isEditingImages, setIsEditingImages] = useState(false)
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [dailyStatus, setDailyStatus] = useState('')
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [loading, setLoading] = useState(false)
  const [todayStatus, setTodayStatus] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)
  
  // Get theme colors
  const theme = (user.pendapassTheme as PendaPassTheme) || 'purple'
  const themeColors = getThemeColors(theme)

  // Fetch today's status on mount
  useEffect(() => {
    if (isOwnProfile) {
      fetchTodayStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnProfile])

  const fetchTodayStatus = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const res = await fetch(`/api/user/daily-status?startDate=${today.toISOString()}&endDate=${today.toISOString()}`)
      const data = await res.json()
      if (data.statuses && data.statuses.length > 0) {
        const status = data.statuses[0]
        setTodayStatus(status)
        setDailyStatus(status.content)
        if (status.mediaUrl) {
          setMediaPreview(status.mediaUrl)
          setMediaType(status.mediaType as 'image' | 'video')
        }
      }
    } catch (error) {
      console.error('Failed to fetch today status:', error)
    }
  }

  const handleImageUpload = async (file: File, type: 'cover' | 'profile') => {
    setLoading(true)
    try {
      // Convert to base64 for now (in production, upload to cloud storage)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const uploadRes = await fetch('/api/user/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, type }),
        })
        const uploadData = await uploadRes.json()
        
        // Update user images
        await fetch('/api/user/update-images', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [type === 'cover' ? 'coverImage' : 'image']: uploadData.url,
          }),
        })
        router.refresh()
        setIsEditingImages(false)
        setIsEditMode(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setLoading(false)
    }
  }

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      setMediaType('image')
      const reader = new FileReader()
      reader.onloadend = () => setMediaPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('video/')) {
      setMediaType('video')
      const reader = new FileReader()
      reader.onloadend = () => setMediaPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSaveDailyStatus = async () => {
    if (!dailyStatus.trim()) return
    setLoading(true)
    try {
      await fetch('/api/user/daily-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: dailyStatus,
          mediaUrl: mediaPreview || null,
          mediaType: mediaType || null,
        }),
      })
      setIsEditingStatus(false)
      setMediaPreview(null)
      setMediaType(null)
      router.refresh()
      fetchTodayStatus()
    } catch (error) {
      console.error('Failed to save status', error)
      alert('Failed to save status')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = (platform: string) => {
    const text = dailyStatus || todayStatus?.content || 'Check out my PendaPass!'
    const url = window.location.href
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    }
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    } else if (navigator.share) {
      navigator.share({ text, url }).catch(() => {})
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6 relative">
      {/* Flip Container */}
      <div className="relative" style={{ perspective: '1000px', height: 'auto' }}>
        <div
          className="relative w-full transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Side */}
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 dark:border-white/5 shadow-purple-900/20 dark:shadow-black/50"
            style={{ backfaceVisibility: 'hidden' }}
          >
        
        {/* Header / ID Badge Style */}
        <div className={`absolute top-0 left-0 w-full h-16 bg-gradient-to-r ${themeColors.primary} z-10 opacity-90 flex items-center px-6 justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold tracking-widest text-lg">PENDAPASS</span>
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            {isOwnProfile && (
              <button
                onClick={() => {
                  if (isEditMode) {
                    // Turn off edit mode and close editor
                    setIsEditMode(false)
                    setIsEditingImages(false)
                    setIsEditingStatus(false)
                    setIsEditorOpen(false)
                  } else {
                    // Turn on edit mode and open editor
                    setIsEditorOpen(true)
                    setIsEditMode(true)
                  }
                }}
                className={`p-2 rounded-full transition-all ${
                  isEditMode
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title={isEditMode ? "Exit Edit Mode" : "Edit PendaPass"}
              >
                <Pencil size={16} />
              </button>
            )}
            <div className="text-white/60 text-xs font-mono tracking-widest">
              {user.id.slice(-8).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Cover Image - Editable */}
        <div className="h-48 w-full relative bg-zinc-200 dark:bg-zinc-800 group">
          {(user as any).coverImage ? (
            <Image
              src={(user as any).coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950/30 dark:to-indigo-950/30 flex items-center justify-center">
              <span className="text-purple-300 dark:text-purple-800 text-6xl opacity-20">🐼</span>
            </div>
          )}
          {isOwnProfile && isEditMode && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file, 'cover')
                }}
              />
              <Button
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                <Upload size={14} className="mr-2" />
                Change Cover
              </Button>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="px-6 pb-8 relative">
          {/* Avatar - Floating halfway, Editable */}
          <div className="relative -mt-16 mb-4 flex justify-between items-end">
            <div className="h-32 w-32 rounded-2xl border-4 border-white dark:border-zinc-900 shadow-lg overflow-hidden bg-white dark:bg-zinc-800 relative group">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-50 dark:bg-zinc-800 text-3xl">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              {isOwnProfile && isEditMode && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file, 'profile')
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => profileInputRef.current?.click()}
                    className="bg-white text-purple-600 hover:bg-purple-50 text-xs"
                  >
                    <Upload size={12} className="mr-1" />
                    Change
                  </Button>
                </div>
              )}
            </div>
            
            {/* Location Badge */}
            {((user as any).city || (user as any).country) && (
              <div className={`mb-2 py-1 px-3 ${themeColors.badge} rounded-full border ${themeColors.badgeDark} ${themeColors.accent} text-xs font-medium flex items-center gap-1.5`}>
                <MapPin size={12} />
                <span className="truncate max-w-[120px]">
                  {[(user as any).city, (user as any).country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* User Name */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {user.name || 'Anonymous Panda'}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Member since {new Date(user.createdAt).getFullYear()}
            </p>
          </div>

          {/* Interests - Highlighted */}
          {user.interests && user.interests.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 ${themeColors.secondary} ${themeColors.accent} rounded-full text-xs font-medium border ${themeColors.accentDark}`}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Daily Status Box */}
          <div className="relative group mb-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700/50">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Today's Status</span>
                {isOwnProfile && !isEditingStatus && isEditMode && (
                  <button 
                    onClick={() => setIsEditingStatus(true)}
                    className="text-purple-500 hover:text-purple-600 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
              
              {isEditingStatus ? (
                <div className="space-y-3">
                  <textarea
                    value={dailyStatus}
                    onChange={(e) => setDailyStatus(e.target.value)}
                    placeholder="What are you up to today?"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                    maxLength={280}
                  />
                  
                  {/* Media Upload */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMediaSelect}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs"
                    >
                      <ImageIcon size={14} className="mr-1" />
                      Photo/Video
                    </Button>
                    {mediaPreview && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMediaPreview(null)
                          setMediaType(null)
                        }}
                        className="text-xs text-red-500"
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>

                  {/* Media Preview */}
                  {mediaPreview && (
                    <div className="relative rounded-lg overflow-hidden">
                      {mediaType === 'image' ? (
                        <img src={mediaPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                      ) : (
                        <video src={mediaPreview} controls className="w-full max-h-48" />
                      )}
                    </div>
                  )}

                  {/* Social Share Buttons */}
                  {dailyStatus && (
                    <div className="flex gap-2 items-center pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <span className="text-xs text-zinc-500">Share:</span>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Share on Twitter"
                      >
                        <Share2 size={14} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Share on Facebook"
                      >
                        <Share2 size={14} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Share on LinkedIn"
                      >
                        <Share2 size={14} className="text-blue-700" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setIsEditingStatus(false)
                        setDailyStatus(todayStatus?.content || '')
                        setMediaPreview(todayStatus?.mediaUrl || null)
                        setMediaType(todayStatus?.mediaType as 'image' | 'video' || null)
                      }}
                    >
                      <X size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSaveDailyStatus} 
                      disabled={loading || !dailyStatus.trim()}
                      className={`bg-gradient-to-r ${themeColors.primary} hover:${themeColors.primaryDark} text-white`}
                    >
                      <Save size={14} className="mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {todayStatus ? (
                    <div>
                      <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed italic mb-2">
                        "{todayStatus.content}"
                      </p>
                      {todayStatus.mediaUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                          {todayStatus.mediaType === 'image' ? (
                            <img src={todayStatus.mediaUrl} alt="Status media" className="w-full max-h-48 object-cover rounded" />
                          ) : (
                            <video src={todayStatus.mediaUrl} controls className="w-full max-h-48 rounded" />
                          )}
                        </div>
                      )}
                      {isOwnProfile && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                          <button
                            onClick={() => handleShare('twitter')}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Share on Twitter"
                          >
                            <Share2 size={14} className="text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleShare('facebook')}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Share on Facebook"
                          >
                            <Share2 size={14} className="text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleShare('linkedin')}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Share on LinkedIn"
                          >
                            <Share2 size={14} className="text-blue-700" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm italic">
                      No status today. {isOwnProfile && 'Click edit to add one!'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Mode Indicator */}
          {isEditMode && (
            <div className={`mb-4 p-3 ${themeColors.badge} rounded-lg border ${themeColors.accentDark}`}>
              <span className={`text-xs ${themeColors.accent} font-medium`}>✏️ Edit mode active - Click on images or status to edit</span>
            </div>
          )}

          {/* Decorative Elements */}
          <div className="mt-6 flex gap-2 overflow-hidden opacity-40">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-1 flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            ))}
          </div>

          {/* Flip Button - Triangular Corner */}
          {isOwnProfile && (
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="absolute bottom-0 right-0 w-16 h-16 bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all hover:scale-110 active:scale-95 z-20"
              style={{
                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              }}
              title="Flip PendaPass"
            >
              <div className="absolute bottom-1 right-1">
                <ArrowRight size={20} className="rotate-[-45deg]" />
              </div>
            </button>
          )}
        </div>

          {/* Back Side - Destination Stamps */}
          <div
            className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 dark:border-white/5 shadow-purple-900/20 dark:shadow-black/50"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
                {/* Header */}
                <div className={`absolute top-0 left-0 w-full h-16 bg-gradient-to-r ${themeColors.primary} z-10 opacity-90 flex items-center px-6 justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold tracking-widest text-lg">TRAVEL STAMPS</span>
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              </div>
              <div className="text-white/60 text-xs font-mono tracking-widest">
                {user.id.slice(-8).toUpperCase()}
              </div>
            </div>

            {/* Content */}
            <div className="pt-16 px-6 pb-8">
              {/* Places Visited - Stamps */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">✈️</span>
                  Places I've Been
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {((user as any).placesVisited || []).map((place: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg border-2 border-green-300 dark:border-green-700 p-2 flex flex-col items-center justify-center text-center shadow-md"
                    >
                      <div className="text-2xl mb-1">📍</div>
                      <div className="text-xs font-bold text-green-800 dark:text-green-200 leading-tight">
                        {place}
                      </div>
                      <div className="absolute top-1 right-1 text-green-600 dark:text-green-400 text-xs">✓</div>
                    </div>
                  ))}
                  {/* Empty slots for visited places */}
                  {[...Array(Math.max(0, 6 - ((user as any).placesVisited || []).length))].map((_, idx) => (
                    <div
                      key={`empty-visited-${idx}`}
                      className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center"
                    >
                      <span className="text-zinc-400 text-2xl">+</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Places Wishlist - Empty Blocks */}
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Places I Want to Go
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {((user as any).placesWishlist || []).map((place: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg border-2 border-blue-300 dark:border-blue-700 p-2 flex flex-col items-center justify-center text-center shadow-md"
                    >
                      <div className="text-2xl mb-1">🗺️</div>
                      <div className="text-xs font-bold text-blue-800 dark:text-blue-200 leading-tight">
                        {place}
                      </div>
                    </div>
                  ))}
                  {/* Empty slots for wishlist */}
                  {[...Array(Math.max(0, 6 - ((user as any).placesWishlist || []).length))].map((_, idx) => (
                    <div
                      key={`empty-wishlist-${idx}`}
                      className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center"
                    >
                      <span className="text-zinc-400 text-2xl">+</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Flip Button - Triangular Corner */}
            {isOwnProfile && (
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="absolute bottom-0 right-0 w-16 h-16 bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all hover:scale-110 active:scale-95 z-20"
                style={{
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                }}
                title="Flip PendaPass"
              >
                <div className="absolute bottom-1 right-1">
                  <ArrowRight size={20} className="rotate-[-45deg]" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Slide-out */}
      <PendaPassEditor
        user={user}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setIsEditMode(false)
        }}
      />

      {/* Activity Calendar */}
      {isOwnProfile && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-200 dark:border-zinc-800">
          <ActivityCalendar userId={user.id} penpalId={activePenpalId} />
        </div>
      )}
    </div>
  )
}
