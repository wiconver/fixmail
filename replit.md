# FixMail — Gmail Cleaner con IA

Aplicación web full-stack para limpiar Gmail con clasificación por Inteligencia Artificial (GPT). UI completamente en español.

## Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js (Node.js)
- **Base de datos**: PostgreSQL con Drizzle ORM
- **IA**: OpenAI GPT (vía integración Replit AI — no requiere API key propia)
- **Auth**: Google OAuth2 (opcional — modo demo activo sin credenciales)
- **Gráficos**: Recharts

## Arquitectura

```
client/src/
  pages/
    Dashboard.tsx   — Métricas, acciones rápidas, registro de acciones
    Analysis.tsx    — Clasificación IA de correos
    Search.tsx      — Búsqueda y borrado manual por filtros
    Login.tsx       — Pantalla de configuración OAuth (solo sin credenciales)
  components/
    app-sidebar.tsx — Navegación, usuario, contador freemium, código Pro
  lib/
    queryClient.ts  — TanStack Query + fetcher
    apiError.ts     — Parser de errores de API

server/
  routes.ts         — Todas las rutas API (auth, emails, IA, freemium, logs)
  mock-emails.ts    — 30 correos de demo + operaciones en memoria
  storage.ts        — Interfaz PostgreSQL (freemium_usage, action_logs)
  index.ts          — Punto de entrada Express

shared/
  schema.ts         — Esquema Drizzle + tipos compartidos
```

## Modo Demo

La app detecta automáticamente si faltan `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` y activa modo demo:
- Auto-autenticación como `demo@fixmail.app` / "Usuario Demo"
- 30 correos de ejemplo (Amazon, Netflix, GitHub, LinkedIn, Spotify, etc.)
- Análisis IA con OpenAI real sobre datos mock
- Borrado actualiza estado en memoria
- Badge "Demo" en sidebar + banner en Dashboard

## Rutas API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/auth/status` | Estado de sesión |
| GET | `/api/auth/url` | URL de OAuth de Google |
| GET | `/api/auth/callback` | Callback OAuth |
| POST | `/api/auth/logout` | Cerrar sesión |
| POST | `/api/auth/promo` | Activar código Pro |
| GET | `/api/freemium/usage` | Contador de acciones |
| GET | `/api/logs` | Historial de acciones |
| GET | `/api/emails/stats` | Estadísticas por categoría |
| GET | `/api/emails/search` | Buscar correos |
| POST | `/api/emails/analyze` | Análisis IA de bandeja |
| POST | `/api/emails/delete-bulk` | Borrado en lote por IDs |
| POST | `/api/emails/delete-promotions-today` | Borrar Promotions del día |
| POST | `/api/emails/delete-by-sender` | Borrar por remitente |
| POST | `/api/emails/empty-trash` | Vaciar papelera |

## Freemium

- **Gratis**: 50 acciones/mes (contadas en PostgreSQL por email + mes)
- **Pro**: código `FIXPRO` → acciones ilimitadas en sesión actual

## Secrets necesarios

| Secret | Requerido | Descripción |
|--------|-----------|-------------|
| `SESSION_SECRET` | Sí | Secreto para sesiones Express |
| `DATABASE_URL` | Sí | PostgreSQL (auto-configurado por Replit) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Sí | Auto-configurado por integración Replit IA |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Sí | Auto-configurado por integración Replit IA |
| `GOOGLE_CLIENT_ID` | No (activa demo sin él) | OAuth Google Cloud |
| `GOOGLE_CLIENT_SECRET` | No (activa demo sin él) | OAuth Google Cloud |

## Comandos

```bash
npm run dev      # Desarrollo (Express + Vite en puerto 5000)
npm run db:push  # Sincronizar esquema con PostgreSQL
npm run build    # Build de producción
```
