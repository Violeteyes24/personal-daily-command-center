"use client";

import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, Pin, PinOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NOTE_CATEGORIES } from "@/constants/categories";
import type { Note } from "@/types";

// ==========================================
// Types
// ==========================================
interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

// ==========================================
// Component
// ==========================================
export function NoteCard({ note, onEdit, onDelete, onTogglePin }: NoteCardProps) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer group",
        note.pinned && "border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-950/10"
      )}
      onClick={() => onEdit(note)}
    >
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
        <div className="flex-1 min-w-0">
          {note.title ? (
            <h3 className="font-semibold truncate">{note.title}</h3>
          ) : (
            <h3 className="font-semibold text-muted-foreground italic truncate">
              Untitled
            </h3>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(note.updatedAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {note.pinned && (
            <Pin className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id);
                }}
              >
                {note.pinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Category */}
        {note.category && note.category !== "general" && (
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              {NOTE_CATEGORIES.find((c) => c.value === note.category)?.icon ?? "📝"}{" "}
              {NOTE_CATEGORIES.find((c) => c.value === note.category)?.label ?? note.category}
            </Badge>
          </div>
        )}

        {/* Content Preview */}
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {note.content}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
