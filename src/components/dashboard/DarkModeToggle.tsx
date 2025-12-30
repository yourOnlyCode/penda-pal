'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/providers/ThemeProvider'

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  return (
    <Button
      onClick={cycleTheme}
      variant="ghost"
      size="sm"
      className="relative w-10 h-10 rounded-full"
      title={`Theme: ${theme} (click to cycle)`}
    >
      {theme === 'dark' ? (
        <Moon size={18} className="text-zinc-700 dark:text-zinc-300" />
      ) : theme === 'light' ? (
        <Sun size={18} className="text-zinc-700 dark:text-zinc-300" />
      ) : (
        <Monitor size={18} className="text-zinc-700 dark:text-zinc-300" />
      )}
    </Button>
  )
}

