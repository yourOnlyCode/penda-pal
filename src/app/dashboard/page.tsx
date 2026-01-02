import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/authOptions'

// Legacy route - redirect to new PendaPass route
export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Redirect to the new PendaPass route with user ID
  redirect(`/pendapass/${session.user.id}`)
}
