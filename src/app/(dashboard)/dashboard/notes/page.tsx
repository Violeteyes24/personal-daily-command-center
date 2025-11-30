import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">
            Capture your thoughts and ideas.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="text-lg">No notes yet</p>
            <p className="text-sm">Jot down your first thought</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
