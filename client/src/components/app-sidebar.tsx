import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Sparkles, Search, LogOut, Shield, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { AuthStatus } from "@/App";

interface FreemiumUsage {
  used: number;
  limit: number;
  remaining: number;
  isPro: boolean;
}

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Análisis IA", url: "/analysis", icon: Sparkles },
  { title: "Buscar & Eliminar", url: "/search", icon: Search },
];

interface AppSidebarProps {
  auth: AuthStatus;
  onLogout: () => void;
}

export function AppSidebar({ auth, onLogout }: AppSidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const [proCode, setProCode] = useState("");
  const [showProInput, setShowProInput] = useState(false);

  const { data: usage, refetch: refetchUsage } = useQuery<FreemiumUsage>({
    queryKey: ["/api/freemium/usage"],
    refetchInterval: 30000,
  });

  const handleProCode = async () => {
    try {
      const res = await apiRequest("POST", "/api/auth/promo", { code: proCode });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Pro activado", description: "Acciones ilimitadas este mes." });
        queryClient.invalidateQueries({ queryKey: ["/api/freemium/usage"] });
        setShowProInput(false);
        setProCode("");
      } else {
        toast({ title: "Código inválido", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error al activar código", variant: "destructive" });
    }
  };

  const used = usage?.used || 0;
  const limit = usage?.limit || 50;
  const remaining = usage?.remaining ?? (limit - used);
  const isPro = usage?.isPro || auth.isPro || false;
  const usagePercent = Math.min(100, Math.round((used / limit) * 100));
  const isLow = remaining <= 10 && !isPro;

  const initials = auth.userName
    ? auth.userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : (auth.userEmail?.[0] || "U").toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm text-sidebar-foreground leading-tight">FixMail</p>
            <p className="text-xs text-muted-foreground">Limpiador de Gmail</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Cuenta</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-2 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={auth.userPicture} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-username">
                    {auth.userName || auth.userEmail}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{auth.userEmail}</p>
                </div>
              </div>

              {isPro ? (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent">
                  <Shield className="w-3.5 h-3.5 text-chart-2 shrink-0" />
                  <span className="text-xs font-medium text-accent-foreground">Pro activo – ilimitado</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Acciones este mes</span>
                    <span className={`text-xs font-semibold ${isLow ? "text-destructive" : "text-sidebar-foreground"}`} data-testid="text-actions-remaining">
                      {remaining}/{limit}
                    </span>
                  </div>
                  <Progress value={usagePercent} className="h-1.5" />
                  {isLow && (
                    <p className="text-xs text-destructive">Pocas acciones restantes</p>
                  )}
                  {!showProInput ? (
                    <button
                      onClick={() => setShowProInput(true)}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Tengo código Pro
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Input
                        value={proCode}
                        onChange={(e) => setProCode(e.target.value)}
                        placeholder="Código Pro"
                        className="h-7 text-xs"
                        data-testid="input-pro-code"
                        onKeyDown={(e) => e.key === "Enter" && handleProCode()}
                      />
                      <Button size="sm" onClick={handleProCode} className="h-7 text-xs px-2" data-testid="button-activate-pro">
                        OK
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onLogout}
          data-testid="button-sidebar-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
