# Authentication Setup Guide

Your NextAuth.js authentication is now configured! Here's what you need to do to get it working:

## ✅ What's Already Set Up

1. ✅ NextAuth API route at `/api/auth/[...nextauth]/route.ts`
2. ✅ SessionProvider wrapper in your layout
3. ✅ Sign-in page at `/auth/signin`
4. ✅ Google and Facebook OAuth providers configured
5. ✅ Database schema with User, Account, Session models
6. ✅ TypeScript types for session with user ID

## 🔧 What You Need to Do

### 1. Create `.env` File

Create a `.env` file in the root directory with these variables:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

### 2. Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

Copy the output to `NEXTAUTH_SECRET` in your `.env` file.

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or Google Identity API)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-domain.com/api/auth/callback/google` (for production)
7. Copy the **Client ID** and **Client Secret** to your `.env` file

### 4. Set Up Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** as the app type
4. Add **Facebook Login** product
5. Go to **Settings** → **Basic**:
   - Copy **App ID** → `FACEBOOK_CLIENT_ID`
   - Copy **App Secret** → `FACEBOOK_CLIENT_SECRET`
6. Go to **Facebook Login** → **Settings**:
   - Add Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/auth/callback/facebook`
     - `https://your-domain.com/api/auth/callback/facebook`

### 5. Set Up Database

Make sure your database is set up and the schema is pushed:

```bash
# Push Prisma schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 6. Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/auth/signin`

3. Click "Continue with Google" or "Continue with Facebook"

4. After signing in, you should be redirected to `/onboarding` (for new users)

## 📝 How to Use Auth in Your App

### Get Current User (Server Component)

```tsx
import { getCurrentUser } from '@/lib/auth'

export default async function MyPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return <div>Hello {user.name}!</div>
}
```

### Get Session (Client Component)

```tsx
'use client'

import { useSession } from 'next-auth/react'

export default function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  if (!session) return <div>Not signed in</div>
  
  return <div>Signed in as {session.user.email}</div>
}
```

### Sign Out

```tsx
'use client'

import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button onClick={() => signOut()}>
      Sign Out
    </button>
  )
}
```

## 🚨 Troubleshooting

**"Invalid credentials" error:**
- Double-check your OAuth client IDs and secrets
- Make sure redirect URIs match exactly (including http vs https)

**"NEXTAUTH_SECRET is missing":**
- Make sure you've added `NEXTAUTH_SECRET` to your `.env` file
- Restart your dev server after adding it

**Database errors:**
- Run `npx prisma db push` to ensure schema is up to date
- Check that `DATABASE_URL` is correct

**Session not persisting:**
- Make sure `NEXTAUTH_URL` matches your current URL
- Check browser cookies are enabled

## 🎉 Next Steps

After auth is working:
1. Create the `/onboarding` page for new users
2. Create the `/dashboard` page for authenticated users
3. Add protected routes middleware
4. Set up user profile pages

