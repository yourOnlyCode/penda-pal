'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { X, Save, Plus, MapPin, Hash, Palette } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PendaPassTheme, themes } from '@/lib/themes'

interface PendaPassEditorProps {
  user: User & {
    city?: string | null
    placesVisited?: string[]
    placesWishlist?: string[]
    pendapassTheme?: string | null
  }
  isOpen: boolean
  onClose: () => void
}

export function PendaPassEditor({ user, isOpen, onClose }: PendaPassEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [interests, setInterests] = useState<string[]>(user.interests || [])
  const [city, setCity] = useState((user as any).city || '')
  const [placesVisited, setPlacesVisited] = useState<string[]>((user as any).placesVisited || [])
  const [placesWishlist, setPlacesWishlist] = useState<string[]>((user as any).placesWishlist || [])
  const [selectedTheme, setSelectedTheme] = useState<PendaPassTheme>((user.pendapassTheme as PendaPassTheme) || 'purple')
  const [newInterest, setNewInterest] = useState('')
  const [newPlaceVisited, setNewPlaceVisited] = useState('')
  const [newPlaceWishlist, setNewPlaceWishlist] = useState('')
  const [interestSuggestions, setInterestSuggestions] = useState<Array<{ interest: string; count: number }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const interestInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests,
          city,
          placesVisited,
          placesWishlist,
          pendapassTheme: selectedTheme,
        }),
      })
      router.refresh()
      onClose()
    } catch (error) {
      console.error('Failed to save', error)
      alert('Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  // Search for interest suggestions
  useEffect(() => {
    const searchInterests = async () => {
      if (newInterest.trim().length >= 1) {
        try {
          const res = await fetch(`/api/interests/search?q=${encodeURIComponent(newInterest.trim())}`)
          const data = await res.json()
          setInterestSuggestions(data.interests || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error('Failed to search interests:', error)
        }
      } else {
        setInterestSuggestions([])
        setShowSuggestions(false)
      }
    }

    const timeoutId = setTimeout(searchInterests, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [newInterest])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        interestInputRef.current &&
        !interestInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addInterest = (interest?: string) => {
    const interestToAdd = interest || newInterest.trim()
    if (interestToAdd && !interests.includes(interestToAdd)) {
      setInterests([...interests, interestToAdd])
      setNewInterest('')
      setShowSuggestions(false)
      setInterestSuggestions([])
    }
  }

  const selectSuggestion = (interest: string) => {
    addInterest(interest)
  }

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest))
  }

  const addPlaceVisited = () => {
    if (newPlaceVisited.trim() && !placesVisited.includes(newPlaceVisited.trim())) {
      setPlacesVisited([...placesVisited, newPlaceVisited.trim()])
      setNewPlaceVisited('')
    }
  }

  const removePlaceVisited = (place: string) => {
    setPlacesVisited(placesVisited.filter(p => p !== place))
  }

  const addPlaceWishlist = () => {
    if (newPlaceWishlist.trim() && !placesWishlist.includes(newPlaceWishlist.trim())) {
      setPlacesWishlist([...placesWishlist, newPlaceWishlist.trim()])
      setNewPlaceWishlist('')
    }
  }

  const removePlaceWishlist = (place: string) => {
    setPlacesWishlist(placesWishlist.filter(p => p !== place))
  }

  return (
    <>
      {/* Editor Panel - Responsive positioning */}
      <div
        className={`w-full max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border-4 border-white/20 dark:border-white/5 shadow-purple-900/20 dark:shadow-black/50 transform transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none h-0 overflow-hidden'
        }`}
      >
        <div className="overflow-y-auto max-h-[80vh]">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 z-10 px-6 py-4 flex items-center justify-between shadow-lg rounded-t-3xl">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold tracking-widest text-lg">EDIT PENDAPASS</span>
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="text-white" size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* City */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                <MapPin size={14} className="inline mr-1" />
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Theme Selector */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                <Palette size={14} className="inline mr-1" />
                PendaPass Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(themes) as PendaPassTheme[]).map((theme) => {
                  const themeColors = themes[theme]
                  return (
                    <button
                      key={theme}
                      onClick={() => setSelectedTheme(theme)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedTheme === theme
                          ? 'border-zinc-900 dark:border-zinc-100 ring-2 ring-offset-2 ring-purple-500'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className={`h-12 rounded-lg bg-gradient-to-r ${themeColors.primary} mb-2`} />
                      <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 capitalize text-center">
                        {theme}
                      </div>
                      {selectedTheme === theme && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Interests */}
            <div className="relative">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Interests
              </label>
              <div className="flex gap-2 mb-2 relative">
                <div className="flex-1 relative">
                  <input
                    ref={interestInputRef}
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                    onFocus={() => newInterest.trim().length >= 1 && setShowSuggestions(true)}
                    placeholder="Add an interest"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && interestSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
                    >
                      {interestSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSuggestion(suggestion.interest)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <Hash size={16} className="text-purple-600" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {suggestion.interest}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {suggestion.count} {suggestion.count === 1 ? 'user' : 'users'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => addInterest()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-sm border border-purple-200 dark:border-purple-800"
                  >
                    {interest}
                    <button
                      onClick={() => removeInterest(interest)}
                      className="hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Places Visited */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Places I've Been
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPlaceVisited}
                  onChange={(e) => setNewPlaceVisited(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlaceVisited()}
                  placeholder="Add a place you've visited"
                  className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button
                  onClick={addPlaceVisited}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {placesVisited.map((place, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-sm border border-green-200 dark:border-green-800"
                  >
                    {place}
                    <button
                      onClick={() => removePlaceVisited(place)}
                      className="hover:text-green-900 dark:hover:text-green-100"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Places Wishlist */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Places I Want to Go
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPlaceWishlist}
                  onChange={(e) => setNewPlaceWishlist(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlaceWishlist()}
                  placeholder="Add a place you want to visit"
                  className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button
                  onClick={addPlaceWishlist}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus size={16} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {placesWishlist.map((place, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm border border-blue-200 dark:border-blue-800"
                  >
                    {place}
                    <button
                      onClick={() => removePlaceWishlist(place)}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 pt-4 pb-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-b-3xl">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-12 text-base font-medium rounded-xl"
              >
                <Save size={18} className="mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

