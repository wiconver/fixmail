import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Sparkles, Trash2, AlertTriangle, CheckCircle, Mail, Tag, BookOpen, Gift, ShieldX
} from "lucide-react";
import { parseApiError } from "@/lib/apiError";
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

interface AnalyzedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  categoria: string;
  razon: string;
  score_borrar: number;
}

const CATEGORIA_CONFIG: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  suggestion: string;
}> = {
  IMPORTANTE: {
    label: "Importante",
    color: "text-chart-2",
    bg: "bg-chart-2/10",
    icon: CheckCircle,
    suggestion: "No borrar",
  },
  SUSCRIPCION_ACTIVA: {
    label: "Suscripción activa",
    color: "text-primary",
    bg: "bg-primary/10",
    icon: Mail,
    suggestion: "Mantener",
  },
  NEWSLETTER_INACTIVA: {
    label: "Newsletter inactiva",
    color: "text-chart-3",
    bg: "bg-chart-3/10",
    icon: BookOpen,
    suggestion: "Considera borrar",
  },
  PROMOCION_UTIL: {
    label: "Promoción útil",
    color: "text-chart-4",
    bg: "bg-chart-4/10",
    icon: Gift,
    suggestion: "Revisar antes",
  },
  PROMOCION_SPAM: {
    label: "Spam/Promoción",
    color: "text-destructive",
    bg: "bg-destructive/10",
    icon: ShieldX,
    suggestion: "Borrar",
  },
};

const ScoreBar = ({ score }: { score: number }) => {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "bg-destructive" : score >= 4 ? "bg-chart-3" : "bg-chart-2";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-6 text-right">{score}/10</span>
    </div>
  );
};

export default function Analysis() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [results, setResults] = useState<AnalyzedEmail[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");

  const analyzeMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/emails/analyze", {}),
    onSuccess: async (res) => {
      const data = await res.json();
      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
        return;
      }
      setResults(data);
      setSelected(new Set());
      toast({ title: `${data.length} correos analizados`, description: "Selecciona los que quieres eliminar" });
    },
    onError: (err: unknown) => {
      toast({ title: parseApiError(err), variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", "/api/emails/delete-bulk", { ids }),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: `${data.deleted} correos eliminados` });
      setResults((prev) => prev.filter((e) => !selected.has(e.id)));
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/freemium/usage"] });
      qc.invalidateQueries({ queryKey: ["/api/logs"] });
    },
    onError: (err: unknown) => {
      toast({ title: parseApiError(err), variant: "destructive" });
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const autoSelectSpam = () => {
    const spamIds = filteredResults
      .filter((e) => e.categoria === "PROMOCION_SPAM" || e.score_borrar >= 7)
      .map((e) => e.id);
    setSelected(new Set(spamIds));
  };

  const filteredResults = filterCat === "all"
    ? results
    : results.filter((e) => e.categoria === filterCat);

  const cats = ["all", ...Array.from(new Set(results.map((r) => r.categoria)))];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Análisis IA</h1>
        <p className="text-muted-foreground text-sm mt-1">
          GPT-4o-mini clasifica tus correos y sugiere qué borrar
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">Analizar inbox con IA</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analiza hasta 50 correos recientes y los clasifica automáticamente. Cuenta como 1 acción.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => analyzeMut.mutate()}
              disabled={analyzeMut.isPending}
              className="shrink-0"
              data-testid="button-analyze-inbox"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {analyzeMut.isPending ? "Analizando..." : "Analizar inbox con IA"}
            </Button>
          </div>

          {analyzeMut.isPending && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">Consultando Gmail y procesando con IA...</p>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <>
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2 items-center">
            {cats.map((cat) => {
              const config = cat === "all" ? null : CATEGORIA_CONFIG[cat];
              const count = cat === "all" ? results.length : results.filter((r) => r.categoria === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filterCat === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                  data-testid={`filter-${cat}`}
                >
                  {cat === "all" ? `Todos (${count})` : `${config?.label || cat} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={autoSelectSpam} data-testid="button-auto-select-spam">
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-destructive" />
                Seleccionar spam automático
              </Button>
              {selected.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  disabled={deleteMut.isPending}
                  data-testid="button-delete-selected"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Borrar {selected.size} seleccionados
                </Button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{filteredResults.length} correos</span>
          </div>

          {/* Email cards */}
          <div className="space-y-2">
            {filteredResults.map((email) => {
              const config = CATEGORIA_CONFIG[email.categoria] || {
                label: email.categoria,
                color: "text-muted-foreground",
                bg: "bg-muted",
                icon: Tag,
                suggestion: "",
              };
              const Icon = config.icon;
              const isSelected = selected.has(email.id);

              return (
                <Card
                  key={email.id}
                  className={`shadow-sm transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
                  data-testid={`email-card-${email.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(email.id)}
                        className="mt-1 shrink-0"
                        data-testid={`checkbox-email-${email.id}`}
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start gap-2 justify-between flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{email.subject || "(sin asunto)"}</p>
                            <p className="text-xs text-muted-foreground truncate">{email.from}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </span>
                          </div>
                        </div>

                        {email.snippet && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{email.snippet}</p>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Score de borrado</p>
                            <ScoreBar score={email.score_borrar} />
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-muted-foreground">
                              {email.date ? (() => {
                                try { return format(new Date(email.date), "d MMM", { locale: es }); } catch { return email.date; }
                              })() : ""}
                            </p>
                          </div>
                        </div>

                        {email.razon && (
                          <p className="text-xs text-muted-foreground italic">{email.razon}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {results.length === 0 && !analyzeMut.isPending && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">Sin análisis todavía</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Haz clic en "Analizar inbox con IA" para clasificar tus correos automáticamente.
          </p>
        </div>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar permanentemente {selected.size} correo{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-analysis-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMut.mutate(Array.from(selected));
                setShowConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-analysis-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
