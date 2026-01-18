import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { holidaysApi, eventsApi, tasksApi, Holiday, Event, Task } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDays, ListTodo, Star, Clock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { NepaliCalendarView } from "@/components/NepaliCalendarView";

export default function Dashboard() {
  const { isAuthenticated, username } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [allHolidays, setAllHolidays] = useState<Holiday[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const holidayData = await holidaysApi.getAll();
        
        // Filter to only show upcoming holidays (date_ad >= today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingHolidays = holidayData.filter((h: Holiday) => {
          const holidayDate = new Date(h.date_ad);
          return holidayDate >= today;
        });
        
        setAllHolidays(holidayData);
        setHolidays(upcomingHolidays.slice(0, 5));

        if (isAuthenticated) {
          const [eventData, taskData] = await Promise.all([
            eventsApi.getAll(),
            tasksApi.getAll(),
          ]);
          setEvents(eventData);
          setTasks(taskData.filter((t: Task) => t.status !== "Completed").slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl md:rounded-2xl gradient-primary p-4 md:p-8 text-primary-foreground">
        <div className="relative z-10">
          <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">
            {isAuthenticated ? `स्वागत छ, ${username}!` : "स्वागत छ"}
          </h1>
          <p className="text-sm md:text-base text-primary-foreground/80 max-w-lg">
            Your comprehensive academic year planner with Nepali calendar integration.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-32 md:w-64 h-32 md:h-64 opacity-10">
          <Calendar className="w-full h-full" />
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive */}
      {isAuthenticated && (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="glass-card">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="order-2 md:order-1">
                  <p className="text-xs md:text-sm text-muted-foreground">Events</p>
                  <p className="text-xl md:text-3xl font-bold">{events.length}</p>
                </div>
                <div className="order-1 md:order-2 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl gradient-accent flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 md:w-6 md:h-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="order-2 md:order-1">
                  <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl md:text-3xl font-bold">{pendingTasks}</p>
                </div>
                <div className="order-1 md:order-2 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary flex items-center justify-center">
                  <Clock className="w-4 h-4 md:w-6 md:h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="order-2 md:order-1">
                  <p className="text-xs md:text-sm text-muted-foreground">Active</p>
                  <p className="text-xl md:text-3xl font-bold">{inProgressTasks}</p>
                </div>
                <div className="order-1 md:order-2 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl gradient-primary flex items-center justify-center">
                  <ListTodo className="w-4 h-4 md:w-6 md:h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar and Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Nepali Calendar */}
        <NepaliCalendarView 
          holidays={allHolidays} 
          events={events}
          compact={true}
        />

        {/* Upcoming Holidays */}
        <Card className="glass-card">
          <CardHeader className="p-4 md:p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Star className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
                Upcoming Holidays
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">आगामी बिदाहरू</CardDescription>
            </div>
            <NavLink to="/holidays" className="text-xs md:text-sm text-primary hover:underline">
              View all
            </NavLink>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 md:h-14 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : holidays.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{holiday.name}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{holiday.date_bs}</p>
                    </div>
                    {holiday.is_public && (
                      <Badge variant="secondary" className="gradient-accent text-secondary-foreground text-xs ml-2 shrink-0">
                        Public
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6 md:py-8 text-sm">No upcoming holidays</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Events / Login Prompt */}
      {isAuthenticated ? (
        events.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="p-4 md:p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CalendarDays className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Recent Events
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Your scheduled events</CardDescription>
              </div>
              <NavLink to="/events" className="text-xs md:text-sm text-primary hover:underline">
                View all
              </NavLink>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {events.slice(0, 4).map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.date_bs}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="glass-card border-dashed border-2">
          <CardContent className="p-6 md:p-8 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full gradient-primary mx-auto mb-3 md:mb-4 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Sign in for more features</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create events, manage tasks, and collaborate.
            </p>
            <NavLink to="/auth">
              <button className="px-5 py-2 rounded-lg gradient-accent text-secondary-foreground font-medium hover:opacity-90 transition-opacity text-sm md:text-base">
                Get Started
              </button>
            </NavLink>
          </CardContent>
        </Card>
      )}

      {/* Tasks Section */}
      {isAuthenticated && tasks.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="p-4 md:p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <ListTodo className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Active Tasks
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Tasks needing attention</CardDescription>
            </div>
            <NavLink to="/tasks" className="text-xs md:text-sm text-primary hover:underline">
              View all
            </NavLink>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      {task.assigned_to_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          Assigned to: {task.assigned_to_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {task.due_date}
                      </p>
                    </div>
                    <Badge
                      variant={task.status === "Pending" ? "secondary" : "default"}
                      className={cn(
                        "text-xs shrink-0",
                        task.status === "In Progress" && "gradient-primary text-primary-foreground"
                      )}
                    >
                      {task.status === "In Progress" ? "Active" : task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
