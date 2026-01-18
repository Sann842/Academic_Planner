import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center px-3 md:px-4 sticky top-0 z-10">
            <SidebarTrigger className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <span className="ml-3 font-semibold text-lg md:hidden">पात्रो</span>
          </header>
          <div className="flex-1 p-3 md:p-6 nepali-pattern">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
