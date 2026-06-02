# context.md — GPU Compare Project
# Always paste this file at the START of every AI assistant conversation.

---

## Project Name
**GPU Compare** — Live GPU Pricing, Free Compute Tracker & ML Training Tutorials

---

## What This Project Is
A web platform that:
- Aggregates real-time GPU cloud pricing across 10+ paid providers
- Tracks free compute options (Kaggle, Colab, Lightning AI, HuggingFace Spaces)
- Publishes step-by-step ML training tutorials with screenshots
- Earns revenue through affiliate commissions from GPU providers
- Exposes a public REST API (doubles as MCP server for Claude/ChatGPT later)

---

## Business Model
| Revenue Stream       | Source                              | Priority  |
|----------------------|-------------------------------------|-----------|
| Affiliate commission | RunPod, Vast.ai, DigitalOcean       | PRIMARY   |
| Amazon Associates    | ML books, accessories               | SECONDARY |
| API data access      | B2B developers, hedge funds         | LATER     |
| AdSense              | Background passive                  | LOW       |

---

## Tech Stack
| Layer      | Tool                        | Why                              |
|------------|-----------------------------|----------------------------------|
| Frontend   | Next.js 14 (App Router)     | SEO, free, React-based           |
| Styling    | Tailwind CSS                | Fast, utility-first              |
| Database   | Supabase (PostgreSQL)       | Free tier, real-time capable     |
| Scraper    | Python 3 + requests         | Simple, lightweight              |
| Scheduler  | GitHub Actions              | Free 2000 mins/month             |
| Hosting    | Vercel                      | Free tier, perfect for Next.js   |
| Repo       | GitHub                      | Hosts code + Actions             |

**Total monthly cost: $0**

---

## Folder Structure
```
gpu-compare/
├── app/
│   ├── page.tsx                    # Homepage — comparison table
│   ├── layout.tsx                  # Root layout with nav/footer
│   ├── globals.css                 # Global styles
│   ├── api/
│   │   └── gpus/
│   │       └── route.ts            # REST API (also MCP endpoint later)
│   ├── tutorials/
│   │   ├── page.tsx                # Tutorial listing page
│   │   └── [slug]/
│   │       └── page.tsx            # Individual tutorial page
│   └── free-compute/
│       └── page.tsx                # Free tier comparison page
├── components/
│   ├── GPUTable.tsx                # Main paid GPU comparison table
│   ├── FilterBar.tsx               # Filter/sort controls
│   ├── FreeTierTable.tsx           # Free platforms table
│   ├── ProviderBadge.tsx           # Small colored badge per provider
│   └── AffiliateLink.tsx           # Wrapper for all affiliate links
├── lib/
│   ├── supabase.ts                 # Supabase client
│   └── affiliates.ts               # ALL affiliate links in one place
├── content/
│   └── tutorials/                  # Markdown tutorial files (.mdx)
│       ├── how-to-train-on-kaggle.mdx
│       ├── runpod-beginner-guide.mdx
│       └── kaggle-vs-colab.mdx
├── scraper/
│   ├── main.py                     # Master scraper runner
│   ├── vastai.py                   # Vast.ai scraper
│   ├── runpod.py                   # RunPod scraper
│   ├── free_tiers.py               # Static free tier data updater
│   └── requirements.txt            # Python dependencies
├── public/
│   └── screenshots/                # Tutorial screenshots go here
├── .github/
│   └── workflows/
│       └── scraper.yml             # Runs scraper every hour automatically
├── .env.local                      # Local environment variables (never commit)
├── context.md                      # THIS FILE
└── prompts.md                      # AI prompts for each build phase
```

---

## Database Schema (Supabase)

### Table: `gpu_listings` (paid providers)
```sql
create table gpu_listings (
  id              uuid default gen_random_uuid() primary key,
  provider        text not null,          -- e.g. "Vast.ai", "RunPod"
  gpu_model       text not null,          -- e.g. "H100 SXM", "RTX 4090"
  vram_gb         integer,                -- e.g. 80
  price_per_hour  decimal(10,4),          -- e.g. 1.93
  listing_type    text,                   -- "on-demand" | "spot" | "reserved"
  is_available    boolean default true,
  region          text,                   -- e.g. "US-East", "EU"
  link            text,                   -- affiliate link
  updated_at      timestamp default now()
);
```

### Table: `free_tiers` (free platforms)
```sql
create table free_tiers (
  id              uuid default gen_random_uuid() primary key,
  platform        text not null,          -- e.g. "Kaggle", "Google Colab"
  gpu_model       text,                   -- e.g. "T4", "P100"
  weekly_hours    integer,                -- e.g. 30
  vram_gb         integer,
  notes           text,                   -- e.g. "Requires phone verification"
  signup_link     text,
  updated_at      timestamp default now()
);
```

---

## API Endpoints

### `GET /api/gpus`
Returns live GPU listings from Supabase.

**Query params:**
- `?gpu=H100` — filter by GPU model
- `?provider=RunPod` — filter by provider
- `?type=spot` — filter by listing type
- `?sort=price` — sort by price (default: ascending)

**Response:**
```json
[
  {
    "provider": "Vast.ai",
    "gpu_model": "H100 SXM",
    "vram_gb": 80,
    "price_per_hour": 1.93,
    "listing_type": "spot",
    "link": "https://vast.ai/?ref=YOURREF",
    "updated_at": "2026-06-01T10:00:00Z"
  }
]
```

