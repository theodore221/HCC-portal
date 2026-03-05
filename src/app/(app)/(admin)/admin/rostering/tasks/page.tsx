import { getRosterJobsWithTasks } from "@/lib/queries/rostering.server";
import { TasksClient } from "./client";

export default async function TasksPage() {
  const jobs = await getRosterJobsWithTasks();
  return <TasksClient jobs={jobs} />;
}
