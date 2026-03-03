import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Trash2, RotateCcw, Mail, Star, Tag, Users, Bell, MessageSquare,
  ChevronDown, ChevronUp, Clock
} from "lucide-react";
import { parseApiError } from "@/lib/apiError";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmailStats {
  categories: { label: string; count: number }[];
  totalMessages: number;
  storageUsed: number;
  promotionsToday: number;
}

interface ActionLog {
  id: number;
  userEmail: string;
  actionType: string;
  description: string;
  createdAt: string;
}

const CATEGORY_COLORS = {
  Primary: "#4285F4",
  Promotions: "#EA4335",
  Social: "#34A853",
  Updates: "#FBBC05",
  Forums: "#8AB4F8",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Primary: Mail,
  Promotions: Tag,
  Social: Users,
  Updates: Bell,
  Forums: MessageSquare,
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-card-border rounded-md px-3 py-2 shadow-sm">
        <p className="text-sm font-medium text-card-foreground">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">{payload[0].value.toLocaleString()} correos</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [senderInput, setSenderInput] = useState("");
  const [confirmType, setConfirmType] = useState<"promotions" | "sender" | "trash" | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const { data: auth } = useQuery<{ isDemo?: boolean }>({
    queryKey: ["/api/auth/status"],
  });
  const isDemoMode = auth?.isDemo;

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<EmailStats>({
    queryKey: ["/api/emails/stats"],
  });

  const { data: logs } = useQuery<ActionLog[]>({
    queryKey: ["/api/logs"],
  });

  const deletePromotionsMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/emails/delete-promotions-today", {}),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: `${data.deleted} Promotions eliminadas`, description: "de hoy" });
      qc.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/freemium/usage"] });
      qc.invalidateQueries({ queryKey: ["/api/logs"] });
    },
    onError: (err: unknown) => {
      toast({ title: parseApiError(err), variant: "destructive" });
    },
  });

  const deleteBySenderMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/emails/delete-by-sender", { sender: senderInput }),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: `${data.deleted} correos eliminados`, description: `de ${senderInput}` });
      setSenderInput("");
      qc.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/freemium/usage"] });
      qc.invalidateQueries({ queryKey: ["/api/logs"] });
    },
    onError: (err: unknown) => {
      toast({ title: parseApiError(err), variant: "destructive" });
    },
  });

  const emptyTrashMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/emails/empty-trash", {}),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: "Papelera vaciada", description: `${data.deleted} correos eliminados` });
      qc.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/freemium/usage"] });
      qc.invalidateQueries({ queryKey: ["/api/logs"] });
    },
    onError: (err: unknown) => {
      toast({ title: parseApiError(err), variant: "destructive" });
    },
  });

  const handleConfirm = () => {
    if (confirmType === "promotions") deletePromotionsMut.mutate();
    else if (confirmType === "sender") deleteBySenderMut.mutate();
    else if (confirmType === "trash") emptyTrashMut.mutate();
    setConfirmType(null);
  };

  const isMutating = deletePromotionsMut.isPending || deleteBySenderMut.isPending || emptyTrashMut.isPending;

  const chartData = stats?.categories.map((c) => ({
    name: c.label,
    value: c.count,
    color: CATEGORY_COLORS[c.label as keyof typeof CATEGORY_COLORS] || "#94a3b8",
  })) || [];

  const MetricCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
    <Card className="shadow-sm" data-testid={`card-metric-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20" }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">FixMail – Limpia tu Gmail con IA</h1>
        <p className="text-muted-foreground text-sm mt-1">Vista general de tu bandeja de entrada</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard label="Total correos" value={stats?.totalMessages || 0} icon={Mail} color="#4285F4" />
            <MetricCard label="Promotions hoy" value={stats?.promotionsToday || 0} icon={Tag} color="#EA4335" />
            <MetricCard label="Categorías activas" value={stats?.categories.filter(c => c.count > 0).length || 0} icon={Star} color="#34A853" />
            <MetricCard label="Social" value={stats?.categories.find(c => c.label === "Social")?.count || 0} icon={Users} color="#FBBC05" />
          </>
        )}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Correos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={() => setConfirmType("promotions")}
              disabled={isMutating}
              data-testid="button-delete-promotions-today"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Borrar TODAS las Promotions de HOY
            </Button>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Borrar por remitente</p>
              <div className="flex gap-2">
                <Input
                  placeholder="ej: amazon.com, newsletter@empresa.com"
                  value={senderInput}
                  onChange={(e) => setSenderInput(e.target.value)}
                  className="flex-1"
                  data-testid="input-sender-filter"
                  onKeyDown={(e) => e.key === "Enter" && senderInput && setConfirmType("sender")}
                />
                <Button
                  variant="secondary"
                  onClick={() => senderInput && setConfirmType("sender")}
                  disabled={!senderInput || isMutating}
                  data-testid="button-delete-by-sender"
                >
                  Borrar
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setConfirmType("trash")}
              disabled={isMutating}
              data-testid="button-empty-trash"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Vaciar papelera ahora
            </Button>

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada acción cuenta como 1 uso en el plan gratuito. Para análisis IA ve a la sección "Análisis IA".
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Desglose por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {statsLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
              : stats?.categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.label] || Mail;
                  const color = CATEGORY_COLORS[cat.label as keyof typeof CATEGORY_COLORS] || "#94a3b8";
                  return (
                    <div
                      key={cat.label}
                      className="flex flex-col gap-1.5 p-3 rounded-lg bg-accent/50"
                      data-testid={`card-category-${cat.label.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                        <span className="text-xs font-medium text-foreground truncate">{cat.label}</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">{cat.count.toLocaleString()}</span>
                    </div>
                  );
                })}
          </div>
        </CardContent>
      </Card>

      {/* Action Logs */}
      <Card className="shadow-sm">
        <button
          className="w-full flex items-center justify-between p-4 text-left"
          onClick={() => setShowLogs(!showLogs)}
          data-testid="button-toggle-logs"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Registro de acciones</span>
            {logs && logs.length > 0 && (
              <Badge variant="secondary" className="text-xs">{logs.length}</Badge>
            )}
          </div>
          {showLogs ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showLogs && (
          <div className="border-t">
            {!logs || logs.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No hay acciones registradas aún
              </div>
            ) : (
              <div className="divide-y max-h-64 overflow-y-auto">
                {[...logs].reverse().map((log) => (
                  <div key={log.id} className="px-4 py-3 flex items-start gap-3" data-testid={`log-item-${log.id}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{log.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(log.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={confirmType !== null} onOpenChange={() => setConfirmType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmType === "promotions" &&
                "Vas a eliminar PERMANENTEMENTE todas las Promotions de hoy. Esta acción no se puede deshacer."}
              {confirmType === "sender" &&
                `Vas a eliminar PERMANENTEMENTE todos los correos de "${senderInput}". Esta acción no se puede deshacer.`}
              {confirmType === "trash" &&
                "Vas a vaciar PERMANENTEMENTE la papelera. Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-confirm-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
