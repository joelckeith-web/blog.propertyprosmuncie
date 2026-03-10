# Property Pros Muncie — Weather-Triggered Blog

Automated blog content generation system for [Property Pros Muncie](https://www.propertyprosmuncie.com). Generates SEO-optimized blog posts based on real local weather data, connecting weather conditions to relevant home improvement services.

## How It Works

1. **Every Sunday at 5 PM ET**, a Vercel Cron job triggers the pipeline
2. **Historical weather** (past 48 hours) and **7-day forecast** are fetched from the NWS API
3. **Weather mode** is classified as `pre-event`, `post-event`, or `combined`
4. **Claude AI** generates a 1,500–2,200 word mode-specific blog post
5. **The post** is pushed directly to `main` on GitHub — no human review needed
6. **Vercel auto-deploys** within ~60 seconds
7. **Google Indexing API** pings Google for fast crawling (optional)

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** with @tailwindcss/typography
- **Anthropic Claude API** for content generation
- **NWS API** for weather data (free, no key needed)
- **GitHub API** for automated commits to `main`
- **Vercel** for hosting and cron jobs (Pro plan)
- **Google Indexing API** for instant index pinging (optional)

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in API keys in .env.local

npm run dev          # Start dev server
npm run generate     # Generate a blog post locally
npm run generate:push # Generate and push to main branch
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── [slug]/page.tsx     # Individual blog post page
│   ├── api/cron/           # Vercel cron endpoint
│   ├── layout.tsx          # Root layout (header + footer)
│   ├── page.tsx            # Blog index page
│   ├── sitemap.ts          # Auto-generated sitemap
│   └── robots.ts           # Robots.txt config
├── components/             # React components
│   ├── Header.tsx          # Site header matching parent site
│   ├── Footer.tsx          # Site footer matching parent site
│   ├── BlogCard.tsx        # Blog post preview card
│   ├── SchemaMarkup.tsx    # JSON-LD structured data (Article, FAQ, LocalBusiness)
│   ├── AISummaryBox.tsx    # Styled summary callout (AEO optimization)
│   └── ServiceAreaFooter.tsx # Hyper-local geo-anchor links
├── content/posts/          # Markdown blog posts (auto-published)
├── docs/                   # Setup documentation
│   ├── SETUP-SOP.md        # Full deployment SOP
│   └── CNAME-DNS-SETUP.md  # Subdomain DNS guide
├── lib/                    # Core libraries
│   ├── blog.ts             # Blog post reading/parsing
│   ├── content-generator.ts # AI content generation (mode-aware)
│   ├── github.ts           # GitHub API (push to main)
│   ├── google-indexing.ts  # Google Indexing API integration
│   ├── site-config.ts      # Site config (sameAs, neighborhoods, services)
│   ├── types.ts            # TypeScript interfaces
│   └── weather.ts          # NWS weather API (historical + forecast)
├── scripts/
│   └── generate-blog.ts    # Manual generation script
├── styles/globals.css      # Tailwind + custom styles
└── vercel.json             # Cron schedule config
```

## Documentation

- [Setup SOP](./docs/SETUP-SOP.md) — Full deployment instructions for new clients
- [CNAME/DNS Guide](./docs/CNAME-DNS-SETUP.md) — Subdomain configuration guide

## Workflow

```
Cron (Sunday 5PM ET)
        ↓
NWS API → Historical (48h) + 7-day Forecast
        ↓
Weather Mode Classification (pre/post/combined)
        ↓
Claude AI → Mode-specific Blog Post
        ↓
GitHub Push → main branch
        ↓
Vercel Auto-Deploy (~60s)
        ↓
Google Indexing API Ping (optional)
```

## SEO Features

- **Entity Bridge** — `sameAs` array in LocalBusiness schema linking blog to Google Maps, Facebook, BBB
- **AI Summary Box** — 75-100 word direct-answer callout optimized for AI Overviews
- **Service Area Geo-Footer** — Hyper-local anchor text for neighborhood-level signals
- **Automated Indexing** — Google Indexing API for minutes-not-days crawling
- **Full Schema Markup** — Article, FAQPage, LocalBusiness, BreadcrumbList JSON-LD
