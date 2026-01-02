'use client'

import { User } from '@prisma/client'
import Image from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Edit2, MapPin, Save, X, Camera, Video, Share2, ImageIcon, Upload, Pencil, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ActivityCalendar } from './ActivityCalendar'
import { PendaPassEditor } from './PendaPassEditor'
import { PendaGame } from './PendaGame'
import { getThemeColors, PendaPassTheme } from '@/lib/themes'
import { CheckCircle2 } from 'lucide-react'

interface PendaPassProps {
  user: User & {
    coverImage?: string | null
    city?: string | null
    country?: string | null
    placesVisited?: string[]
    placesWishlist?: string[]
    pendapassTheme?: string | null
    highScore?: number | null
    pendaCoins?: number | null
  }
  isOwnProfile?: boolean
  activePenpalId?: string
  onGameModeToggleRef?: (toggle: () => void) => void
}

export function PendaPass({ user, isOwnProfile = false, activePenpalId, onGameModeToggleRef }: PendaPassProps) {
  const router = useRouter()
  const [isEditMode, setIsEditMode] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isGameMode, setIsGameMode] = useState(false)
  const [isEditingImages, setIsEditingImages] = useState(false)
  const [dailyStatus, setDailyStatus] = useState('')
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [loading, setLoading] = useState(false)
  const [todayStatus, setTodayStatus] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)
  
  // Get theme colors
  const theme = (user.pendapassTheme as PendaPassTheme) || 'purple'
  const themeColors = getThemeColors(theme)

  // Handle Game Over
  const handleGameOver = async (score: number) => {
    try {
      await fetch('/api/user/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to save score:', error)
    }
  }

  // Handle Game Mode Toggle - memoized to prevent infinite loops
  const toggleGameMode = useCallback(() => {
    setIsGameMode((prev) => {
      const newValue = !prev
      // Update flipped state - React batches these updates automatically
      setIsFlipped(newValue)
      return newValue
    })
  }, [])

  // Expose toggleGameMode to parent via callback
  useEffect(() => {
    if (onGameModeToggleRef && isOwnProfile) {
      onGameModeToggleRef(toggleGameMode)
    }
  }, [onGameModeToggleRef, isOwnProfile, toggleGameMode])

  // Ensure flip back goes to main view
  const handleFlip = () => {
    if (isFlipped) {
      // Flipping back to front
      setIsFlipped(false)
      // Delay disabling game mode until flip is done (optional, but simpler to just set false immediately or keep true?
      // If we flip back, we want to see the front. 
      // If we are in game mode, we probably want to exit game mode when flipping back.
      setTimeout(() => setIsGameMode(false), 300) 
    } else {
      setIsFlipped(true)
    }
  }

  // Get theme color filter for pandas
  const getThemeFilter = (themeName: PendaPassTheme): string => {
    const filters: Record<PendaPassTheme, string> = {
      purple: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(240deg) brightness(95%) contrast(85%)',
      blue: 'brightness(0) saturate(100%) invert(37%) sepia(98%) saturate(1352%) hue-rotate(195deg) brightness(95%) contrast(91%)',
      green: 'brightness(0) saturate(100%) invert(47%) sepia(98%) saturate(1352%) hue-rotate(95deg) brightness(95%) contrast(91%)',
      pink: 'brightness(0) saturate(100%) invert(37%) sepia(98%) saturate(1352%) hue-rotate(315deg) brightness(95%) contrast(91%)',
      orange: 'brightness(0) saturate(100%) invert(47%) sepia(98%) saturate(1352%) hue-rotate(15deg) brightness(95%) contrast(91%)',
      teal: 'brightness(0) saturate(100%) invert(47%) sepia(98%) saturate(1352%) hue-rotate(165deg) brightness(95%) contrast(91%)',
    }
    return filters[themeName] || filters.purple
  }

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

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('image/')) {
      setMediaType('image')
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
        // Auto-save after media is loaded
        setTimeout(() => {
          handleSaveDailyStatus()
        }, 500)
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('video/')) {
      setMediaType('video')
      const reader = new FileReader()
      reader.onloadend = () => {
        setMediaPreview(reader.result as string)
        // Auto-save after media is loaded
        setTimeout(() => {
          handleSaveDailyStatus()
        }, 500)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveDailyStatus = async () => {
    // Don't save if empty and no media
    if (!dailyStatus.trim() && !mediaPreview) return
    
    setIsSaving(true)
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
      router.refresh()
      fetchTodayStatus()
    } catch (error) {
      console.error('Failed to save status', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save on status change (debounced)
  useEffect(() => {
    if (!isOwnProfile) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Only auto-save if there's content or media
    if (dailyStatus.trim() || mediaPreview) {
      saveTimeoutRef.current = setTimeout(() => {
        handleSaveDailyStatus()
      }, 1000) // Save after 1 second of no typing
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyStatus, mediaPreview, mediaType, isOwnProfile])

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
        <div 
          className="absolute top-0 left-0 w-full h-16 z-10 opacity-90 flex items-center px-6 justify-between"
          style={{ background: themeColors.primaryGradient }}
        >
          <div className="flex items-center gap-2">
            <span className="text-white font-bold tracking-widest text-lg">PENDAPASS</span>
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <div className="text-white/60 text-xs font-mono tracking-widest">
                {user.id.slice(-8).toUpperCase()}
              </div>
              {user.pendaCoins !== undefined && user.pendaCoins !== null && (
                <div className="text-white/80 text-xs font-semibold flex items-center gap-1">
                  <span>🪙</span>
                  <span>{user.pendaCoins.toLocaleString()}</span>
                </div>
              )}
            </div>
            {isOwnProfile && (
              <button
                onClick={() => {
                  if (isEditMode) {
                    // Turn off edit mode and close editor
                    setIsEditMode(false)
                    setIsEditingImages(false)
                    setIsEditorOpen(false)
                  } else {
                    // Turn on edit mode and open editor
                    setIsEditorOpen(true)
                    setIsEditMode(true)
                  }
                }}
                className={`p-2 rounded-full transition-all ${
                  isEditMode
                    ? 'bg-white shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                style={isEditMode ? {
                  color: themeColors.primaryGradient.includes('purple') ? '#9333ea' : 
                         themeColors.primaryGradient.includes('blue') ? '#2563eb' :
                         themeColors.primaryGradient.includes('green') ? '#16a34a' :
                         themeColors.primaryGradient.includes('pink') ? '#db2777' :
                         themeColors.primaryGradient.includes('orange') ? '#ea580c' :
                         themeColors.primaryGradient.includes('teal') ? '#0d9488' : '#9333ea'
                } : {}}
                title={isEditMode ? "Exit Edit Mode" : "Edit PendaPass"}
              >
                <Pencil size={16} />
              </button>
            )}
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
            <>
              {isEditingImages && (
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
              {!isEditingImages && (
                <button
                  onClick={() => setIsEditingImages(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={24} />
                </button>
              )}
            </>
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

          {/* User Name and Status Photo */}
          <div className="mb-4 flex items-start justify-between gap-4 relative">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {user.name || 'Anonymous Panda'}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Member since {new Date(user.createdAt).getFullYear()}
              </p>
            </div>
            
            {/* Washi Tape Stripe with Pandas - Behind Status Photo */}
            {(mediaPreview || todayStatus?.mediaUrl) && (
              <div className="absolute right-0 top-0 -z-10 overflow-hidden" style={{ height: '32px', width: '120px' }}>
                {/* Washi tape background with theme color stripes */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `repeating-linear-gradient(
                      45deg,
                      ${theme === 'purple' ? 'rgba(147, 51, 234, 0.08)' : 
                        theme === 'blue' ? 'rgba(37, 99, 235, 0.08)' :
                        theme === 'green' ? 'rgba(22, 163, 74, 0.08)' :
                        theme === 'pink' ? 'rgba(219, 39, 119, 0.08)' :
                        theme === 'orange' ? 'rgba(234, 88, 12, 0.08)' :
                        theme === 'teal' ? 'rgba(13, 148, 136, 0.08)' : 'rgba(147, 51, 234, 0.08)'},
                      ${theme === 'purple' ? 'rgba(147, 51, 234, 0.08)' : 
                        theme === 'blue' ? 'rgba(37, 99, 235, 0.08)' :
                        theme === 'green' ? 'rgba(22, 163, 74, 0.08)' :
                        theme === 'pink' ? 'rgba(219, 39, 119, 0.08)' :
                        theme === 'orange' ? 'rgba(234, 88, 12, 0.08)' :
                        theme === 'teal' ? 'rgba(13, 148, 136, 0.08)' : 'rgba(147, 51, 234, 0.08)'} 10px,
                      transparent 10px,
                      transparent 20px
                    )`,
                    borderTop: '2px dashed rgba(0, 0, 0, 0.05)',
                    borderBottom: '2px dashed rgba(0, 0, 0, 0.05)',
                  }}
                />
                {/* Still pandas - solid color matching theme, edge to edge */}
                <div className="absolute inset-0 flex items-center justify-between px-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex-shrink-0">
                      <Image
                        src="/panda-icon.png"
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5"
                        style={{
                          filter: getThemeFilter(theme)
                        }}
                        aria-hidden="true"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Status Photo with Stamp Border */}
            {(mediaPreview || todayStatus?.mediaUrl) && (
              <div className="relative flex-shrink-0 z-10">
                <div 
                  className="relative w-24 h-24 rounded-lg overflow-hidden"
                  style={{
                    border: '3px solid',
                    borderColor: themeColors.primaryGradient.includes('purple') ? '#9333ea' : '#6366f1',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 0 0 2px rgba(255, 255, 255, 0.5)',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    padding: '2px',
                  }}
                >
                  <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-lg" />
                  {mediaPreview ? (
                    mediaType === 'image' ? (
                      <img 
                        src={mediaPreview} 
                        alt="Status" 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <video 
                        src={mediaPreview} 
                        className="w-full h-full object-cover rounded-md"
                        muted
                        loop
                        playsInline
                      />
                    )
                  ) : todayStatus?.mediaUrl ? (
                    todayStatus.mediaType === 'image' ? (
                      <img 
                        src={todayStatus.mediaUrl} 
                        alt="Status" 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <video 
                        src={todayStatus.mediaUrl} 
                        className="w-full h-full object-cover rounded-md"
                        muted
                        loop
                        playsInline
                      />
                    )
                  ) : null}
                  {/* Stamp corner decoration */}
                  <div 
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full"
                    style={{
                      background: themeColors.primaryGradient,
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Washi Tape Stripe with Pandas - Full Width */}
          <div className="relative my-4 -mx-6 overflow-hidden" style={{ height: '32px' }}>
            {/* Washi tape background with theme color stripes */}
            <div 
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  ${theme === 'purple' ? 'rgba(147, 51, 234, 0.08)' : 
                    theme === 'blue' ? 'rgba(37, 99, 235, 0.08)' :
                    theme === 'green' ? 'rgba(22, 163, 74, 0.08)' :
                    theme === 'pink' ? 'rgba(219, 39, 119, 0.08)' :
                    theme === 'orange' ? 'rgba(234, 88, 12, 0.08)' :
                    theme === 'teal' ? 'rgba(13, 148, 136, 0.08)' : 'rgba(147, 51, 234, 0.08)'},
                  ${theme === 'purple' ? 'rgba(147, 51, 234, 0.08)' : 
                    theme === 'blue' ? 'rgba(37, 99, 235, 0.08)' :
                    theme === 'green' ? 'rgba(22, 163, 74, 0.08)' :
                    theme === 'pink' ? 'rgba(219, 39, 119, 0.08)' :
                    theme === 'orange' ? 'rgba(234, 88, 12, 0.08)' :
                    theme === 'teal' ? 'rgba(13, 148, 136, 0.08)' : 'rgba(147, 51, 234, 0.08)'} 10px,
                  transparent 10px,
                  transparent 20px
                )`,
                borderTop: '2px dashed rgba(0, 0, 0, 0.05)',
                borderBottom: '2px dashed rgba(0, 0, 0, 0.05)',
              }}
            />
            {/* Still pandas - solid color matching theme, edge to edge */}
            <div className="absolute inset-0 flex items-center justify-between px-2">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="flex-shrink-0 opacity-30">
                  <Image
                    src="/panda-icon.png"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                    style={{
                      filter: getThemeFilter(theme)
                    }}
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Daily Status Box - Simplified */}
          <div className="mb-4">
            {isOwnProfile ? (
              <div className="space-y-1">
                <textarea
                  value={dailyStatus}
                  onChange={(e) => setDailyStatus(e.target.value)}
                  placeholder="What are you up to today?"
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-700 rounded-none p-2 text-sm focus:outline-none focus:border-purple-500 min-h-[50px] resize-none text-zinc-600 dark:text-zinc-400"
                  maxLength={280}
                  onBlur={handleSaveDailyStatus}
                />
                <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 px-2">
                  <span>{280 - dailyStatus.length} remaining</span>
                  {isSaving && <span>Saving...</span>}
                  <div className="flex items-center gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMediaSelect}
                    />
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">add image</span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                      title="Add photo/video"
                    >
                      <ImageIcon size={12} />
                    </button>
                    {(mediaPreview || todayStatus?.mediaUrl) && (
                      <button
                        onClick={() => {
                          setMediaPreview(null)
                          setMediaType(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                          handleSaveDailyStatus()
                        }}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-red-500"
                        title="Remove media"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              todayStatus ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic border-b border-zinc-200 dark:border-zinc-700 pb-2">
                  "{todayStatus.content}"
                </p>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                  No status today.
                </p>
              )
            )}
          </div>

          {/* Interests - Below Status */}
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

          {/* Verification Status */}
          <div className="mt-4 pb-2 flex items-center justify-between">
            {!user.isVerified && (
              <div className="text-xs ml-4 text-zinc-400 dark:text-zinc-500 font-light tracking-wide">
                UNVERIFIED
              </div>
            )}
            {user.isVerified && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                <CheckCircle2 size={14} />
                <span>VERIFIED</span>
              </div>
            )}
          </div>

          {/* Verified Watermark - Panda Head */}
          {user.isVerified && (
            <div className="absolute bottom-6 left-6 z-0 pointer-events-none">
              <div className="relative w-24 h-24 opacity-[0.08] dark:opacity-[0.12]">
                <Image
                  src="/panda-icon.png"
                  alt="Verified watermark"
                  fill
                  className="object-contain"
                  style={{
                    filter: 'brightness(0) saturate(100%)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Flip Button - Triangular Corner - Allow flipping for all users */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="absolute bottom-0 right-0 w-16 h-16 text-white shadow-lg transition-all hover:scale-110 active:scale-95 z-20 hover:opacity-90"
            style={{
              clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              background: themeColors.primaryGradient,
            }}
            title="Flip PendaPass"
          >
            <div className="absolute bottom-1 right-1">
              <ArrowRight size={20} className="rotate-[-45deg]" />
            </div>
          </button>
        </div>

          {/* Back Side - Destination Stamps OR Game */}
          <div
            className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 dark:border-white/5 shadow-purple-900/20 dark:shadow-black/50 flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {isGameMode ? (
              <PendaGame 
                onGameOver={handleGameOver} 
                currentHighScore={user.highScore || 0}
                onExit={() => {
                  setIsGameMode(false)
                  setIsFlipped(false)
                }}
              />
            ) : (
              <>
                {/* Header */}
                <div 
                  className="absolute top-0 left-0 w-full h-16 z-10 opacity-90 flex items-center px-6 justify-between"
                  style={{ background: themeColors.primaryGradient }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-widest text-lg">TRAVEL STAMPS</span>
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-white/60 text-xs font-mono tracking-widest">
                      {user.id.slice(-8).toUpperCase()}
                    </div>
                    {user.pendaCoins !== undefined && user.pendaCoins !== null && (
                      <div className="text-white/80 text-xs font-semibold flex items-center gap-1">
                        <span>🪙</span>
                        <span>{user.pendaCoins.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 pt-16 pb-16 overflow-y-auto scrollbar-hide">
                  <div className="px-6 pb-4">
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
                </div>

                {/* Verification Status - Back Side (Fixed at bottom) */}
                <div className="absolute bottom-0 left-0 right-0 px-6 py-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-10">
                  <div className="flex items-center justify-between">
                    {!user.isVerified && (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 font-light tracking-wide">
                        UNVERIFIED
                      </div>
                    )}
                    {user.isVerified && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle2 size={14} />
                        <span>VERIFIED</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verified Watermark - Panda Head - Back Side */}
                {user.isVerified && (
                  <div className="absolute bottom-6 left-6 z-0 pointer-events-none">
                    <div className="relative w-24 h-24 opacity-[0.08] dark:opacity-[0.12]">
                      <Image
                        src="/panda-icon.png"
                        alt="Verified watermark"
                        fill
                        className="object-contain grayscale"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Flip Button - Triangular Corner - Show when not in game mode (game mode only for own profile) */}
            {!isGameMode && (
              <button
                onClick={handleFlip}
                className="absolute bottom-0 right-0 w-16 h-16 text-white shadow-lg transition-all hover:scale-110 active:scale-95 z-20 hover:opacity-90"
                style={{
                  clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  background: themeColors.primaryGradient,
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
