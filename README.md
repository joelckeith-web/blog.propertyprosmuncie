# Property Pros Muncie — Weather-Triggered Blog

Automated blog content generation system for [Property Pros Muncie](https://www.propertyprosmuncie.com). Generates SEO-optimized blog posts based on real local weather data, connecting weather conditions to relevant home improvement services.

## How It Works

1. **Every Sunday at 5 PM ET**, a Vercel Cron job triggers the pipeline
2. **Weather data** is fetched from the National Weather Service API for Muncie, IN
3. **Claude AI** generates a 1,500–2,200 word blog post following the ASP Branding SOP
4. **The draft** is pushed to the `dev` branch on GitHub
5. **A human reviews** the draft and merges to `main`
6. **Vercel auto-deploys** the updated blog

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** with @tailwindcss/typography
- **Anthropic Claude API** for content generation
- **NWS API** for weather data (free, no key needed)
- **GitHub API** for automated commits
- **Vercel** for hosting and cron jobs

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in API keys in .env.local

npm run dev          # Start dev server
npm run generate     # Generate a blog post locally
npm run generate:push # Generate and push to dev branch
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
│   └── SchemaMarkup.tsx    # JSON-LD structured data
├── content/posts/          # Markdown blog posts
│   ├── drafts/             # AI-generated drafts
│   └── published/          # Approved and published posts
├── docs/                   # Setup documentation
│   ├── SETUP-SOP.md        # Full deployment SOP
│   └── CNAME-DNS-SETUP.md  # Subdomain DNS guide
├── lib/                    # Core libraries
│   ├── blog.ts             # Blog post reading/parsing
│   ├── content-generator.ts # AI content generation
│   ├── github.ts           # GitHub API integration
│   ├── site-config.ts      # Verified site configuration
│   ├── types.ts            # TypeScript interfaces
│   └── weather.ts          # NWS weather API
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
Cron (Sunday 5PM) → Weather API → Claude AI → GitHub dev branch
                                                    ↓
                                            Human reviews draft
                                                    ↓
                                            Merge dev → main
                                                    ↓
                                          Vercel auto-deploys
```
