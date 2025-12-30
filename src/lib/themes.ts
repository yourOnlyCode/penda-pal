export type PendaPassTheme = 'purple' | 'blue' | 'green' | 'pink' | 'orange' | 'teal'

export interface ThemeColors {
  primaryGradient: string // CSS gradient string
  primaryHoverGradient: string
  secondary: string // Tailwind classes that can be static
  secondaryDark: string
  accent: string
  accentDark: string
  badge: string
  badgeDark: string
}

export const themes: Record<PendaPassTheme, ThemeColors> = {
  purple: {
    primaryGradient: 'linear-gradient(to right, rgb(147, 51, 234), rgb(79, 70, 229))', // purple-600 to indigo-600
    primaryHoverGradient: 'linear-gradient(to right, rgb(126, 34, 206), rgb(67, 56, 202))', // purple-700 to indigo-700
    secondary: 'bg-purple-100 dark:bg-purple-900/40',
    secondaryDark: 'bg-purple-900/20',
    accent: 'text-purple-700 dark:text-purple-300',
    accentDark: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-50 dark:bg-purple-900/30',
    badgeDark: 'border-purple-100 dark:border-purple-800',
  },
  blue: {
    primaryGradient: 'linear-gradient(to right, rgb(37, 99, 235), rgb(6, 182, 212))', // blue-600 to cyan-600
    primaryHoverGradient: 'linear-gradient(to right, rgb(29, 78, 216), rgb(8, 145, 178))', // blue-700 to cyan-700
    secondary: 'bg-blue-100 dark:bg-blue-900/40',
    secondaryDark: 'bg-blue-900/20',
    accent: 'text-blue-700 dark:text-blue-300',
    accentDark: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-50 dark:bg-blue-900/30',
    badgeDark: 'border-blue-100 dark:border-blue-800',
  },
  green: {
    primaryGradient: 'linear-gradient(to right, rgb(22, 163, 74), rgb(5, 150, 105))', // green-600 to emerald-600
    primaryHoverGradient: 'linear-gradient(to right, rgb(21, 128, 61), rgb(4, 120, 87))', // green-700 to emerald-700
    secondary: 'bg-green-100 dark:bg-green-900/40',
    secondaryDark: 'bg-green-900/20',
    accent: 'text-green-700 dark:text-green-300',
    accentDark: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-50 dark:bg-green-900/30',
    badgeDark: 'border-green-100 dark:border-green-800',
  },
  pink: {
    primaryGradient: 'linear-gradient(to right, rgb(219, 39, 119), rgb(225, 29, 72))', // pink-600 to rose-600
    primaryHoverGradient: 'linear-gradient(to right, rgb(190, 24, 93), rgb(190, 18, 60))', // pink-700 to rose-700
    secondary: 'bg-pink-100 dark:bg-pink-900/40',
    secondaryDark: 'bg-pink-900/20',
    accent: 'text-pink-700 dark:text-pink-300',
    accentDark: 'border-pink-200 dark:border-pink-800',
    badge: 'bg-pink-50 dark:bg-pink-900/30',
    badgeDark: 'border-pink-100 dark:border-pink-800',
  },
  orange: {
    primaryGradient: 'linear-gradient(to right, rgb(234, 88, 12), rgb(217, 119, 6))', // orange-600 to amber-600
    primaryHoverGradient: 'linear-gradient(to right, rgb(194, 65, 12), rgb(180, 83, 9))', // orange-700 to amber-700
    secondary: 'bg-orange-100 dark:bg-orange-900/40',
    secondaryDark: 'bg-orange-900/20',
    accent: 'text-orange-700 dark:text-orange-300',
    accentDark: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-50 dark:bg-orange-900/30',
    badgeDark: 'border-orange-100 dark:border-orange-800',
  },
  teal: {
    primaryGradient: 'linear-gradient(to right, rgb(13, 148, 136), rgb(6, 182, 212))', // teal-600 to cyan-600
    primaryHoverGradient: 'linear-gradient(to right, rgb(15, 118, 110), rgb(8, 145, 178))', // teal-700 to cyan-700
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

