// Prisma configuration for Next.js with .env.local
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local for Next.js compatibility
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DIRECT_URL for migrations (bypasses connection pooler)
    // Fall back to DATABASE_URL if DIRECT_URL not set
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
