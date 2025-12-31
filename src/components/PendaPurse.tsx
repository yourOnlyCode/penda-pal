'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'

export function PendaPurse() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pendaCoins, setPendaCoins] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchPendaCoins()
      
      // Refresh coins every 30 seconds
      const interval = setInterval(fetchPendaCoins, 30000)
      return () => clearInterval(interval)
    } else {
      setLoading(false)
    }
    // Only depend on status and userId (primitive), not the entire session object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.id])

  const fetchPendaCoins = async () => {
    try {
      const res = await fetch('/api/user/penda-coins')
      if (res.ok) {
        const data = await res.json()
        setPendaCoins(data.pendaCoins || 0)
      }
    } catch (error) {
      console.error('Error fetching Penda Coins:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show if not authenticated
  if (status !== 'authenticated' || !session) {
    return null
  }

  const handlePendaPassClick = () => {
    if (session?.user?.id) {
      router.push(`/pendapass/${session.user.id}`)
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3">
      {/* PendaPass Icon Button */}
      <button
        onClick={handlePendaPassClick}
        className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-lg shadow-xl border-2 border-blue-300 dark:border-blue-600 px-4 py-2 flex items-center gap-2 hover:from-blue-600 hover:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 transition-all duration-200 active:scale-95"
        title="View PendaPass"
      >
        <CreditCard className="w-5 h-5 text-white" />
        <span className="text-sm font-semibold text-white">PendaPass</span>
      </button>

      {/* Penda Coins */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 rounded-lg shadow-xl border-2 border-yellow-300 dark:border-yellow-600 px-4 py-2 flex items-center gap-2">
        <div className="text-2xl">🪙</div>
        {loading ? (
          <span className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
            ...
          </span>
        ) : (
          <span className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
            {pendaCoins.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

