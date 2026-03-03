import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search as SearchIcon, Trash2, Mail, FileText } from "lucide-react";
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

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  sizeEstimate: number;
  labelIds: string[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getCategory(labelIds: string[]): string {
  if (labelIds.includes("CATEGORY_PROMOTIONS")) return "Promotions";
  if (labelIds.includes("CATEGORY_SOCIAL")) return "Social";
  if (labelIds.includes("CATEGORY_UPDATES")) return "Updates";
  if (labelIds.includes("CATEGORY_FORUMS")) return "Forums";
  return "Primary";
}

export default function Search() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (after) params.set("after", after);
    if (before) params.set("before", before);
    const qs = params.toString();
    return `/api/emails/search${qs ? `?${qs}` : ""}`;
  };

  const [searchUrl, setSearchUrl] = useState("/api/emails/search");

  const { data: emails = [], isLoading, refetch } = useQuery<Email[]>({
    queryKey: [searchUrl],
    enabled: searched,
  });

  const deleteMut = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", "/api/emails/delete-bulk", { ids }),
    onSuccess: async (res) => {
      const data = await res.json();
      toast({ title: `${data.deleted} correos eliminados` });
      qc.invalidateQueries({ queryKey: [searchUrl] });
      qc.invalidateQueries({ queryKey: ["/api/emails/stats"] });
      qc.invalidateQueries({ queryKey: ["/api/freemium/usage"] });
      qc.invalidateQueries({ queryKey: ["/api/logs"] });
      setSelected(new Set());
    },
    onError: async () => {
      toast({ title: "Error al eliminar correos", variant: "destructive" });
    },
  });

  const handleSearch = () => {
    const url = buildSearchUrl();
    setSearchUrl(url);
    setSearched(true);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === emails.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(emails.map((e) => e.id)));
    }
  };

  const allSelected = emails.length > 0 && selected.size === emails.length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Buscar & Eliminar</h1>
        <p className="text-muted-foreground text-sm mt-1">Busca correos por texto o rango de fechas y elimínalos</p>
      </div>

      {/* Search form */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" htmlFor="search-query">Buscar en asunto, remitente o contenido</Label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search-query"
                className="pl-9"
                placeholder="ej: newsletter, amazon, from:noreply@..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                data-testid="input-search-query"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" htmlFor="search-after">Desde (fecha)</Label>
              <Input
                id="search-after"
                type="date"
                value={after}
                onChange={(e) => setAfter(e.target.value)}
                data-testid="input-search-after"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium" htmlFor="search-before">Hasta (fecha)</Label>
              <Input
                id="search-before"
                type="date"
                value={before}
                onChange={(e) => setBefore(e.target.value)}
                data-testid="input-search-before"
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full sm:w-auto" data-testid="button-search">
            <SearchIcon className="w-4 h-4 mr-2" />
            {isLoading ? "Buscando..." : "Buscar correos"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">
                {isLoading ? "Buscando..." : `${emails.length} resultado${emails.length !== 1 ? "s" : ""}`}
              </CardTitle>
              {emails.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    data-testid="button-select-all"
                  >
                    {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                  </Button>
                  {selected.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowConfirm(true)}
                      disabled={deleteMut.isPending}
                      data-testid="button-delete-selected-search"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Borrar {selected.size}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <Mail className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No se encontraron correos</p>
              </div>
            ) : (
              <div className="divide-y">
                {emails.map((email) => {
                  const isSelected = selected.has(email.id);
                  const category = getCategory(email.labelIds);

                  return (
                    <div
                      key={email.id}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                      data-testid={`search-email-${email.id}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(email.id)}
                        className="mt-1 shrink-0"
                        data-testid={`checkbox-search-${email.id}`}
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {email.subject || "(sin asunto)"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{email.from}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="text-xs">{category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {email.date ? (() => {
                                try { return format(new Date(email.date), "d MMM", { locale: es }); } catch { return email.date.slice(0, 11); }
                              })() : ""}
                            </span>
                          </div>
                        </div>

                        {email.snippet && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{email.snippet}</p>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="w-3 h-3" />
                            {formatBytes(email.sizeEstimate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
            <SearchIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">Usa los filtros para buscar</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Puedes buscar por texto, remitente o rango de fechas y luego seleccionar correos para eliminar.
          </p>
        </div>
      )}

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar permanentemente {selected.size} correo{selected.size !== 1 ? "s" : ""}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-search-cancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMut.mutate(Array.from(selected));
                setShowConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-search-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
