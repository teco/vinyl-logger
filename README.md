# Vinyl Logger

Personal OS tool — photograph a record cover, Claude identifies it, it logs to Notion.

## Stack

- Next.js 15 (App Router)
- Vercel (hosting)
- Anthropic API (cover identification, server-side)
- Notion API (database write, server-side)

## Deploy

### 1. Push to GitHub

Create a new repo on github.com, then:

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/YOUR_USERNAME/vinyl-logger.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to vercel.com → New Project → Import from GitHub
2. Select the `vinyl-logger` repo
3. Click Deploy (default settings work)

### 3. Set environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from console.anthropic.com |
| `NOTION_TOKEN` | Your integration token from notion.so/my-integrations |
| `NEXT_PUBLIC_APP_PASSWORD` | A password of your choice |

Redeploy after setting variables (Vercel → Deployments → Redeploy).

### 4. Notion integration setup

The Notion token must belong to an integration that has access to the Records database:
1. Go to notion.so/my-integrations → New integration → copy the token
2. Open the Records database in Notion → ··· → Connections → add your integration

### 5. Bookmark on mobile

Open the Vercel URL on your phone → Share → Add to Home Screen.

## Environment variables reference

- `ANTHROPIC_API_KEY` — server-side only, never exposed to browser
- `NOTION_TOKEN` — server-side only, never exposed to browser  
- `NEXT_PUBLIC_APP_PASSWORD` — exposed to browser (used for client-side gate check); this is a soft lock, not cryptographic auth
