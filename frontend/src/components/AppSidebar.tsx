import { Calendar, CalendarDays, ListTodo, Home, LogOut, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const publicItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Holidays", url: "/holidays", icon: Calendar },
];

const authItems = [
  { title: "Events", url: "/events", icon: CalendarDays },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
];

export function AppSidebar() {
  const { isAuthenticated, username, logout } = useAuth();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg gradient-accent flex items-center justify-center">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg text-sidebar-foreground">पात्रो</h1>
            <p className="text-[10px] md:text-xs text-sidebar-foreground/70">Academic Planner</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 md:px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] md:text-xs tracking-wider mb-1 md:mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {publicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10 md:h-11">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    >
                      <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-sm">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAuthenticated && (
          <SidebarGroup className="mt-2 md:mt-4">
            <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase text-[10px] md:text-xs tracking-wider mb-1 md:mb-2">
              Manage
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {authItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10 md:h-11">
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      >
                        <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-sm">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 md:p-4 border-t border-sidebar-border">
        {isAuthenticated ? (
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center gap-2 md:gap-3 px-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-sidebar-foreground" />
              </div>
              <span className="text-xs md:text-sm font-medium text-sidebar-foreground truncate">{username}</span>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent h-9 md:h-10 text-sm"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <NavLink to="/auth">
            <Button className="w-full gradient-accent text-secondary-foreground font-medium hover:opacity-90 h-9 md:h-10 text-sm">
              Sign In
            </Button>
          </NavLink>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
