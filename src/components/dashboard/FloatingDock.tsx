'use client'

import { useState } from 'react'
import { User, Penpal } from '@prisma/client'
import { RequestPenpalButton } from './RequestPenpalButton'
import { Button } from '@/components/ui/button'
import { Mail, Send, X, Inbox, Gamepad2, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { PendaPassTheme, getThemeColors } from '@/lib/themes'

interface FloatingDockProps {
  user: User & {
    pendapassTheme?: string | null
  }
  activePenpal: any // Using any for now to handle relation types easily, but should be typed properly
  penpalUser: any
  onGameModeToggle?: () => void
}

export function FloatingDock({ user, activePenpal, penpalUser, onGameModeToggle }: FloatingDockProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()

  // Get theme from user
  const theme = (user.pendapassTheme as PendaPassTheme) || 'purple'
  const themeColors = getThemeColors(theme)

  // Waitlist pending state check
  const isPending = !!(user as any).waitlist

  const hasPenpal = !!activePenpal

  const handleSendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          penpalId: activePenpal.id,
          content: message 
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to send message')
        return
      }

      setMessage('')
      setIsOpen(false)
      alert('Letter sent! Your penpal will receive it shortly.')
      router.refresh()
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send letter')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <AnimatePresence>
        {isOpen && hasPenpal && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <div 
              className={`p-4 border-b flex justify-between items-center ${themeColors.secondary} ${themeColors.accentDark}`}
            >
              <div className="flex items-center gap-2">
                <Mail 
                  size={18} 
                  className={themeColors.accent}
                />
                <span className={`font-semibold ${themeColors.accent}`}>
                  Letter to {penpalUser?.name || 'Penpal'}
                </span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your daily letter..."
                className="w-full h-32 bg-transparent resize-none focus:outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-zinc-400">
                  {500 - message.length} chars remaining
                </span>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={sending || !message.trim()}
                  className="text-white rounded-full px-6"
                  style={{
                    background: themeColors.primaryGradient,
                  }}
                >
                  {sending ? 'Sending...' : (
                    <>
                      Send Letter <Send size={14} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg px-4 py-2 rounded-lg shadow-lg border border-white/20 dark:border-white/10 flex items-center justify-center gap-2">
        {/* Game and Planet buttons on the left */}
        <div className="flex items-center gap-2">
          {onGameModeToggle && (
            <button
              onClick={onGameModeToggle}
              className="p-2 rounded-lg bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all hover:scale-110 active:scale-95 border border-zinc-200 dark:border-zinc-700"
              title="Play Penda Plop"
            >
              <Gamepad2 size={20} className="text-zinc-700 dark:text-zinc-300" />
            </button>
          )}
          <button
            onClick={() => {
              console.log('Planet button clicked!')
              window.location.href = '/planet'
            }}
            type="button"
            className="p-2 rounded-lg bg-white/60 dark:bg-zinc-800/60 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all hover:scale-110 active:scale-95 border border-zinc-200 dark:border-zinc-700 cursor-pointer z-10 relative"
            title="Explore Penda Planet"
          >
            <Globe size={20} className="text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>
        
        {/* Center button (Mailbox or Request Penpal) */}
        <div className="flex-1">
          {hasPenpal ? (
            <Button
              onClick={() => setIsOpen(!isOpen)}
              size="lg"
              className="w-full rounded-lg h-10 text-base font-medium shadow-lg transition-all hover:scale-105 active:scale-95 text-white border-0"
              style={{
                background: themeColors.primaryGradient,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              }}
            >
              {isOpen ? 'Close Mailbox' : (
                <span className="flex items-center gap-2">
                  <Inbox size={18} />
                  Open Mailbox
                </span>
              )}
            </Button>
          ) : (
            <RequestPenpalButton userId={user.id} isPending={isPending} theme={theme} />
          )}
        </div>
      </div>
    </div>
  )
}

