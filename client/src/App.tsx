import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Analysis from "@/pages/Analysis";
import Search from "@/pages/Search";
import { Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface AuthStatus {
  authenticated: boolean;
  hasCredentials?: boolean;
  userEmail?: string;
  userName?: string;
  userPicture?: string;
  isPro?: boolean;
}

function AppContent() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: auth, isLoading, refetch } = useQuery<AuthStatus>({
    queryKey: ["/api/auth/status"],
    refetchInterval: false,
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    queryClient.clear();
    refetch();
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center animate-pulse">
            <Mail className="w-5 h-5 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Cargando FixMail...</p>
        </div>
      </div>
    );
  }

  if (!auth?.authenticated) {
    return <Login auth={auth} onAuthSuccess={() => refetch()} />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar auth={auth} onLogout={handleLogout} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm text-foreground">FixMail</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Salir
            </Button>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/analysis" component={Analysis} />
              <Route path="/search" component={Search} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
