'use client'

import { useState } from 'react'
import { User, Penpal } from '@prisma/client'
import { RequestPenpalButton } from './RequestPenpalButton'
import { Button } from '@/components/ui/button'
import { Mail, Send, X, Inbox } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface FloatingDockProps {
  user: User
  activePenpal: any // Using any for now to handle relation types easily, but should be typed properly
  penpalUser: any
}

export function FloatingDock({ user, activePenpal, penpalUser }: FloatingDockProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()

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
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Mail className="text-purple-600" size={18} />
                <span className="font-semibold text-purple-900 dark:text-purple-100">
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
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6"
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
        {hasPenpal ? (
          <Button
            onClick={() => setIsOpen(!isOpen)}
            size="lg"
            className="w-full rounded-lg h-10 text-base font-medium shadow-purple-500/20 shadow-lg transition-all hover:scale-105 active:scale-95 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0"
          >
            {isOpen ? 'Close Mailbox' : (
              <span className="flex items-center gap-2">
                <Inbox size={18} />
                Open Mailbox
              </span>
            )}
          </Button>
        ) : (
          <div className="w-full">
            <RequestPenpalButton userId={user.id} isPending={isPending} />
          </div>
        )}
      </div>
    </div>
  )
}

