# Setup & Installation Guide 🚀

Complete guide to set up the Personal Daily Command Center from scratch.

---

## Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 18.0+ | `node --version` |
| npm | 8.0+ | `npm --version` |
| Git | Any | `git --version` |

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd personal-daily-command-center

# Install dependencies
npm install
```

---

## Step 2: Set Up Clerk Authentication

1. **Create Clerk Account**
   - Go to [https://clerk.com](https://clerk.com)
   - Sign up for a free account

2. **Create New Application**
   - Click "Add Application"
   - Name it "Command Center" (or your choice)
   - Select sign-in options (Email, Google, GitHub, etc.)

3. **Get API Keys**
   - Go to your application dashboard
   - Open the [API Keys page](https://dashboard.clerk.com/last-active?path=api-keys)
   - Copy:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_`)
     - `CLERK_SECRET_KEY` (starts with `sk_`)

4. **Configure Redirect URLs** (optional, for production)
   - Go to "Paths" in Clerk dashboard
   - Set sign-in URL: `/sign-in`
   - Set sign-up URL: `/sign-up`
   - Set after sign-in URL: `/dashboard`

---

## Step 3: Set Up Database

Choose ONE of these options:

### Option A: Vercel Postgres (Recommended for Deployment)

1. Go to [https://vercel.com](https://vercel.com)
2. Create account / Sign in
3. Go to Storage → Create Database → Postgres
4. Copy the `DATABASE_URL` from the `.env.local` tab

### Option B: Supabase (Great Free Tier)

1. Go to [https://supabase.com](https://supabase.com)
2. Create new project
3. Wait for setup to complete
4. Go to Settings → Database → Connection string
5. Select "URI" and copy it
6. Replace `[YOUR-PASSWORD]` with your database password

### Option C: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a database:
   ```bash
   psql -U postgres
   CREATE DATABASE command_center;
   \q
   ```
3. Your URL will be: `postgresql://postgres:password@localhost:5432/command_center`

### Option D: Docker PostgreSQL (Local Development)

```bash
# Run PostgreSQL in Docker
docker run --name command-center-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=command_center \
  -p 5432:5432 \
  -d postgres:15

# Your URL: postgresql://postgres:postgres@localhost:5432/command_center
```

---

## Step 4: Configure Environment Variables

1. **Create `.env.local` file**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your credentials:
   ```env
   # Database (from Step 3)
   DATABASE_URL="postgresql://user:password@host:5432/command_center"

   # Clerk Authentication (from Step 2)
   # Get these from https://dashboard.clerk.com/last-active?path=api-keys
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_key_here

   # Clerk URLs (optional - defaults work fine)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

## Step 5: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

**Verify it worked:**
```bash
# Open Prisma Studio to see your database
npx prisma studio
```

This opens a browser window showing your database tables.

---

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see:
1. Landing page with "Get Started" button
2. Click to sign up with Clerk
3. After sign-in, redirected to dashboard

---

## Troubleshooting

### "Cannot connect to database"

- Check your `DATABASE_URL` is correct
- Ensure database server is running
- For Supabase/Vercel: check if IP allowlist is needed

### "Clerk error: Invalid API key"

- Check both keys are in `.env.local`
- Ensure no extra spaces around the keys
- Restart dev server after adding keys

### "Prisma: Table does not exist"

```bash
npx prisma db push --force-reset
npx prisma generate
```

### "Module not found"

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Port 3000 already in use

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

---

## Verifying Setup

### ✅ Checklist

- [ ] `npm run dev` starts without errors
- [ ] Landing page loads at `localhost:3000`
- [ ] Can sign up / sign in with Clerk
- [ ] Redirected to `/dashboard` after sign-in
- [ ] No console errors in browser
- [ ] `npx prisma studio` shows all tables

---

## Next Steps

After setup is complete:

1. **Explore the dashboard** - Click through all sections
2. **Read the docs** - Check `docs/ARCHITECTURE.md`
3. **Start developing** - See `docs/CONTRIBUTING.md`

---

## Production Deployment

### Deploy to Vercel with Supabase

#### Step 1: Set Up Supabase Database

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and name your project
   - Set a strong database password (save this!)
   - Select a region close to your users
   - Wait for project to be created (~2 minutes)

2. **Get Connection Strings**
   - Go to **Settings → Database** 
   - Scroll to **Connection string** section
   - You need TWO URLs:

   **Transaction Pooler (for your app - use this as DATABASE_URL):**
   - Select "Transaction" mode
   - Copy the URI
   - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

   **Session Pooler (for migrations - use this as DIRECT_URL):**
   - Select "Session" mode  
   - Copy the URI
   - Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

   > **Important:** Replace `[YOUR-PASSWORD]` with your actual database password

3. **Run Initial Migration**
   - Add both URLs to your local `.env.local`
   - Run: `npx prisma db push`

#### Step 2: Set Up Clerk Production Instance

1. **Create Production Instance in Clerk**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Click your app name dropdown → "Production"
   - Or create a new production instance

2. **Get Production Keys**
   - In the production instance, go to **API Keys**
   - Copy both keys (they start with `pk_live_` and `sk_live_`)

#### Step 3: Configure Vercel Environment Variables

In Vercel project settings → Environment Variables, add:

```
# Database (Supabase Transaction Pooler - port 6543)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Direct URL for migrations (Supabase Session Pooler - port 5432)  
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Clerk Production Keys (NOT test keys!)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### Step 4: Deploy and Verify

1. Push your code and trigger a new deployment
2. Visit your deployed URL
3. Try signing up with Clerk
4. Create a test task to verify database connection

### Troubleshooting Production Issues

#### "Server-side exception" / Database Connection Errors
- Verify `DATABASE_URL` uses the pooler URL (port **6543**)
- Check your password doesn't have unescaped special characters
- Ensure Supabase project isn't paused (free tier pauses after inactivity)

#### "Clerk: Development keys detected"  
- You're using `pk_test_` / `sk_test_` keys in production
- Switch to production keys: `pk_live_` / `sk_live_`
- Create a production instance in Clerk if you haven't

#### "Too many connections" / Timeout Errors
- Make sure DATABASE_URL uses Transaction pooler (port 6543)
- NOT the direct connection (port 5432)
