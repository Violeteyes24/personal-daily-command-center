import { z } from "zod";
import { ACCOUNT_KINDS } from "@/constants/categories";
import { roundAmount } from "@/lib/money";
import type { AccountKind } from "@/types";

// Typed as AccountKind so the parsed value matches the Prisma enum column.
const accountKindValues = ACCOUNT_KINDS.map((k) => k.value) as [
  AccountKind,
  ...AccountKind[],
];

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40, "Name is too long"),
  kind: z.enum(accountKindValues),
  // Credit cards carry a negative balance (what you owe), so this is not
  // constrained to positive numbers.
  startingBalance: z.coerce
    .number()
    .min(-100_000_000, "Balance is too small")
    .max(100_000_000, "Balance is too large")
    .transform(roundAmount)
    .default(0),
  emergencyOnly: z.boolean().default(false),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().min(1, "Account id is required"),
  archived: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
