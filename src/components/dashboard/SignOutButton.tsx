'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <button
      onClick={handleSignOut}
      className="p-2 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-gray-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-200 shadow-sm hover:shadow-md"
      title="Sign Out"
    >
      <LogOut className="h-5 w-5" />
    </button>
  )
}

