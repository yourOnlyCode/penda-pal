# How to Get the Correct DATABASE_URL from Supabase

## Method 1: Copy Connection String Directly (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll down to **"Connection string"** section
5. Click the **"URI"** tab (not Session mode or Transaction mode)
6. You'll see a connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.gvquhhykxbjirxzqzdqg.supabase.co:5432/postgres
   ```
7. **Copy the ENTIRE string** - it already has the correct password with proper encoding
8. Paste it into your `.env` file as:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.gvquhhykxbjirxzqzdqg.supabase.co:5432/postgres"
   ```

## Method 2: Use Connection Pooling (Recommended for Special Characters)

1. In Supabase Dashboard → Settings → Database
2. Scroll to **"Connection string"**
3. Click the **"Session mode"** tab
4. Copy that connection string (uses port 6543)
5. It looks like:
   ```
   postgresql://postgres.gvquhhykxbjirxzqzdqg:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
6. This format handles special characters in passwords better!

## Method 3: Reset Database Password

If you're not sure what the password is:

1. In Supabase Dashboard → Settings → Database
2. Click **"Reset database password"**
3. **Copy the new password immediately** (you won't see it again!)
4. Use it in your connection string

## After Updating .env:

1. **Stop your dev server** (Ctrl+C)
2. **Restart it**: `npm run dev`
3. The connection should work!

