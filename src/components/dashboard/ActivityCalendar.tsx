'use client'

import { useEffect, useState } from 'react'
import { DailyStatus, Message } from '@prisma/client'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Calendar } from 'lucide-react'

interface ActivityCalendarProps {
  userId: string
  penpalId?: string
}

interface ActivityData {
  date: string
  hasStatus: boolean
  hasMessage: boolean
}

export function ActivityCalendar({ userId, penpalId }: ActivityCalendarProps) {
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)
  const [isFullCalendarOpen, setIsFullCalendarOpen] = useState(false)
  const [fullHistory, setFullHistory] = useState<ActivityData[]>([])
  const [loadingFullHistory, setLoadingFullHistory] = useState(false)

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      try {
        // Get last 7 days
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 6)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)

        // Fetch daily statuses
        const statusRes = await fetch(
          `/api/user/daily-status?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        )
        const statusData = await statusRes.json()
        const statuses: DailyStatus[] = statusData.statuses || []

        // Fetch messages if penpal exists
        let messages: Message[] = []
        if (penpalId) {
          const messageRes = await fetch(`/api/messages/history?penpalId=${penpalId}`)
          if (messageRes.ok) {
            const messageData = await messageRes.json()
            messages = messageData.messages || []
          }
        }

        // Create activity map for last 7 days
        const activityMap = new Map<string, ActivityData>()
        
        // Initialize all 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate)
          date.setDate(date.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          activityMap.set(dateStr, {
            date: dateStr,
            hasStatus: false,
            hasMessage: false,
          })
        }

        // Mark days with statuses
        statuses.forEach((status) => {
          const dateStr = new Date(status.date).toISOString().split('T')[0]
          const activity = activityMap.get(dateStr)
          if (activity) {
            activity.hasStatus = true
          }
        })

        // Mark days with messages
        messages.forEach((message) => {
          const dateStr = new Date(message.createdAt).toISOString().split('T')[0]
          const activity = activityMap.get(dateStr)
          if (activity) {
            activity.hasMessage = true
          }
        })

        setActivities(Array.from(activityMap.values()))
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [userId, penpalId])

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const fetchFullHistory = async () => {
    setLoadingFullHistory(true)
    try {
      // Fetch all statuses (no date limit - don't pass startDate/endDate)
      const statusRes = await fetch(`/api/user/daily-status`)
      const statusData = await statusRes.json()
      const statuses: DailyStatus[] = statusData.statuses || []

      // Fetch all messages if penpal exists
      let messages: Message[] = []
      if (penpalId) {
        const messageRes = await fetch(`/api/messages/history?penpalId=${penpalId}`)
        if (messageRes.ok) {
          const messageData = await messageRes.json()
          messages = messageData.messages || []
        }
      }

      // Create activity map for all dates
      const activityMap = new Map<string, ActivityData>()

      // Add all status dates
      statuses.forEach((status) => {
        const dateStr = new Date(status.date).toISOString().split('T')[0]
        if (!activityMap.has(dateStr)) {
          activityMap.set(dateStr, {
            date: dateStr,
            hasStatus: false,
            hasMessage: false,
          })
        }
        activityMap.get(dateStr)!.hasStatus = true
      })

      // Add all message dates
      messages.forEach((message) => {
        const dateStr = new Date(message.createdAt).toISOString().split('T')[0]
        if (!activityMap.has(dateStr)) {
          activityMap.set(dateStr, {
            date: dateStr,
            hasStatus: false,
            hasMessage: false,
          })
        }
        activityMap.get(dateStr)!.hasMessage = true
      })

      // Sort by date descending
      const sortedActivities = Array.from(activityMap.values()).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      setFullHistory(sortedActivities)
    } catch (error) {
      console.error('Failed to fetch full history:', error)
    } finally {
      setLoadingFullHistory(false)
    }
  }

  const handleShowFullActivity = () => {
    setIsFullCalendarOpen(true)
    if (fullHistory.length === 0) {
      fetchFullHistory()
    }
  }

  // Group activities by month and year
  const groupByMonth = (activities: ActivityData[]) => {
    const grouped: Record<string, ActivityData[]> = {}
    activities.forEach(activity => {
      const date = new Date(activity.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(activity)
    })
    return grouped
  }

  // Get calendar days for a month
  const getCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (ActivityData | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month - create activity data for all days, even if no activity
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const activity = fullHistory.find(a => a.date === dateStr)
      if (activity) {
        days.push(activity)
      } else {
        // Create empty activity for days with no activity
        days.push({
          date: dateStr,
          hasStatus: false,
          hasMessage: false,
        })
      }
    }

    return days
  }

  if (loading) {
    return (
      <div className="flex gap-2 justify-center">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Weekly Activity
        </div>
        <div className="flex gap-2">
          {activities.map((activity, index) => {
            const date = new Date(activity.date)
            const dayName = daysOfWeek[date.getDay()]
            
            // Determine color based on activity
            let bgColor = 'bg-zinc-200 dark:bg-zinc-800' // No activity
            if (activity.hasStatus && activity.hasMessage) {
              bgColor = 'bg-purple-600' // Both
            } else if (activity.hasStatus) {
              bgColor = 'bg-blue-500' // Status only
            } else if (activity.hasMessage) {
              bgColor = 'bg-green-500' // Message only
            }

            return (
              <div key={activity.date} className="flex flex-col items-center gap-1">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{dayName}</div>
                <div
                  className={`w-10 h-10 rounded-lg ${bgColor} transition-all hover:scale-110 cursor-pointer`}
                  title={`${dayName}: ${activity.hasStatus ? 'Status posted' : 'No status'} | ${activity.hasMessage ? 'Message sent' : 'No message'}`}
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Status</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Message</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-600" />
            <span>Both</span>
          </div>
        </div>
        <button
          onClick={handleShowFullActivity}
          className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline flex items-center gap-1 transition-colors"
        >
          <Calendar className="w-3 h-3" />
          Show Full Activity
        </button>
      </div>

      {/* Full Activity Calendar Modal */}
    <AnimatePresence>
      {isFullCalendarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullCalendarOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Full Activity History</h2>
              </div>
              <button
                onClick={() => setIsFullCalendarOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
              {loadingFullHistory ? (
                <div className="text-center text-zinc-500 py-8">Loading history...</div>
              ) : fullHistory.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">No activity history yet.</div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupByMonth(fullHistory))
                    .sort(([a], [b]) => b.localeCompare(a)) // Sort months descending
                    .map(([monthKey, monthActivities]) => {
                      const [year, month] = monthKey.split('-').map(Number)
                      const days = getCalendarDays(year, month)
                      
                      return (
                        <div key={monthKey} className="border-b border-zinc-200 dark:border-zinc-800 pb-6 last:border-b-0">
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                            {months[month]} {year}
                          </h3>
                          <div className="grid grid-cols-7 gap-2">
                            {/* Day headers */}
                            {daysOfWeek.map(day => (
                              <div key={day} className="text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-2">
                                {day}
                              </div>
                            ))}
                            {/* Calendar days */}
                            {days.map((activity, index) => {
                              if (activity === null) {
                                return <div key={`empty-${index}`} className="aspect-square" />
                              }
                              
                              const day = new Date(activity.date).getDate()
                              let bgColor = 'bg-zinc-200 dark:bg-zinc-800'
                              let textColor = 'text-zinc-600 dark:text-zinc-400'
                              if (activity.hasStatus && activity.hasMessage) {
                                bgColor = 'bg-purple-600'
                                textColor = 'text-white'
                              } else if (activity.hasStatus) {
                                bgColor = 'bg-blue-500'
                                textColor = 'text-white'
                              } else if (activity.hasMessage) {
                                bgColor = 'bg-green-500'
                                textColor = 'text-white'
                              }

                              const hasActivity = activity.hasStatus || activity.hasMessage
                              const title = `${activity.date}: ${activity.hasStatus ? 'Status' : 'No status'} | ${activity.hasMessage ? 'Message' : 'No message'}`

                              return (
                                <div
                                  key={activity.date}
                                  className={`aspect-square rounded-lg ${bgColor} flex items-center justify-center text-sm font-medium ${textColor} transition-all ${hasActivity ? 'hover:scale-110 cursor-pointer' : ''}`}
                                  title={title}
                                >
                                  {day}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex gap-6 text-xs text-zinc-500 dark:text-zinc-400 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-500" />
                  <span>Status</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Message</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-purple-600" />
                  <span>Both</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
                  <span>No Activity</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

