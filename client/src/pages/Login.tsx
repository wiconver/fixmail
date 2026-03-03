import { Mail, Shield, Zap, Trash2, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { AuthStatus } from "@/App";

interface LoginProps {
  auth?: AuthStatus;
  onAuthSuccess: () => void;
}

const steps = [
  {
    num: "1",
    title: "Ir a Google Cloud Console",
    desc: "Abre la consola de Google Cloud y crea o selecciona un proyecto.",
    link: "https://console.cloud.google.com/apis/credentials",
    linkText: "Abrir Console",
  },
  {
    num: "2",
    title: "Crear credenciales OAuth 2.0",
    desc: 'Haz clic en "Crear credenciales" → "ID de cliente OAuth 2.0" → elige "Aplicación web".',
  },
  {
    num: "3",
    title: "Agregar URI de redirección",
    desc: "En URIs de redireccionamiento autorizados, agrega la URL de tu Repl:",
    code: `${window.location.origin}/api/auth/callback`,
  },
  {
    num: "4",
    title: "Habilitar Gmail API",
    desc: "Activa la Gmail API para tu proyecto.",
    link: "https://console.cloud.google.com/apis/library/gmail.googleapis.com",
    linkText: "Habilitar Gmail API",
  },
  {
    num: "5",
    title: "Guardar credenciales",
    desc: "Copia el Client ID y Client Secret y guárdalos como secrets en Replit: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
  },
];

const features = [
  { icon: Zap, label: "Análisis IA", desc: "GPT clasifica tus correos automáticamente" },
  { icon: Trash2, label: "Borrado masivo", desc: "Elimina cientos de correos en segundos" },
  { icon: Shield, label: "Seguro", desc: "OAuth2 oficial de Google, sin contraseñas" },
];

export default function Login({ auth }: LoginProps) {
  const hasCredentials = auth?.hasCredentials ?? false;

  const { data: authUrl } = useQuery<{ url: string }>({
    queryKey: ["/api/auth/url"],
    enabled: hasCredentials,
    retry: false,
  });

  const handleConnect = () => {
    if (authUrl?.url) {
      window.location.href = authUrl.url;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-2">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">FixMail</h1>
          <p className="text-muted-foreground text-lg">Limpia tu Gmail con Inteligencia Artificial</p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm">
                <f.icon className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {hasCredentials ? (
          /* Connect card */
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-chart-2 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Credenciales configuradas</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Conecta tu cuenta de Gmail</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Haz clic para autorizar el acceso seguro a tu Gmail mediante OAuth2 de Google.
              </p>
              <Button
                size="lg"
                className="w-full max-w-xs mx-auto"
                onClick={handleConnect}
                data-testid="button-connect-gmail"
              >
                <Mail className="w-4 h-4 mr-2" />
                Conectar con Gmail
              </Button>
              <p className="text-xs text-muted-foreground">
                FixMail solo accede a tu bandeja de entrada. Nunca almacenamos tus correos.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Setup instructions */
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Configuración requerida</Badge>
              </div>
              <h2 className="text-lg font-semibold text-foreground mt-1">
                Configura las credenciales de Google OAuth
              </h2>
              <p className="text-sm text-muted-foreground">
                Para usar FixMail necesitas crear credenciales de Google OAuth. Sigue estos pasos:
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step.num}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                    {step.code && (
                      <code className="block text-xs bg-muted px-2 py-1 rounded-md break-all font-mono text-foreground">
                        {step.code}
                      </code>
                    )}
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary font-medium"
                        data-testid={`link-step-${step.num}`}
                      >
                        {step.linkText}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              <div className="border-t pt-3 mt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Scopes necesarios:</strong>{" "}
                  <code className="bg-muted px-1 rounded text-xs">https://mail.google.com/</code>,{" "}
                  <code className="bg-muted px-1 rounded text-xs">userinfo.email</code>,{" "}
                  <code className="bg-muted px-1 rounded text-xs">userinfo.profile</code>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Una vez guardados los secrets <code className="bg-muted px-1 rounded">GOOGLE_CLIENT_ID</code> y{" "}
                  <code className="bg-muted px-1 rounded">GOOGLE_CLIENT_SECRET</code>, recarga esta página.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Gratis: 50 acciones/mes · Pro ilimitado con código FIXPRO
        </p>
      </div>
    </div>
  );
}
