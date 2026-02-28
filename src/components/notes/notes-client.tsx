"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, StickyNote, Search, LayoutGrid, LayoutList, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NoteForm } from "./note-form";
import { NoteCard } from "./note-card";
import { ConfirmDialog, EmptyState } from "@/components/shared";
import {
  createNote,
  updateNote,
  deleteNote,
  toggleNotePin,
} from "@/actions/notes";
import { NOTE_CATEGORIES } from "@/constants/categories";
import type { Note } from "@/types";
import type { CreateNoteInput, UpdateNoteInput } from "@/lib/validations/note";

// ==========================================
// Types
// ==========================================
interface NotesClientProps {
  initialNotes: Note[];
}

type LayoutType = "grid" | "list";

// ==========================================
// Component
// ==========================================
export function NotesClient({ initialNotes }: NotesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Layout state
  const [layout, setLayout] = useState<LayoutType>("grid");

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ==========================================
  // Derived Data
  // ==========================================
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    initialNotes.forEach((note) => {
      note.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [initialNotes]);

  const filteredNotes = useMemo(() => {
    return initialNotes.filter((note) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title?.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesTags = note.tags?.some((t) =>
          t.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      // Tag filter
      if (selectedTag && !note.tags?.includes(selectedTag)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && (note.category ?? "general") !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [initialNotes, searchQuery, selectedTag, selectedCategory]);

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned);

  const hasActiveFilters = searchQuery !== "" || selectedTag !== null || selectedCategory !== "all";

  // ==========================================
  // Handlers
  // ==========================================
  const handleCreate = async (data: CreateNoteInput) => {
    const result = await createNote(data);
    if (result.success) {
      toast.success("Note created");
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to create note");
      throw new Error(result.error);
    }
  };

  const handleUpdate = async (data: CreateNoteInput) => {
    if (!editingNote) return;

    const updateData: UpdateNoteInput = {
      id: editingNote.id,
      ...data,
    };

    const result = await updateNote(updateData);
    if (result.success) {
      toast.success("Note updated");
      setEditingNote(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update note");
      throw new Error(result.error);
    }
  };

  const handleTogglePin = async (id: string) => {
    const result = await toggleNotePin(id);
    if (result.success) {
      toast.success(result.data?.pinned ? "Note pinned" : "Note unpinned");
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to toggle pin");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await deleteNote(deleteId);
    if (result.success) {
      toast.success("Note deleted");
      setDeleteId(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete note");
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingNote(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
    setSelectedCategory("all");
  };

  // ==========================================
  // Render
  // ==========================================
  const gridClasses =
    layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      : "space-y-2";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">
            Capture your thoughts and ideas.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Search, Tags & Layout */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {NOTE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Layout Toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={layout === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLayout("grid")}
            className="h-8 px-2"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={layout === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLayout("list")}
            className="h-8 px-2"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedTag(selectedTag === tag ? null : tag)
              }
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Notes */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<StickyNote className="h-12 w-12" />}
          title={hasActiveFilters ? "No notes match" : "No notes yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Jot down your first thought"
          }
          action={
            !hasActiveFilters ? (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                📌 Pinned ({pinnedNotes.length})
              </h3>
              <div className={gridClasses}>
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unpinned */}
          {unpinnedNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <h3 className="text-sm font-medium text-muted-foreground">
                  Others ({unpinnedNotes.length})
                </h3>
              )}
              <div className={gridClasses}>
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <NoteForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={editingNote ? handleUpdate : handleCreate}
        defaultValues={editingNote ?? undefined}
        mode={editingNote ? "edit" : "create"}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}
