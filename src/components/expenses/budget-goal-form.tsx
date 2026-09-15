"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES, OVERALL_BUDGET } from "@/constants/categories";

interface BudgetGoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { category: string; amount: number }) => Promise<void>;
  defaultCategory?: string;
  defaultAmount?: number;
  mode?: "create" | "edit";
  /** Categories that already have a goal this month — shown as disabled. */
  takenCategories?: string[];
}

export function BudgetGoalForm({
  open,
  onOpenChange,
  onSubmit,
  defaultCategory,
  defaultAmount,
  mode = "create",
  takenCategories = [],
}: BudgetGoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState(defaultCategory ?? OVERALL_BUDGET);
  const [amount, setAmount] = useState(defaultAmount?.toString() ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCategory(defaultCategory ?? OVERALL_BUDGET);
    setAmount(defaultAmount?.toString() ?? "");
    setErrorMessage(null);
  }, [open, defaultCategory, defaultAmount]);

  // A category is unavailable if it already has a goal, except the one this
  // dialog is currently editing.
  const isTaken = (value: string) =>
    value !== defaultCategory && takenCategories.includes(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setErrorMessage("Please enter a valid amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({ category, amount: num });
      onOpenChange(false);
      setAmount("");
      setCategory(OVERALL_BUDGET);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "Could not save budget goal. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Budget Goal" : "Set Budget Goal"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update your monthly spending limit."
              : "Set a monthly spending limit, overall or per category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value={OVERALL_BUDGET}
                  disabled={isTaken(OVERALL_BUDGET)}
                >
                  💰 Overall Budget
                </SelectItem>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                    disabled={isTaken(cat.value)}
                  >
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            {errorMessage && (
              <p className="text-xs text-destructive">{errorMessage}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "edit" ? "Save Changes" : "Save Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
