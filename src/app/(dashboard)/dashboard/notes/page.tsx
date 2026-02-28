import { getNotes } from "@/actions/notes";
import { NotesClient } from "@/components/notes";

export default async function NotesPage() {
  const result = await getNotes();
  const notes = result.success ? result.data ?? [] : [];

  return <NotesClient initialNotes={notes} />;
}
