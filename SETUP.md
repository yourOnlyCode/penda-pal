# Penda Setup Checklist

Follow this checklist to get Penda up and running.

## ✅ Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 📦 Step 1: Install Dependencies

```bash
# Install main app dependencies
npm install

# Install Socket.io server dependencies
cd socket-server
npm install
cd ..
```

## 🗄️ Step 2: Set Up Supabase

1. [ ] Go to [supabase.com](https://supabase.com) and create account
2. [ ] Create new project (choose region close to you)
3. [ ] Wait for project to provision (~2 minutes)
4. [ ] Go to Settings > API
5. [ ] Copy these values to `.env`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
6. [ ] Go to Settings > Database
7. [ ] Copy connection string → `DATABASE_URL`
   - Format: `postgresql://postgres:[password]@[host]:5432/postgres`

## 🔐 Step 3: Set Up OAuth Providers

### Google OAuth
1. [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
2. [ ] Create new project or select existing
3. [ ] Enable Google+ API
4. [ ] Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. [ ] Application type: Web application
6. [ ] Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.vercel.app/api/auth/callback/google` (for production)
7. [ ] Copy Client ID and Client Secret to `.env`

### Facebook OAuth
1. [ ] Go to [Facebook Developers](https://developers.facebook.com)
2. [ ] Create new app > Consumer
3. [ ] Add Facebook Login product
4. [ ] Settings > Basic: Copy App ID and App Secret to `.env`
5. [ ] Facebook Login > Settings > Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://your-domain.vercel.app/api/auth/callback/facebook`

### TikTok OAuth (Optional - Future)
- [ ] Skip for now, add later when ready

## 💳 Step 4: Set Up Stripe

1. [ ] Create account at [stripe.com](https://stripe.com)
2. [ ] Go to Developers > API keys
3. [ ] Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. [ ] Copy Secret key → `STRIPE_SECRET_KEY`
5. [ ] Go to Products > Add product
   - Name: "Penda Verification"
   - Price: $1.99/month (recurring)
   - Copy Price ID for later
6. [ ] Go to Developers > Webhooks > Add endpoint
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy Signing secret → `STRIPE_WEBHOOK_SECRET`

## 🤖 Step 5: Set Up OpenAI

1. [ ] Go to [platform.openai.com](https://platform.openai.com)
2. [ ] Create account (free tier available)
3. [ ] Go to API keys
4. [ ] Create new secret key
5. [ ] Copy to `.env` → `OPENAI_API_KEY`

## 🔑 Step 6: Generate NextAuth Secret

```bash
# Run this command and copy output to NEXTAUTH_SECRET in .env
openssl rand -base64 32
```

Or use online generator: [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)

## 🗃️ Step 7: Initialize Database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

## 📁 Step 8: Set Up Supabase Storage

1. [ ] Go to Supabase project > Storage
2. [ ] Create new bucket: `stickers`
   - Public bucket: Yes
3. [ ] Create new bucket: `user-media`
   - Public bucket: No
   - Add RLS policy for authenticated users
4. [ ] Upload a test sticker to `stickers` bucket
5. [ ] Add sticker to database:

```sql
INSERT INTO "Sticker" (id, name, "imageUrl", category)
VALUES (
  'test-sticker-1',
  'Happy Panda',
  'https://[your-project].supabase.co/storage/v1/object/public/stickers/panda-happy.png',
  'default'
);
```

## 🚀 Step 9: Run Development Servers

### Terminal 1: Next.js App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Terminal 2: Socket.io Server
```bash
cd socket-server
npm run dev
```
Server runs on [http://localhost:3001](http://localhost:3001)

## ✅ Step 10: Test the Application

1. [ ] Visit http://localhost:3000
2. [ ] Click "Get Started"
3. [ ] Sign in with Google
4. [ ] Complete onboarding (name, age, interests)
5. [ ] Check if added to waitlist
6. [ ] Open incognito window and sign up with another account
7. [ ] Both users should be matched!
8. [ ] Test real-time messaging

## 🚢 Step 11: Deploy to Production

### Deploy Frontend (Vercel)
1. [ ] Push code to GitHub
2. [ ] Go to [vercel.com](https://vercel.com)
3. [ ] Import repository
4. [ ] Add all environment variables from `.env`
5. [ ] Deploy!
6. [ ] Update OAuth redirect URIs with production URL

### Deploy Socket.io Server (Railway)
1. [ ] Go to [railway.app](https://railway.app)
2. [ ] Create new project
3. [ ] Deploy from GitHub
4. [ ] Add environment variables
5. [ ] Copy public URL → Update `NEXT_PUBLIC_SOCKET_URL` in Vercel

### Update Stripe Webhook
1. [ ] Add production webhook URL in Stripe dashboard
2. [ ] Update `STRIPE_WEBHOOK_SECRET` in Vercel

## 🎉 You're Done!

Your Penda app is now live! 

## 📝 Next Steps

- [ ] Add more stickers to Supabase Storage
- [ ] Customize landing page design
- [ ] Set up email notifications (SendGrid/Resend)
- [ ] Add analytics (Vercel Analytics/Google Analytics)
- [ ] Set up error tracking (Sentry)
- [ ] Create privacy policy and terms of service
- [ ] Test subscription flow end-to-end
- [ ] Add content moderation review queue
- [ ] Plan React Native mobile app

## 🐛 Troubleshooting

**Database connection fails:**
- Check DATABASE_URL format
- Ensure Supabase project is active
- Verify IP allowlist in Supabase (should allow all for development)

**OAuth not working:**
- Verify redirect URIs match exactly
- Check client ID and secret are correct
- Ensure OAuth consent screen is configured

**Socket.io not connecting:**
- Check NEXT_PUBLIC_SOCKET_URL is correct
- Verify Socket.io server is running
- Check CORS settings in socket server

**Stripe webhook fails:**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Verify webhook secret matches

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Socket.io Docs](https://socket.io/docs)
- [Stripe Docs](https://stripe.com/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
