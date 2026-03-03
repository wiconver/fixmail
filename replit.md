# FixMail – Limpiador inteligente de Gmail con IA

## Overview
FixMail is a full-stack web application that helps users clean their Gmail inbox using AI (GPT) classification. Built with React + TypeScript frontend and Express.js backend.

## Features
- **Google OAuth2 authentication** – Secure Gmail access via authorization code flow
- **Dashboard** – Email category chart (Recharts pie chart), metrics, quick actions
- **AI Analysis** – GPT-5-mini classifies emails into: IMPORTANTE, SUSCRIPCION_ACTIVA, NEWSLETTER_INACTIVA, PROMOCION_UTIL, PROMOCION_SPAM with score 0–10
- **Quick actions** – Delete all Promotions from today, delete by sender, empty trash
- **Search & Delete** – Search emails by text/date range, select and bulk delete
- **Freemium model** – 50 actions/month (stored in PostgreSQL), Pro unlock with code FIXPRO
- **Action logs** – All deletion/analysis actions timestamped in database

## Architecture

### Frontend (`client/src/`)
- `App.tsx` – Auth check, routing, sidebar layout
- `pages/Login.tsx` – Login page + setup instructions for Google OAuth
- `pages/Dashboard.tsx` – Main dashboard with chart, metrics, quick actions, logs
- `pages/Analysis.tsx` – AI analysis with category filtering and email selection
- `pages/Search.tsx` – Email search by text/date with bulk delete
- `components/app-sidebar.tsx` – Sidebar with user info, freemium counter, navigation

### Backend (`server/`)
- `routes.ts` – All API routes (auth, emails, AI analysis, freemium)
- `storage.ts` – PostgreSQL storage for freemium usage and action logs
- `db.ts` – Drizzle ORM database connection

### Shared (`shared/`)
- `schema.ts` – Drizzle schema: users, freemium_usage, action_logs

## Required Secrets
Users must configure these secrets in Replit:

| Secret | Value |
|--------|-------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `SESSION_SECRET` | Any random string (auto-configured) |

OpenAI is provided via Replit AI Integrations (no user API key needed).

## Google OAuth Setup
1. Go to https://console.cloud.google.com/apis/credentials
2. Create "Web application" OAuth client
3. Add authorized redirect URI: `https://<your-repl>.replit.app/api/auth/callback`
4. Enable Gmail API at https://console.cloud.google.com/apis/library/gmail.googleapis.com
5. Required scopes: `https://mail.google.com/`, `userinfo.email`, `userinfo.profile`

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Query, Wouter
- **Backend**: Express.js, Node.js, googleapis
- **Database**: PostgreSQL (Drizzle ORM)
- **AI**: OpenAI GPT-5-mini via Replit AI Integrations
- **Auth**: Google OAuth2 + express-session

## Note on Google Integration
The Replit Gmail integration was dismissed by the user. The app instead uses direct Google OAuth2 credentials stored as secrets (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET). Do not attempt to re-add the Replit Gmail connector.
