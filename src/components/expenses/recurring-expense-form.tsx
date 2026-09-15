"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPENSE_CATEGORIES,
  NO_ACCOUNT,
  TASK_RECURRENCES,
} from "@/constants/categories";
import { cn } from "@/lib/utils";
import { describeRecurrence, type RecurrenceKind } from "@/lib/recurrence";
import type { Account, RecurringExpense } from "@/types";

interface RecurringExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    amount: number;
    category: string;
    accountId: string | null;
    note?: string;
    recurrence: RecurrenceKind;
    startDate: Date;
    endDate: Date | null;
  }) => Promise<void>;
  accounts: Account[];
  defaultValues?: RecurringExpense;
  mode?: "create" | "edit";
}

export function RecurringExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  accounts,
  defaultValues,
  mode = "create",
}: RecurringExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("bills");
  const [accountId, setAccountId] = useState<string>(NO_ACCOUNT);
  const [recurrence, setRecurrence] = useState<RecurrenceKind>("monthly");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount(defaultValues?.amount?.toString() ?? "");
    setCategory(defaultValues?.category ?? "bills");
    setAccountId(defaultValues?.accountId ?? NO_ACCOUNT);
    setRecurrence((defaultValues?.recurrence as RecurrenceKind) ?? "monthly");
    setStartDate(
      defaultValues?.startDate ? new Date(defaultValues.startDate) : new Date()
    );
    setNote(defaultValues?.note ?? "");
    setError(null);
  }, [open, defaultValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError("Please enter an amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        amount: value,
        category,
        accountId: accountId === NO_ACCOUNT ? null : accountId,
        note: note.trim() || undefined,
        recurrence,
        startDate,
        endDate: null,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : "Could not save. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit recurring expense" : "Add recurring expense"}
          </DialogTitle>
          <DialogDescription>
            Logged automatically each period, starting from the date you pick.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (₱)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>Paid from</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ACCOUNT}>Not specified</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.emergencyOnly ? " 🚨" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAccount?.emergencyOnly && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  {selectedAccount.name} is marked emergency-only.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Repeats</Label>
            <Select
              value={recurrence}
              onValueChange={(value) => setRecurrence(value as RecurrenceKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_RECURRENCES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {describeRecurrence(recurrence, startDate)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Starts</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn("w-full pl-3 text-left font-normal")}
                >
                  {format(startDate, "PPP")}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {mode === "create" && (
              <p className="text-xs text-muted-foreground">
                Past dates are allowed — missed entries are created on the next
                page load.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="e.g. Netflix, rent, Globe load"
              className="resize-none"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Save changes" : "Add recurring"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
