-- Pre-migration for the expense tracker upgrade.
--
-- RUN THIS BEFORE `npx prisma db push`.
--
-- Two schema changes need existing rows prepared first:
--
--   1. BudgetGoal.category becomes NOT NULL with an 'overall' sentinel.
--      It was nullable, and Postgres treats NULLs as distinct in a unique
--      index — which is exactly why duplicate "overall" budgets could be
--      created. Those duplicates must be collapsed before the unique
--      constraint can be enforced.
--
--   2. Expense.amount and BudgetGoal.amount become Decimal(12,2).
--      Postgres casts double precision -> numeric automatically, so no
--      preparation is needed for those. Values are rounded to 2 decimals.
--
-- Safe to run more than once.

BEGIN;

-- 1a. Collapse duplicate overall budgets, keeping the oldest row for each
--     (user, month). This is the data damage the old nullable column allowed.
DELETE FROM "BudgetGoal" a
USING "BudgetGoal" b
WHERE a."category" IS NULL
  AND b."category" IS NULL
  AND a."userId" = b."userId"
  AND a."month"  = b."month"
  AND (
    a."createdAt" > b."createdAt"
    OR (a."createdAt" = b."createdAt" AND a."id" > b."id")
  );

-- 1b. Replace NULL with the sentinel the application now stores.
UPDATE "BudgetGoal"
SET "category" = 'overall'
WHERE "category" IS NULL;

COMMIT;

-- Verify before pushing — both queries should return 0 rows:
--
--   SELECT COUNT(*) FROM "BudgetGoal" WHERE "category" IS NULL;
--
--   SELECT "userId", "month", COUNT(*)
--   FROM "BudgetGoal"
--   GROUP BY "userId", "month", "category"
--   HAVING COUNT(*) > 1;
--
-- Then:  npx prisma db push && npx prisma generate
