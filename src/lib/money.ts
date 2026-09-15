/**
 * Money helpers.
 *
 * `Expense.amount` and `BudgetGoal.amount` are `Decimal(12,2)` in Postgres, so
 * Prisma hands back `Decimal` objects rather than numbers. These helpers are
 * the boundary: server actions convert to plain numbers before returning, so
 * client components and chart libraries keep working with primitives.
 *
 * Summing is done in integer centavos. Adding floats accumulates drift
 * (0.1 + 0.2 === 0.30000000000000004), which is visible once a month of
 * expenses is totalled and compared against a budget.
 */

/** Anything Prisma might hand back for a Decimal column. */
type DecimalLike = number | string | { toString(): string };

/** Round to 2 decimal places, away from zero on a tie. */
export function roundAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // Scale via string to dodge cases like 1.005 * 100 === 100.49999999999999.
  const scaled = Math.round(Number(`${value}e2`));
  return Number(`${scaled}e-2`);
}

/** Convert a Prisma Decimal (or number/string) to a plain number for the UI. */
export function toAmount(value: DecimalLike | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return roundAmount(value);

  const parsed = Number(typeof value === "string" ? value : value.toString());
  return Number.isFinite(parsed) ? roundAmount(parsed) : 0;
}

/** Exact centavo-accurate sum. */
export function sumAmounts(values: Iterable<DecimalLike | null | undefined>): number {
  let centavos = 0;
  for (const value of values) {
    centavos += Math.round(toAmount(value) * 100);
  }
  return centavos / 100;
}

/** Exact sum over a list, picking the amount out of each item. */
export function sumBy<T>(
  items: Iterable<T>,
  select: (item: T) => DecimalLike | null | undefined
): number {
  let centavos = 0;
  for (const item of items) {
    centavos += Math.round(toAmount(select(item)) * 100);
  }
  return centavos / 100;
}

/** Exact subtraction, so budget remainders never show float dust. */
export function subtractAmounts(a: DecimalLike, b: DecimalLike): number {
  return (Math.round(toAmount(a) * 100) - Math.round(toAmount(b) * 100)) / 100;
}
