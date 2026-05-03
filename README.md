# FutureFam Content Engine

WhatsApp post generator + review queue for the FutureFam community.

## Stack
- **Next.js 14** (App Router)
- **Supabase** — Postgres database
- **Anthropic Claude** — content generation

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env.local`
```bash
cp .env.local.example .env.local
```
Fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — from your Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase > Settings > API
- `ANTHROPIC_API_KEY` — from console.anthropic.com

### 3. Set up Supabase table
Run `supabase_migration.sql` in your Supabase SQL editor.

### 4. Run dev server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Enter a topic → generate a WhatsApp post via Claude |
| `/review` | View all posts, approve or reject them |

## API

### `POST /api/generate`
```json
{ "topic": "Morning motivation for parents" }
```
Returns the saved post with `pending` status.
