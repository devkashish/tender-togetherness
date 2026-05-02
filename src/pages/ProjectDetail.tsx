import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useProject, useProjectMembers, useAddMemberById } from "@/hooks/useProjects";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, TaskStatus, TaskPriority } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

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

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: project, isLoading: projectLoading } = useProject(id!);
  const { data: members = [] } = useProjectMembers(id!);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(id!);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addMember = useAddMemberById();
  const { toast } = useToast();

  const [taskOpen, setTaskOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "member">("member");

  const currentMember = members.find((m) => m.user_id === user?.id);
  const isAdmin = currentMember?.role === "admin";

  if (projectLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return <Navigate to="/projects" replace />;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        project_id: id!,
        title,
        description,
        priority,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
      });
      setTaskOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssignedTo("");
      setDueDate("");
      toast({ title: "Task created!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMember.mutateAsync({ projectId: id!, userId: memberId, role: memberRole });
      setMemberOpen(false);
      setMemberId("");
      toast({ title: "Member added!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask.mutateAsync({ id: taskId, status });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" /> Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Add Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      required
                      placeholder="Paste user ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={memberRole} onValueChange={(v) => setMemberRole(v as "admin" | "member")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={addMember.isPending}>
                    {addMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Member
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Task title" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {(m as any).profiles?.full_name || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={createTask.isPending}>
                  {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Task
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {(["todo", "in_progress", "done"] as TaskStatus[]).map((status) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-sm">{statusLabels[status]}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByStatus[status].length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {tasksByStatus[status].map((task) => (
                    <Card key={task.id} className="group">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium">{task.title}</p>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                              onClick={() => deleteTask.mutate(task.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.due_date), "MMM d")}
                            </span>
                          )}
                          {(task as any).profiles?.full_name && (
                            <span className="text-xs text-muted-foreground">
                              → {(task as any).profiles.full_name}
                            </span>
                          )}
                        </div>
                        <Select
                          value={task.status}
                          onValueChange={(v) => handleStatusChange(task.id, v as TaskStatus)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                      No tasks
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">
                        {(member as any).profiles?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.user_id}</p>
                    </div>
                    <Badge
                      variant={member.role === "admin" ? "default" : "secondary"}
                      className="text-xs capitalize"
                    >
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;