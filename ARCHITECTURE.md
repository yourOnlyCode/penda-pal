# Penda Architecture Documentation

## System Overview

Penda is a penpal matching and messaging application built with a modern, scalable architecture.

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─── HTTP/REST ────────┐
       │                      │
       └─── WebSocket ────────┼──────┐
                              │      │
                    ┌─────────▼──┐   │
                    │  Vercel    │   │
                    │  (Next.js) │   │
                    └─────┬──────┘   │
                          │          │
                    ┌─────▼──────┐   │
                    │  Supabase  │   │
                    │ (Postgres) │   │
                    └────────────┘   │
                                     │
                          ┌──────────▼────────┐
                          │  Railway/Render   │
                          │  (Socket.io)      │
                          └───────────────────┘
```

## Core Components

### 1. Frontend (Next.js 14)

**Pages:**
- `/` - Landing page
- `/auth/signin` - OAuth login
- `/onboarding` - Profile setup (name, age, interests)
- `/dashboard` - Shows penpal status
- `/chat` - Real-time messaging interface
- `/settings` - User settings and subscription

**Key Features:**
- Server-side rendering for SEO
- App Router for modern routing
- TailwindCSS for styling
- Socket.io client for real-time updates

### 2. Backend API (Next.js API Routes)

**Authentication:**
- `POST /api/auth/[...nextauth]` - NextAuth.js OAuth handlers

**User Management:**
- `GET /api/user/profile` - Get current user
- `PUT /api/user/profile` - Update profile
- `POST /api/user/onboarding` - Complete onboarding

**Penpal Management:**
- `GET /api/penpal/current` - Get active penpal
- `POST /api/penpal/cancel` - Cancel relationship (after 2 weeks)
- `POST /api/penpal/report` - Report/block user

**Messaging:**
- `GET /api/messages/[penpalId]` - Get message history
- `POST /api/messages/send` - Send message (with moderation)

**Payments:**
- `POST /api/stripe/checkout` - Create subscription
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

**Content:**
- `GET /api/stickers` - Get available stickers

### 3. Socket.io Server (Separate Node.js)

**Events:**
- `authenticate` - User connects with userId
- `join:penpal` - Join penpal chat room
- `message:send` - Send real-time message
- `message:receive` - Receive message
- `message:read` - Mark messages as read
- `typing:start/stop` - Typing indicators
- `penpal:matched` - Notification of new match

**Why Separate Server?**
- Vercel serverless functions have 10-second timeout
- WebSocket connections need persistent connections
- Better scalability for real-time features

### 4. Database (PostgreSQL via Supabase)

**Schema:**

```
users
├── id (primary key)
├── email (unique)
├── name
├── age
├── interests (array)
├── isMinor (computed: age < 18)
├── isVerified (subscription status)
├── stripeCustomerId
└── subscriptionId

penpals
├── id (primary key)
├── user1Id (foreign key)
├── user2Id (foreign key)
├── status (active/cancelled/blocked)
├── startedAt
├── canCancelAt (startedAt + 14 days)
└── cancelledBy

messages
├── id (primary key)
├── penpalId (foreign key)
├── senderId (foreign key)
├── content
├── type (text/sticker/gif/photo/video)
├── moderationStatus (pending/approved/flagged)
├── createdAt
└── readAt

waitlist
├── id (primary key)
├── userId (foreign key)
├── isMinor
└── createdAt

reports
├── id (primary key)
├── reporterId (foreign key)
├── reportedId (foreign key)
├── penpalId (foreign key)
├── reason
└── status

stickers
├── id (primary key)
├── name
├── imageUrl (Supabase Storage)
└── category
```

### 5. Storage (Supabase Storage)

**Buckets:**
- `stickers` - App stickers and emotes
- `user-media` - Photos/videos (verified users only)

**Access Control:**
- Public read for stickers
- Authenticated write for user media
- Verification check before upload

### 6. External Services

**OpenAI Moderation API:**
- Free and unlimited
- Checks all text messages before delivery
- Flags: harassment, hate, sexual, violence, self-harm

**Stripe:**
- $1.99/month subscription
- Unlocks: multiple penpals, photo/video sharing
- Webhook for subscription status updates

**OAuth Providers:**
- Google
- Facebook
- TikTok (future)

## Data Flow

### User Signup & Matching

```
1. User clicks "Sign in with Google"
2. OAuth redirect → Google → Callback
3. NextAuth creates user in database
4. Redirect to /onboarding
5. User enters: name, age, interests
6. System calculates isMinor (age < 18)
7. Call matching service:
   - Search waitlist for compatible user (same isMinor status)
   - If found: create penpal relationship, remove both from waitlist
   - If not found: add user to waitlist
8. If matched: send email notification to both users
9. Redirect to /dashboard or /chat
```

### Real-time Messaging

```
1. User opens /chat
2. Socket.io connects to server
3. Emit 'authenticate' with userId
4. Emit 'join:penpal' with penpalId
5. User types message
6. Frontend calls POST /api/messages/send
7. Backend runs OpenAI moderation
8. If approved: save to database
9. Backend emits to Socket.io server
10. Socket.io broadcasts to penpal room
11. Both users receive message instantly
```

### Cancellation & Re-matching

```
1. User clicks "Cancel Penpal" (after 2 weeks)
2. POST /api/penpal/cancel
3. Update penpal status to 'cancelled'
4. Call matching service
5. Search waitlist for new match
6. If found: create new relationship
7. If not: add to waitlist
8. Send email when new match found
```

## Security Measures

### Age Safety
- Hard constraint: minors only match with minors
- Enforced at database level and matching logic
- Age verification required during onboarding

### Content Moderation
- All text messages run through OpenAI Moderation API
- Flagged content not delivered
- Severe violations auto-block user

### Media Sharing
- Photos/videos only for verified users ($1.99/month)
- Reduces spam and inappropriate content
- Both users must be verified

### Report & Block
- Immediate relationship termination
- User added to block list
- Admin review queue (future)

### Rate Limiting
- Prevent message spam
- API rate limits on sensitive endpoints

## Scalability Considerations

### Database
- Indexed queries on penpalId, createdAt
- Waitlist indexed by isMinor, createdAt
- Connection pooling via Supabase

### Socket.io
- Horizontal scaling with Redis adapter (future)
- Room-based messaging for efficiency
- Disconnect handling for cleanup

### Storage
- CDN for sticker delivery
- Lazy loading for media
- Compression for uploads

### Caching
- User profile caching (future)
- Sticker list caching
- Message pagination

## Deployment

### Frontend (Vercel)
- Automatic deployments from Git
- Edge functions for API routes
- Environment variables in dashboard

### Socket.io (Railway/Render)
- Dockerfile for containerization
- Auto-scaling based on connections
- Health check endpoint

### Database (Supabase)
- Managed PostgreSQL
- Automatic backups
- Connection pooling

## Monitoring & Observability

### Metrics to Track
- Active connections (Socket.io)
- Message delivery rate
- Moderation API latency
- Match success rate
- Subscription conversion rate

### Error Tracking
- Sentry for frontend errors (future)
- Winston for backend logging (future)
- Supabase logs for database queries

## Future Enhancements

1. **Translation Service** - Real-time message translation
2. **Push Notifications** - Mobile notifications via FCM
3. **Admin Dashboard** - Content moderation review
4. **Analytics** - User engagement metrics
5. **React Native App** - iOS and Android apps
6. **Group Penpals** - Multiple users in one chat (premium)
7. **Voice Messages** - Audio recording and playback
8. **Profile Customization** - Avatars, themes, bio
