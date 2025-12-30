export type PendaPassTheme = 'purple' | 'blue' | 'green' | 'pink' | 'orange' | 'teal'

export interface ThemeColors {
  primary: string
  primaryDark: string
  secondary: string
  secondaryDark: string
  accent: string
  accentDark: string
  badge: string
  badgeDark: string
}

export const themes: Record<PendaPassTheme, ThemeColors> = {
  purple: {
    primary: 'from-purple-600 to-indigo-600',
    primaryDark: 'from-purple-700 to-indigo-700',
    secondary: 'bg-purple-100 dark:bg-purple-900/40',
    secondaryDark: 'bg-purple-900/20',
    accent: 'text-purple-700 dark:text-purple-300',
    accentDark: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-50 dark:bg-purple-900/30',
    badgeDark: 'border-purple-100 dark:border-purple-800',
  },
  blue: {
    primary: 'from-blue-600 to-cyan-600',
    primaryDark: 'from-blue-700 to-cyan-700',
    secondary: 'bg-blue-100 dark:bg-blue-900/40',
    secondaryDark: 'bg-blue-900/20',
    accent: 'text-blue-700 dark:text-blue-300',
    accentDark: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-50 dark:bg-blue-900/30',
    badgeDark: 'border-blue-100 dark:border-blue-800',
  },
  green: {
    primary: 'from-green-600 to-emerald-600',
    primaryDark: 'from-green-700 to-emerald-700',
    secondary: 'bg-green-100 dark:bg-green-900/40',
    secondaryDark: 'bg-green-900/20',
    accent: 'text-green-700 dark:text-green-300',
    accentDark: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-50 dark:bg-green-900/30',
    badgeDark: 'border-green-100 dark:border-green-800',
  },
  pink: {
    primary: 'from-pink-600 to-rose-600',
    primaryDark: 'from-pink-700 to-rose-700',
    secondary: 'bg-pink-100 dark:bg-pink-900/40',
    secondaryDark: 'bg-pink-900/20',
    accent: 'text-pink-700 dark:text-pink-300',
    accentDark: 'border-pink-200 dark:border-pink-800',
    badge: 'bg-pink-50 dark:bg-pink-900/30',
    badgeDark: 'border-pink-100 dark:border-pink-800',
  },
  orange: {
    primary: 'from-orange-600 to-amber-600',
    primaryDark: 'from-orange-700 to-amber-700',
    secondary: 'bg-orange-100 dark:bg-orange-900/40',
    secondaryDark: 'bg-orange-900/20',
    accent: 'text-orange-700 dark:text-orange-300',
    accentDark: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-50 dark:bg-orange-900/30',
    badgeDark: 'border-orange-100 dark:border-orange-800',
  },
  teal: {
    primary: 'from-teal-600 to-cyan-600',
    primaryDark: 'from-teal-700 to-cyan-700',
    secondary: 'bg-teal-100 dark:bg-teal-900/40',
    secondaryDark: 'bg-teal-900/20',
    accent: 'text-teal-700 dark:text-teal-300',
    accentDark: 'border-teal-200 dark:border-teal-800',
    badge: 'bg-teal-50 dark:bg-teal-900/30',
    badgeDark: 'border-teal-100 dark:border-teal-800',
  },
}

export function getThemeColors(theme: PendaPassTheme = 'purple'): ThemeColors {
  return themes[theme] || themes.purple
}

