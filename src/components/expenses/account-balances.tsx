"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCOUNT_KINDS } from "@/constants/categories";
import { cn, formatCurrency } from "@/lib/utils";
import type { AccountBalance } from "@/types";

interface AccountBalancesProps {
  balances: AccountBalance[];
  totalAvailable: number;
  totalOwed: number;
  /** This month's spend per account, for the secondary line. */
  monthlySpend?: { accountId: string; total: number }[];
  /** Emergency-only accounts used this month. */
  emergencyUsed?: { name: string; total: number }[];
}

function kindInfo(kind: string) {
  return (
    ACCOUNT_KINDS.find((k) => k.value === kind) ?? {
      icon: "💼",
      label: kind,
    }
  );
}

export function AccountBalances({
  balances,
  totalAvailable,
  totalOwed,
  monthlySpend = [],
  emergencyUsed = [],
}: AccountBalancesProps) {
  if (balances.length === 0) return null;

  const spendByAccount = new Map(monthlySpend.map((s) => [s.accountId, s.total]));

  // Credit cards track debt, not spendable money, so they sit below the total.
  const spendable = balances.filter((b) => b.kind !== "credit_card");
  const cards = balances.filter((b) => b.kind === "credit_card");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Balances now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {emergencyUsed.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {emergencyUsed
                .map((a) => `${a.name} (${formatCurrency(a.total)})`)
                .join(", ")}{" "}
              used this month — that account is marked emergency-only.
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          {spendable.map((account) => (
            <Row
              key={account.id}
              account={account}
              monthSpend={spendByAccount.get(account.id)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-2.5 text-sm font-semibold">
          <span>Total available</span>
          <span className={cn(totalAvailable < 0 && "text-red-600 dark:text-red-400")}>
            {formatCurrency(totalAvailable)}
          </span>
        </div>

        {cards.length > 0 && (
          <div className="space-y-1.5 border-t pt-2.5">
            {cards.map((account) => (
              <Row
                key={account.id}
                account={account}
                monthSpend={spendByAccount.get(account.id)}
                isCard
              />
            ))}
            {cards.length > 1 && (
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Total owed</span>
                <span className="text-amber-700 dark:text-amber-400">
                  {formatCurrency(totalOwed)}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({
  account,
  monthSpend,
  isCard = false,
}: {
  account: AccountBalance;
  monthSpend?: number;
  isCard?: boolean;
}) {
  const info = kindInfo(account.kind);
  // A card's negative balance is money owed; show it as a positive debt.
  const owed = isCard ? Math.abs(Math.min(account.balance, 0)) : 0;

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex min-w-0 items-center gap-1.5">
        <span aria-hidden>{info.icon}</span>
        <span className="truncate">{account.name}</span>
        {account.emergencyOnly && (
          <span title="Emergency use only" aria-label="Emergency use only">
            🚨
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {monthSpend !== undefined && monthSpend > 0 && (
          <span className="text-xs text-muted-foreground">
            −{formatCurrency(monthSpend)} this month
          </span>
        )}
        <span
          className={cn(
            "font-medium tabular-nums",
            isCard
              ? "text-amber-700 dark:text-amber-400"
              : account.balance < 0 && "text-red-600 dark:text-red-400"
          )}
        >
          {isCard ? `${formatCurrency(owed)} owed` : formatCurrency(account.balance)}
        </span>
      </span>
    </div>
  );
}
