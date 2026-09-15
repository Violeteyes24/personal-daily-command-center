"use server";

import { db } from "@/lib/db";
import {
  createAccountSchema,
  updateAccountSchema,
} from "@/lib/validations/account";
import type { Account, AccountBalance, ActionResponse } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import { DEFAULT_ACCOUNTS } from "@/constants/categories";
import { subtractAmounts, sumBy, toAmount } from "@/lib/money";

type AccountRow = Prisma.AccountGetPayload<object>;

function serialize(account: AccountRow): Account {
  return { ...account, startingBalance: toAmount(account.startingBalance) };
}

function revalidateAccountPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/settings");
}

export async function getAccounts(
  options?: { includeArchived?: boolean }
): Promise<ActionResponse<Account[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const accounts = await db.account.findMany({
      where: {
        userId,
        ...(options?.includeArchived ? {} : { archived: false }),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return { success: true, data: accounts.map(serialize) };
  } catch (error) {
    console.error("Failed to get accounts:", error);
    return { success: false, error: "Failed to get accounts" };
  }
}

/**
 * Create the default set of accounts the first time a user opens the app.
 *
 * Idempotent: skipped entirely once the user has any account, and
 * `skipDuplicates` guards the race where two requests arrive together.
 */
export async function ensureDefaultAccounts(): Promise<ActionResponse<number>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db.account.count({ where: { userId } });
    if (existing > 0) {
      return { success: true, data: 0 };
    }

    const { count } = await db.account.createMany({
      data: DEFAULT_ACCOUNTS.map((account, index) => ({
        userId,
        name: account.name,
        kind: account.kind,
        emergencyOnly: account.emergencyOnly,
        sortOrder: index,
      })),
      skipDuplicates: true,
    });

    if (count > 0) revalidateAccountPaths();
    return { success: true, data: count };
  } catch (error) {
    console.error("Failed to seed default accounts:", error);
    return { success: false, error: "Failed to set up accounts" };
  }
}

export async function createAccount(
  input: unknown
): Promise<ActionResponse<Account>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = createAccountSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const highest = await db.account.findFirst({
      where: { userId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const account = await db.account.create({
      data: {
        ...validated.data,
        userId,
        sortOrder: (highest?.sortOrder ?? -1) + 1,
      },
    });

    revalidateAccountPaths();
    return { success: true, data: serialize(account) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "You already have an account with that name" };
    }
    console.error("Failed to create account:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function updateAccount(
  input: unknown
): Promise<ActionResponse<Account>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateAccountSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { id, ...data } = validated.data;
    if (Object.keys(data).length === 0) {
      return { success: false, error: "Nothing to update" };
    }

    const account = await db.account.update({
      where: { id, userId },
      data,
    });

    revalidateAccountPaths();
    return { success: true, data: serialize(account) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "You already have an account with that name" };
    }
    if (isNotFound(error)) {
      return { success: false, error: "Account not found" };
    }
    console.error("Failed to update account:", error);
    return { success: false, error: "Failed to update account" };
  }
}

/**
 * Archive rather than delete when the account has history, so past expenses
 * keep their attribution. Genuinely unused accounts are removed outright.
 */
export async function deleteAccount(id: string): Promise<ActionResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const account = await db.account.findFirst({
      where: { id, userId },
      select: { id: true, _count: { select: { expenses: true } } },
    });

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    if (account._count.expenses > 0) {
      await db.account.update({ where: { id }, data: { archived: true } });
    } else {
      await db.account.delete({ where: { id } });
    }

    revalidateAccountPaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}

/**
 * Current balance per account: starting balance minus everything spent from
 * it, across all time (not just the month on screen).
 *
 * A credit card's balance is what you owe, so it is reported separately and
 * kept out of `totalAvailable`.
 */
export async function getAccountBalances(): Promise<
  ActionResponse<{
    balances: AccountBalance[];
    totalAvailable: number;
    totalOwed: number;
  }>
> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const [accounts, spendByAccount] = await Promise.all([
      db.account.findMany({
        where: { userId, archived: false },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      db.expense.groupBy({
        by: ["accountId"],
        where: { userId, accountId: { not: null } },
        _sum: { amount: true },
      }),
    ]);

    const spent = new Map<string, number>();
    for (const row of spendByAccount) {
      if (row.accountId) spent.set(row.accountId, toAmount(row._sum.amount));
    }

    const balances: AccountBalance[] = accounts.map((account) => {
      const totalSpent = spent.get(account.id) ?? 0;
      return {
        ...serialize(account),
        totalSpent,
        balance: subtractAmounts(toAmount(account.startingBalance), totalSpent),
      };
    });

    const credit = balances.filter((b) => b.kind === "credit_card");
    const available = balances.filter((b) => b.kind !== "credit_card");

    return {
      success: true,
      data: {
        balances,
        totalAvailable: sumBy(available, (b) => b.balance),
        // Card balances are negative when money is owed; report it positive.
        totalOwed: Math.abs(sumBy(credit, (b) => Math.min(b.balance, 0))),
      },
    };
  } catch (error) {
    console.error("Failed to get account balances:", error);
    return { success: false, error: "Failed to get account balances" };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return hasCode(error, "P2002");
}

function isNotFound(error: unknown): boolean {
  return hasCode(error, "P2025");
}

function hasCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  );
}
