# Personal Daily Command Center 🎯

A personal life dashboard to track tasks, habits, expenses, notes, and mood — all in one beautiful, simple interface.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)

## ✨ Features

- **📋 Task Management** - Prioritize tasks with due dates and priority levels
- **📈 Habit Tracking** - Build streaks and track daily/weekly habits
- **💰 Expense Tracking** - Quick input with categories and trend insights
- **📝 Quick Notes** - Capture thoughts with tags and pinning
- **😊 Mood Check-in** - Track emotional well-being with daily entries
- **📊 Dashboard** - See everything at a glance with beautiful charts

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [Prisma](https://www.prisma.io/) | Database ORM |
| [PostgreSQL](https://www.postgresql.org/) | Database |
| [Clerk](https://clerk.com/) | Authentication |
| [ShadCN UI](https://ui.shadcn.com/) | UI Components |
| [Zod](https://zod.dev/) | Validation |
| [Lucide React](https://lucide.dev/) | Icons |

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/          # Protected dashboard pages
│   │   └── dashboard/
│   │       ├── tasks/
│   │       ├── habits/
│   │       ├── expenses/
│   │       ├── notes/
│   │       ├── mood/
│   │       └── settings/
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Landing page
│
├── actions/                  # Server Actions (backend logic)
│   ├── tasks.ts
│   ├── habits.ts
│   ├── expenses.ts
│   ├── notes.ts
│   └── mood.ts
│
├── components/
│   ├── ui/                   # ShadCN UI components
│   ├── layouts/              # Sidebar, Header
│   ├── forms/                # Feature-specific forms
│   ├── dashboard/            # Dashboard widgets
│   └── shared/               # Reusable components
│
├── lib/                      # Utilities & configurations
│   ├── db.ts                 # Prisma client
│   ├── auth.ts               # Auth helpers
│   ├── utils.ts              # General utilities
│   └── validations/          # Zod schemas
│
├── constants/                # App constants
├── hooks/                    # Custom React hooks
└── types/                    # TypeScript types
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (local, Vercel Postgres, or Supabase)
- Clerk account for authentication

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd personal-daily-command-center
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in your credentials (see [Environment Variables](#environment-variables))

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### Environment Variables

Create a `.env.local` file with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/command_center"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📖 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and principles
- [AI Prompt Guide](./docs/AI_PROMPT_GUIDE.md) - Context for AI assistants
- [Contributing Guide](./docs/CONTRIBUTING.md) - How to add features

## 🧪 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma db push` | Push schema to database |
| `npx prisma generate` | Generate Prisma client |

## 📝 License

MIT License - feel free to use this for your own personal projects!

---

Built with ❤️ using Next.js, TypeScript, and TailwindCSS
