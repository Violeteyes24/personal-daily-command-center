"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createHabitSchema,
  type CreateHabitInput,
} from "@/lib/validations/habit";
import { DEFAULT_HABIT_ICONS } from "@/constants/categories";
import type { Habit } from "@/types";

// ==========================================
// Types
// ==========================================
interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateHabitInput) => Promise<void>;
  defaultValues?: Partial<Habit>;
  mode?: "create" | "edit";
}

// ==========================================
// Component
// ==========================================
export function HabitForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode = "create",
}: HabitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateHabitInput>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: {
      name: "",
      icon: "💧",
      frequency: "daily",
      reminderEnabled: false,
      reminderTime: null,
    },
  });

  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        name: defaultValues.name ?? "",
        icon: defaultValues.icon ?? "💧",
        frequency: defaultValues.frequency ?? "daily",
        reminderEnabled: defaultValues.reminderEnabled ?? false,
        reminderTime: defaultValues.reminderTime ?? null,
      });
    } else if (open && !defaultValues) {
      form.reset({
        name: "",
        icon: "💧",
        frequency: "daily",
        reminderEnabled: false,
        reminderTime: null,
      });
    }
  }, [open, defaultValues, form]);

  const handleSubmit = async (data: CreateHabitInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Habit" : "Edit Habit"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new habit to track daily."
              : "Make changes to your habit."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Icon Picker */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_HABIT_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => field.onChange(icon)}
                        className={`rounded-lg p-2 text-xl transition-colors hover:bg-muted ${
                          field.value === icon
                            ? "bg-primary/10 ring-2 ring-primary"
                            : ""
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Drink 8 glasses of water"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reminder */}
            <div className="space-y-3 rounded-lg border p-3">
              <FormField
                control={form.control}
                name="reminderEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5" />
                        Daily Reminder
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Get a browser notification at a set time
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("reminderEnabled") && (
                <FormField
                  control={form.control}
                  name="reminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Create Habit" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
