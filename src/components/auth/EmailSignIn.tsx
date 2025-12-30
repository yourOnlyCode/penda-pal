'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { createSupabaseClient } from '@/lib/supabase-client'

export function EmailSignIn() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createSupabaseClient()

      if (isSignUp) {
        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        })

        if (authError) {
          setError(authError.message || 'Failed to create account')
          setLoading(false)
          return
        }

        if (authData.user) {
          // Create user in Prisma database
          try {
            const res = await fetch('/api/auth/supabase-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                supabaseUserId: authData.user.id,
                email: authData.user.email,
                name: name,
              }),
            })

            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: 'Failed to sync user' }))
              setError(errorData.error || 'Account created but sync failed')
              setLoading(false)
              return
            }
          } catch (syncError: any) {
            console.error('Sync error:', syncError)
            setError('Failed to sync user account. Please try signing in.')
            setLoading(false)
            return
          }

          // Check if email confirmation is required
          if (authData.session) {
            // User is automatically signed in - create NextAuth session
            const result = await signIn('credentials', {
              email,
              password,
              supabaseAuth: 'true',
              redirect: false,
            })

            if (result?.error) {
              setError('Account created but failed to sign in')
              setLoading(false)
              return
            }

            // Redirect to onboarding
            window.location.href = '/onboarding'
          } else {
            // Email confirmation required
            setError('Please check your email to confirm your account')
            setLoading(false)
          }
        }
      } else {
        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError) {
          setError(authError.message || 'Invalid email or password')
          setLoading(false)
          return
        }

        if (authData.session) {
          // Use NextAuth credentials provider with Supabase flag
          const result = await signIn('credentials', {
            email,
            password,
            supabaseAuth: 'true',
            redirect: false,
          })

          if (result?.error) {
            setError('Failed to sign in')
            setLoading(false)
            return
          }

          // Redirect to dashboard
          window.location.href = '/dashboard'
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold">{isSignUp ? 'Create Account' : 'Sign In with Email'}</h3>
        <p className="text-sm text-muted-foreground">
          {isSignUp
            ? 'Enter your details to create an account'
            : 'Enter your email and password to sign in'}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="text-purple-600 hover:underline"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
    </div>
  )
}

