import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        supabaseAuth: { label: 'Supabase Auth', type: 'text' }, // Flag for Supabase auth
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check if this is a Supabase auth request
        if (credentials.supabaseAuth === 'true') {
          // Verify with Supabase Auth
          const { data: authData, error } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !authData.user) {
            return null
          }

          // Find or create user in Prisma
          let dbUser = await prisma.user.findUnique({
            where: { email: authData.user.email! },
          })

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: authData.user.email!,
                name: authData.user.user_metadata?.name || null,
                image: authData.user.user_metadata?.avatar_url || null,
              },
            })
          }

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
          }
        }

        // Fallback to bcrypt-based auth for existing users
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub as string
      }
      return session
    },
    async jwt({ token, user }) {
      // When user signs in (OAuth or credentials), user is passed here
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt', // JWT for credentials, adapter handles OAuth sessions
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/onboarding',
  },
}
