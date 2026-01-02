'use client'

import { useState, useEffect } from 'react'
import { Mail, Flag, History, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface PenpalOptionsProps {
  penpalId: string
  penpalUserId: string
  currentUserId: string
}

export function PenpalOptions({ penpalId, penpalUserId, currentUserId }: PenpalOptionsProps) {
  const [messageCount, setMessageCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch message count
  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        const res = await fetch(`/api/messages/history?penpalId=${penpalId}&full=true`)
        if (res.ok) {
          const data = await res.json()
          setMessageCount(data.messages?.length || 0)
        }
      } catch (error) {
        console.error('Failed to fetch message count:', error)
      } finally {
        setLoading(false)
      }
    }

    if (penpalId) {
      fetchMessageCount()
    }
  }, [penpalId])

  // Fetch full message history
  const fetchMessageHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/messages/history?penpalId=${penpalId}&full=true`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setShowHistory(true)
      } else {
        alert('Failed to load message history')
      }
    } catch (error) {
      console.error('Failed to fetch message history:', error)
      alert('Failed to load message history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting')
      return
    }

    setSubmittingReport(true)
    try {
      const res = await fetch('/api/report/penpal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: penpalUserId,
          reason: reportReason,
          penpalId: penpalId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to submit report')
        return
      }

      alert(data.message || 'Report submitted successfully')
      setShowReport(false)
      setReportReason('')
    } catch (error) {
      console.error('Report error:', error)
      alert('Failed to submit report')
    } finally {
      setSubmittingReport(false)
    }
  }

  return (
    <>
      <div className="w-full max-w-md mx-auto mt-6 p-4 bg-white/90 dark:bg-zinc-800/90 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between gap-4">
          {/* Message Count */}
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-zinc-600 dark:text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {loading ? 'Loading...' : `${messageCount || 0} messages`}
            </span>
          </div>

          {/* View History Button */}
          <Button
            onClick={fetchMessageHistory}
            disabled={loadingHistory}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <History size={16} />
            View History
          </Button>

          {/* Report Button */}
          <Button
            onClick={() => setShowReport(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <Flag size={16} />
            Report
          </Button>
        </div>
      </div>

      {/* Message History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Message History
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={20} className="text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loadingHistory ? (
                  <div className="text-center py-8 text-zinc-500">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">No messages yet</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.senderId === currentUserId
                            ? 'bg-blue-100 dark:bg-blue-900/30 ml-auto max-w-[80%]'
                            : 'bg-zinc-100 dark:bg-zinc-800 mr-auto max-w-[80%]'
                        }`}
                      >
                        <p className="text-sm text-zinc-900 dark:text-zinc-100">
                          {message.content}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowReport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Report Penpal
                </h2>
                <button
                  onClick={() => setShowReport(false)}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={20} className="text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Please provide a reason for reporting this penpal. Our team will review your report.
                </p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setShowReport(false)}
                    variant="outline"
                    disabled={submittingReport}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReport}
                    disabled={submittingReport || !reportReason.trim()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
