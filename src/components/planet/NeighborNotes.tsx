'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'

interface Neighbor {
  id: string
  name: string | null
  image: string | null
  address: string
}

interface NeighborNote {
  id: string
  sender: {
    id: string
    name: string | null
    image: string | null
  }
  message: string | null
  present: string | null
  pendaCoins: number
  date: string
  createdAt: string
}

interface RapportData {
  userRapport: {
    score: number
  }
  topRapport: Array<{
    userId: string
    userName: string | null
    userImage: string | null
    score: number
  }>
}

interface NeighborNotesProps {
  villageId: string
  villageName: string
  isOpen: boolean
  onClose: () => void
}

const PRESENTS = [
  { id: 'flower', label: '🌺 Flower', value: 'flower' },
  { id: 'cookie', label: '🍪 Cookie', value: 'cookie' },
  { id: 'letter', label: '💌 Letter', value: 'letter' },
  { id: 'gift', label: '🎁 Gift', value: 'gift' },
  { id: 'star', label: '⭐ Star', value: 'star' }
]

export function NeighborNotes({ villageId, villageName, isOpen, onClose }: NeighborNotesProps) {
  const { data: session } = useSession()
  const [neighbors, setNeighbors] = useState<Neighbor[]>([])
  const [receivedNotes, setReceivedNotes] = useState<NeighborNote[]>([])
  const [rapport, setRapport] = useState<RapportData | null>(null)
  const [selectedTab, setSelectedTab] = useState<'neighbors' | 'notes' | 'rapport'>('neighbors')
  const [selectedNeighbor, setSelectedNeighbor] = useState<Neighbor | null>(null)
  const [noteMessage, setNoteMessage] = useState('')
  const [selectedPresent, setSelectedPresent] = useState<string>('')
  const [pendaCoins, setPendaCoins] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentToday, setSentToday] = useState<Set<string>>(new Set())

  // Fetch neighbors
  useEffect(() => {
    if (isOpen && villageId) {
      fetchNeighbors()
      fetchReceivedNotes()
      fetchRapport()
      fetchSentToday()
    }
  }, [isOpen, villageId])

  const fetchNeighbors = async () => {
    try {
      const res = await fetch(`/api/neighbors/${villageId}`)
      if (res.ok) {
        const data = await res.json()
        setNeighbors(data.neighbors || [])
      }
    } catch (error) {
      console.error('Error fetching neighbors:', error)
    }
  }

  const fetchSentToday = async () => {
    try {
      const res = await fetch(`/api/neighbors/notes/sent-today?villageId=${villageId}`)
      if (res.ok) {
        const data = await res.json()
        setSentToday(new Set(data.receiverIds || []))
      }
    } catch (error) {
      console.error('Error fetching sent notes:', error)
    }
  }

  const fetchReceivedNotes = async () => {
    try {
      const res = await fetch(`/api/neighbors/notes/received?villageId=${villageId}`)
      if (res.ok) {
        const data = await res.json()
        setReceivedNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching received notes:', error)
    }
  }

  const fetchRapport = async () => {
    try {
      const res = await fetch(`/api/neighbors/repore/${villageId}`)
      if (res.ok) {
        const data = await res.json()
        setRapport(data)
      }
    } catch (error) {
      console.error('Error fetching rapport:', error)
    }
  }

  const handleSendNote = async () => {
    if (!selectedNeighbor) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/neighbors/notes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedNeighbor.id,
          villageId,
          villageName,
          message: noteMessage || null,
          present: selectedPresent || null,
          pendaCoins: pendaCoins || 0
        })
      })

      if (res.ok) {
        // Reset form
        setNoteMessage('')
        setSelectedPresent('')
        setPendaCoins(0)
        setSelectedNeighbor(null)
        setSentToday(prev => new Set([...prev, selectedNeighbor.id]))
        
        // Refresh data
        fetchReceivedNotes()
        fetchRapport()
        
        alert('Note sent successfully!')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to send note')
      }
    } catch (error) {
      console.error('Error sending note:', error)
      setError('Failed to send note')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Neighbor Notes - {villageName}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setSelectedTab('neighbors')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              selectedTab === 'neighbors'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Neighbors
          </button>
          <button
            onClick={() => setSelectedTab('notes')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              selectedTab === 'notes'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Received Notes ({receivedNotes.length})
          </button>
          <button
            onClick={() => setSelectedTab('rapport')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              selectedTab === 'rapport'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Rapport
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'neighbors' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Send a note to one neighbor per day. Choose wisely!
              </p>
              
              {neighbors.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
                  No neighbors yet in this village.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {neighbors.map(neighbor => (
                    <div
                      key={neighbor.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedNeighbor?.id === neighbor.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                      onClick={() => setSelectedNeighbor(neighbor)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                          {neighbor.image ? (
                            <Image
                              src={neighbor.image}
                              alt={neighbor.name || 'Neighbor'}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                              {neighbor.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {neighbor.name || 'Anonymous'}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {neighbor.address}
                          </p>
                        </div>
                        {sentToday.has(neighbor.id) && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            ✓ Sent today
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Note Form */}
              {selectedNeighbor && (
                <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Send note to {selectedNeighbor.name || 'Anonymous'}
                  </h3>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Message (optional)
                      </label>
                      <textarea
                        value={noteMessage}
                        onChange={(e) => setNoteMessage(e.target.value)}
                        placeholder="Leave a friendly message..."
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Present (optional)
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {PRESENTS.map(present => (
                          <button
                            key={present.id}
                            onClick={() => setSelectedPresent(
                              selectedPresent === present.value ? '' : present.value
                            )}
                            className={`p-2 rounded-lg border-2 text-sm transition-colors ${
                              selectedPresent === present.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                            }`}
                          >
                            {present.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Penda Coins (optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={pendaCoins}
                        onChange={(e) => setPendaCoins(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <button
                      onClick={handleSendNote}
                      disabled={loading || sentToday.has(selectedNeighbor.id)}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      {loading ? 'Sending...' : sentToday.has(selectedNeighbor.id) ? 'Already sent today' : 'Send Note'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'notes' && (
            <div className="space-y-4">
              {receivedNotes.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
                  No notes received yet.
                </p>
              ) : (
                receivedNotes.map(note => (
                  <div
                    key={note.id}
                    className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        {note.sender.image ? (
                          <Image
                            src={note.sender.image}
                            alt={note.sender.name || 'Sender'}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-500">
                            {note.sender.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {note.sender.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {note.message && (
                      <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                        {note.message}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-3">
                      {note.present && (
                        <span className="text-2xl">{PRESENTS.find(p => p.value === note.present)?.label.split(' ')[0]}</span>
                      )}
                      {note.pendaCoins > 0 && (
                        <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                          💰 {note.pendaCoins} Penda Coins
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedTab === 'rapport' && rapport && (
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                <p className="text-sm opacity-90">Your Rapport</p>
                <p className="text-3xl font-bold">{rapport.userRapport.score}</p>
                <p className="text-sm opacity-90 mt-1">
                  Higher Rapport = More voting power in village decisions
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Top Rapport Holders
                </h3>
                <div className="space-y-2">
                  {rapport.topRapport.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-400">
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        {entry.userImage ? (
                          <Image
                            src={entry.userImage}
                            alt={entry.userName || 'User'}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-500">
                            {entry.userName?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {entry.userName || 'Anonymous'}
                        </p>
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {entry.score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

