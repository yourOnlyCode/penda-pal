# Fix Database Connection Issue

The error "Can't reach database server" usually means the password is incorrect or the connection string needs to be updated.

## Solution: Get Fresh Connection String from Supabase

### Option 1: Use Connection Pooling (RECOMMENDED - Most Reliable)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **"Connection string"** section
5. Click the **"Session mode"** tab (NOT "URI")
6. Copy the ENTIRE connection string
7. It will look like:
   ```
   postgresql://postgres.gvquhhykxbjirxzqzdqg:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
8. Replace your `DATABASE_URL` in `.env` with this exact string

### Option 2: Reset Database Password

If Option 1 doesn't work:

1. In Supabase Dashboard → Settings → Database
2. Click **"Reset database password"**
3. **Copy the new password immediately** (you won't see it again!)
4. Go back to Connection string → URI tab
5. Copy the connection string with the new password
6. Update your `.env` file

### After Updating:

1. **Stop your dev server** (if running)
2. **Update the .env file** with the new connection string
3. **Run**: `npx prisma db push`
4. **Run**: `npx prisma generate`
5. **Restart dev server**: `npm run dev`

## Why Connection Pooling is Better:

- Handles special characters in passwords automatically
- More reliable connections
- Better for serverless environments
- Uses port 6543 instead of 5432

