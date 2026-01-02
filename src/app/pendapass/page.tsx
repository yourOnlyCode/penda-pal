import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/authOptions'
import { PendaPass } from '@/components/dashboard/PendaPass'
import { FloatingDock } from '@/components/dashboard/FloatingDock'
import { DarkModeToggle } from '@/components/dashboard/DarkModeToggle'
import { prisma } from '@/lib/prisma'
import { Sparkles } from 'lucide-react'

export default async function PendaPassPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Redirect to the user's unique PendaPass URL
  redirect(`/pendapass/${session.user.id}`)
}

