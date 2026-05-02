import { useAllTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/10 text-warning",
  done: "bg-success/10 text-success",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

const Dashboard = () => {
  const { data: tasks = [], isLoading: tasksLoading } = useAllTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = tasks.filter(
    (t) => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== "done"
  ).length;

  const stats = [
    { label: "Total Projects", value: projects.length, icon: FolderKanban, color: "text-primary" },
    { label: "Total Tasks", value: totalTasks, icon: ListTodo, color: "text-foreground" },
    { label: "Completed", value: doneTasks, icon: CheckCircle2, color: "text-success" },
    { label: "Overdue", value: overdueTasks, icon: AlertTriangle, color: "text-destructive" },
  ];

  const recentTasks = tasks.slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your projects and tasks</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-muted p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold font-display">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : recentTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No tasks yet. Create a project to get started!</p>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(task as any).projects?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant="secondary" className={`text-xs ${statusColors[task.status]}`}>
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Your Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No projects yet.</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {(project as any).project_members?.[0]?.count ?? 0} members
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;