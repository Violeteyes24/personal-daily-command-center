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
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

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

### Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables (same as `.env.local`)
5. Deploy!

### Environment Variables for Production

In Vercel dashboard, add:

```
DATABASE_URL=your-production-database-url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

> **Note**: For production, use `pk_live_` and `sk_live_` keys from Clerk's production instance.
