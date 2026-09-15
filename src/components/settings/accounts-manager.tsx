"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared";
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from "@/actions/accounts";
import { ACCOUNT_KINDS } from "@/constants/categories";
import { formatCurrency } from "@/lib/utils";
import type { Account, AccountKind } from "@/types";

interface AccountsManagerProps {
  accounts: Account[];
}

export function AccountsManager({ accounts }: AccountsManagerProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("ewallet");
  const [startingBalance, setStartingBalance] = useState("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => startTransition(() => router.refresh());

  const openCreate = () => {
    setEditing(null);
    setName("");
    setKind("ewallet");
    setStartingBalance("");
    setEmergencyOnly(false);
    setError(null);
    setIsOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditing(account);
    setName(account.name);
    setKind(account.kind);
    setStartingBalance(account.startingBalance.toString());
    setEmergencyOnly(account.emergencyOnly);
    setError(null);
    setIsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    const balance = startingBalance.trim() === "" ? 0 : Number(startingBalance);
    if (Number.isNaN(balance)) {
      setError("Starting balance must be a number.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      kind,
      startingBalance: balance,
      emergencyOnly,
    };

    const result = editing
      ? await updateAccount({ id: editing.id, ...payload })
      : await createAccount(payload);

    setIsSaving(false);

    if (result.success) {
      toast.success(editing ? "Account updated" : "Account added");
      setIsOpen(false);
      refresh();
    } else {
      setError(result.error ?? "Could not save account.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteAccount(deleteTarget.id);
    if (result.success) {
      toast.success("Account removed");
      setDeleteTarget(null);
      refresh();
    } else {
      toast.error(result.error ?? "Could not remove account");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>
                Wallets, banks and cards you spend from
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No accounts yet. Add one to start attributing expenses.
          </p>
        ) : (
          accounts.map((account) => {
            const info = ACCOUNT_KINDS.find((k) => k.value === account.kind);
            return (
              <div
                key={account.id}
                className="flex items-center justify-between gap-2 rounded-md border p-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <span aria-hidden>{info?.icon ?? "💼"}</span>
                    <span className="truncate">{account.name}</span>
                    {account.emergencyOnly && (
                      <span title="Emergency use only">🚨</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {info?.label ?? account.kind} ·{" "}
                    {formatCurrency(account.startingBalance)} starting
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(account)}
                    aria-label={`Edit ${account.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(account)}
                    aria-label={`Remove ${account.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit account" : "Add account"}</DialogTitle>
            <DialogDescription>
              Starting balance is what the account holds today, before any
              tracked expense.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as AccountKind)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_KINDS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-balance">Starting balance (₱)</Label>
              <Input
                id="account-balance"
                type="number"
                step="0.01"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="0.00"
              />
              {kind === "credit_card" && (
                <p className="text-xs text-muted-foreground">
                  For a credit card, enter what you currently owe as a negative
                  number (e.g. -4500).
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="account-emergency"
                checked={emergencyOnly}
                onCheckedChange={(checked) => setEmergencyOnly(checked === true)}
              />
              <Label htmlFor="account-emergency" className="font-normal">
                Emergency use only — warn me when I spend from this
              </Label>
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Add account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove account"
        description="Accounts with expenses are archived rather than deleted, so past spending keeps its attribution."
        confirmText="Remove"
        variant="destructive"
      />
    </Card>
  );
}
