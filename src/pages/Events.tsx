import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi, Event } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarDays, Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Events() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    fetchEvents();
  }, [isAuthenticated, navigate]);

  const fetchEvents = async () => {
    try {
      const data = await eventsApi.getAll();
      setEvents(data);
      setFilteredEvents(data);
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = events.filter((event) =>
      event.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [search, events]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      date_bs: formData.get("date_bs") as string,
    };

    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, data);
        toast.success("Event updated successfully");
      } else {
        await eventsApi.create(data);
        toast.success("Event created successfully");
      }
      setIsDialogOpen(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await eventsApi.delete(id);
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg gradient-primary flex items-center justify-center">
              <CalendarDays className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            </div>
            Events
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            कार्यक्रम व्यवस्थापन
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-accent text-secondary-foreground gap-2 w-full sm:w-auto" onClick={() => setEditingEvent(null)}>
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Create New Event"}
              </DialogTitle>
              <DialogDescription>
                {editingEvent
                  ? "Update the event details"
                  : "Add a new event to your calendar"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Event title"
                  defaultValue={editingEvent?.title || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Event description (optional)"
                  defaultValue={editingEvent?.description || ""}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_bs">Date (BS)</Label>
                <Input
                  id="date_bs"
                  name="date_bs"
                  type="date"
                  defaultValue={editingEvent?.date_bs || ""}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter date in BS format (e.g., 2081-01-15)
                </p>
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
                  ) : editingEvent ? (
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 md:h-11"
        />
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-3 md:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 md:h-24 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-3 md:space-y-4">
          {filteredEvents.map((event, index) => (
            <Card
              key={event.id}
              className="glass-card hover-lift animate-slide-in-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-3 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base md:text-lg truncate">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 md:mt-3 text-xs md:text-sm">
                      <span className="px-2 py-1 rounded bg-muted">
                        BS: {event.date_bs}
                      </span>
                      <span className="text-muted-foreground">
                        AD: {event.date_ad}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(event)}
                      className="hover:bg-muted h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(event.id)}
                      className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-8 md:p-12 text-center">
            <CalendarDays className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm md:text-base text-muted-foreground">No events found</p>
            <Button
              className="mt-4 gradient-accent text-secondary-foreground"
              onClick={() => setIsDialogOpen(true)}
            >
              Create your first event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
