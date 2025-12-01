import { getTasks } from "@/actions/tasks";
import { TasksClient } from "@/components/tasks";

export default async function TasksPage() {
  const result = await getTasks();
  const tasks = result.success ? result.data ?? [] : [];

  return <TasksClient initialTasks={tasks} />;
}
