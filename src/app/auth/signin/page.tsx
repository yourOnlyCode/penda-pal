import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/authOptions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PandaIcon } from '@/components/PandaIcon'
import Link from 'next/link'
import { SignInButtons } from './SignInButtons'
import { EmailSignIn } from '@/components/auth/EmailSignIn'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  // If already signed in, redirect to PendaPass
  if (session) {
    redirect(`/pendapass/${session.user.id}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
            <PandaIcon size={32} />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Penda</CardTitle>
          <CardDescription>
            Sign in to start connecting with penpals around the world
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInButtons />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <EmailSignIn />
          
          <p className="mt-4 text-center text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

