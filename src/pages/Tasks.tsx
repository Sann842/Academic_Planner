import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { tasksApi, eventsApi, Task, Event } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListTodo, Plus, Search, Edit, Trash2, Loader2, Clock, User } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [isAuthenticated, navigate]);

  const fetchData = async () => {
    try {
      const [taskData, eventData] = await Promise.all([
        tasksApi.getAll(),
        eventsApi.getAll(),
      ]);
      setTasks(taskData);
      setFilteredTasks(taskData);
      setEvents(eventData);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tasks;
    
    if (search) {
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }
    
    setFilteredTasks(filtered);
  }, [search, statusFilter, tasks]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const eventId = formData.get("event") as string;
    
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      start_date: formData.get("start_date") as string,
      due_date: formData.get("due_date") as string,
      status: formData.get("status") as string,
      event: eventId && eventId !== "none" ? parseInt(eventId) : undefined,
    };

    try {
      if (editingTask) {
        await tasksApi.update(editingTask.id, data);
        toast.success("Task updated successfully");
      } else {
        await tasksApi.create(data);
        toast.success("Task created successfully");
      }
      setIsDialogOpen(false);
      setEditingTask(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await tasksApi.delete(id);
      toast.success("Task deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await tasksApi.update(taskId, { status: newStatus });
      toast.success("Status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-secondary text-secondary-foreground";
      case "In Progress":
        return "gradient-primary text-primary-foreground";
      case "Completed":
        return "bg-green-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg gradient-primary flex items-center justify-center">
              <ListTodo className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            कार्य व्यवस्थापन
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-accent text-secondary-foreground gap-2 w-full sm:w-auto" onClick={() => setEditingTask(null)}>
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Edit Task" : "Create New Task"}
              </DialogTitle>
              <DialogDescription>
                {editingTask
                  ? "Update the task details"
                  : "Add a new task with timeline"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Task title"
                  defaultValue={editingTask?.title || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Task description (optional)"
                  defaultValue={editingTask?.description || ""}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    defaultValue={editingTask?.start_date || ""}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                    defaultValue={editingTask?.due_date || ""}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingTask?.status || "Pending"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event">Related Event</Label>
                  <Select name="event" defaultValue={editingTask?.event?.toString() || "none"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingTask ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 md:h-11"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 h-10 md:h-11">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="space-y-3 md:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 md:h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3 md:space-y-4">
          {filteredTasks.map((task, index) => (
            <Card
              key={task.id}
              className="glass-card hover-lift animate-slide-in-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-3 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base md:text-lg truncate">{task.title}</h3>
                      <Badge className={getStatusColor(task.status) + " text-xs"}>
                        {task.status}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{task.start_date} → {task.due_date}</span>
                      </div>
                      {task.assigned_to_name && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="w-3.5 h-3.5" />
                          <span>{task.assigned_to_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(task)}
                        className="hover:bg-muted h-8 w-8"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task.id)}
                        className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-8 md:p-12 text-center">
            <ListTodo className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm md:text-base text-muted-foreground">No tasks found</p>
            <Button
              className="mt-4 gradient-accent text-secondary-foreground"
              onClick={() => setIsDialogOpen(true)}
            >
              Create your first task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