This same endpoint becomes the MCP server later. No extra work needed.

---

## Affiliate Links (Single Source of Truth)
All affiliate links live ONLY in `lib/affiliates.ts`. Never hardcode links elsewhere.

```typescript
export const AFFILIATES = {
  runpod:       "https://runpod.io/?ref=YOURREF",
  vastai:       "https://vast.ai/?ref=YOURREF",
  digitalocean: "https://digitalocean.com/?ref=YOURREF",
  lambda:       "https://lambdalabs.com/?ref=YOURREF",
  tensordock:   "https://tensordock.com/?ref=YOURREF",
}
```

**Why:** Affiliate programs change terms. One file = one fix everywhere.

---

## Affiliate Programs to Join
| Provider     | Where to Apply               | Commission         | Apply When        |
|--------------|------------------------------|--------------------|-------------------|
| RunPod       | runpod.io/affiliates         | $10–15/signup      | Site has content  |
| Vast.ai      | vast.ai/affiliates           | 5% of user spend   | Site has content  |
| DigitalOcean | digitalocean.com/referral    | $25/signup         | Instant approval  |
| Amazon       | affiliate-program.amazon.in  | 3–5% per purchase  | Instant approval  |
| Lambda Labs  | lambdalabs.com (footer)      | Varies             | Site has content  |

**Order:** Apply Amazon + DigitalOcean first (instant). Others after site is live.

---

## Free Tier Data (Static — update manually)
| Platform          | GPU     | Weekly Hours | VRAM  | Notes                    |
|-------------------|---------|--------------|-------|--------------------------|
| Kaggle            | P100    | 30 hrs       | 16GB  | Phone verification needed|
| Google Colab Free | T4      | 15–30 hrs    | 16GB  | Session disconnects       |
| Lightning AI      | T4      | 22 hrs       | 16GB  | Requires account          |
| HuggingFace Spaces| CPU/T4  | Limited      | Varies| Good for demos only       |

---

## Scraper Architecture

```
GitHub Actions (cron: every hour)
        ↓
main.py runs all scrapers
        ↓
vastai.py  ──→  hits api.vast.ai  ──→  saves to Supabase
runpod.py  ──→  hits runpod GraphQL ──→  saves to Supabase
        ↓
Next.js frontend reads from Supabase
        ↓
User sees live data
```

**Vast.ai API:** Public, no auth needed. `GET https://cloud.vast.ai/api/v0/bundles/`
**RunPod API:** GraphQL. `POST https://api.runpod.io/graphql`

---

## MCP Integration Plan (Phase 5)
After the API endpoint is live, wrap it as an MCP server:

```json
{
  "name": "gpu-compare",
  "description": "Find cheapest GPUs for ML training in real time",
  "tools": [
    {
      "name": "get_cheapest_gpu",
      "description": "Returns the cheapest available GPU by model",
      "inputSchema": {
        "type": "object",
        "properties": {
          "gpu_model": { "type": "string" },
          "max_price": { "type": "number" }
        }
      }
    }
  ]
}
```

The API route `app/api/gpus/route.ts` already handles this. MCP is just a config wrapper.

---

## Environment Variables

### `.env.local` (local development)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### GitHub Secrets (for scraper)
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key   ← use service role for scraper
```

### Vercel Environment Variables
Same as .env.local — add in Vercel dashboard under project settings.

---

## Build Phases & Status
```
Phase 1 — Foundation
[ ] Prerequisites verified (node, python, git versions)
[ ] GitHub repo created
[ ] Next.js 14 initialized
[ ] Tailwind configured
[ ] Supabase project created
[ ] Database tables created
[ ] Supabase connected to Next.js

Phase 2 — Scraper
[ ] vastai.py scraper working locally
[ ] runpod.py scraper working locally
[ ] main.py runs both
[ ] Data visible in Supabase dashboard
[ ] GitHub Actions scraper.yml configured
[ ] Scraper running automatically every hour

Phase 3 — Frontend
[ ] GPUTable.tsx component built
[ ] FilterBar.tsx component built
[ ] FreeTierTable.tsx component built
[ ] Homepage pulling live data
[ ] AffiliateLink.tsx wrapper built
[ ] affiliates.ts constants file created
[ ] Site deployed to Vercel

Phase 4 — Tutorials
[ ] MDX configured in Next.js
[ ] First tutorial written (Kaggle guide)
[ ] Second tutorial written (RunPod guide)
[ ] Third tutorial written (Kaggle vs Colab)
[ ] Tutorials page listing all guides
[ ] Affiliate links placed naturally in tutorials

Phase 5 — API & MCP
[ ] /api/gpus route live and tested
[ ] MCP config file created
[ ] MCP server tested with Claude
[ ] Submitted to MCP directory

Phase 6 — Monetization
[ ] Amazon Associates approved
[ ] DigitalOcean referral active
[ ] RunPod affiliate approved
[ ] Vast.ai affiliate approved
[ ] All links replaced with affiliate versions
```

---

## Key Rules for AI Assistant
1. Always read this file before doing anything
2. Never skip steps or jump ahead
3. Never hallucinate API endpoints — verify against official docs
4. Explain every terminal command before running it
5. After every step, list what could go wrong and how to fix it
6. All affiliate links must go through `lib/affiliates.ts` only
7. Never commit `.env.local` or any secrets
8. When in doubt, ask — don't assume
9. Keep components small and focused (one job per component)
10. Mark checklist items above as done after each completed phase
