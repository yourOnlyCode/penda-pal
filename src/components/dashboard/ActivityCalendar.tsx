'use client'

import { useEffect, useState } from 'react'
import { DailyStatus, Message } from '@prisma/client'

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
    </div>
  )
}

