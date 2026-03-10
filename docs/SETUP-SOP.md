# Weather-Triggered Blog System — Setup SOP

**Version:** 2.0
**Last Updated:** March 2026
**Purpose:** Step-by-step instructions for deploying this automated blog system for a new client.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Vercel Deployment](#4-vercel-deployment)
5. [DNS / Subdomain Setup](#5-dns--subdomain-setup)
6. [Google Indexing API Setup](#6-google-indexing-api-setup)
7. [Client Customization Checklist](#7-client-customization-checklist)
8. [Testing the Pipeline](#8-testing-the-pipeline)
9. [Scheduling & Automation](#9-scheduling--automation)
10. [Ongoing Maintenance](#10-ongoing-maintenance)

---

## 1. Prerequisites

Before you begin, ensure you have the following:

- **GitHub account** with ability to create repos and generate Personal Access Tokens
- **Vercel Pro account** (required for Cron Jobs)
- **Anthropic API key** — sign up at https://console.anthropic.com
- **Access to client's DNS provider** (GoDaddy, Cloudflare, Namecheap, etc.)
- **Cursor IDE** with Claude Code CLI (for development and pushing)
- **Client website audit complete** — you need:
  - Brand colors (hex codes)
  - Service page URLs (verified from sitemap)
  - Contact info (phone, address, hours)
  - Social media links
  - Service areas list
  - Google Business Profile CID (for Entity Bridge)
  - BBB profile URL
  - Facebook page URL

---

## 2. Repository Setup

### 2.1 Clone or Fork the Template

```bash
# Option A: Clone the template
git clone https://github.com/YOUR_ORG/property-pros-blog.git client-name-blog
cd client-name-blog
rm -rf .git
git init

# Option B: Use GitHub template feature (if configured)
# Click "Use this template" on the GitHub repo page
```

### 2.2 Create GitHub Repository

```bash
# Create new repo on GitHub (main branch only — NO dev branch needed)
gh repo create client-name-blog --private --source=. --push
```

### 2.3 Generate GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: `client-name-blog-automation`
4. Scopes: check `repo` (full control of private repos)
5. Generate and **copy the token immediately** — you won't see it again
6. Save it securely for the Vercel environment setup

---

## 3. Environment Configuration

### 3.1 Get API Keys

#### Anthropic API Key
1. Go to https://console.anthropic.com
2. Create a new API key
3. Name it: `client-name-blog`
4. Copy the key (starts with `sk-ant-`)

#### Cron Secret
Generate a random secret for Vercel cron authorization:
```bash
openssl rand -hex 32
```

### 3.2 Create `.env.local`

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:
| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `GITHUB_TOKEN` | GitHub PAT with repo scope | `ghp_...` |
| `GITHUB_OWNER` | GitHub username or org | `joelckeith-web` |
| `GITHUB_REPO` | Repository name | `blog.propertyprosmuncie` |
| `GITHUB_BRANCH` | Target branch (use `main`) | `main` |
| `NEXT_PUBLIC_SITE_URL` | Blog subdomain URL | `https://blog.propertyprosmuncie.com` |
| `NEXT_PUBLIC_MAIN_SITE_URL` | Client's main site | `https://www.propertyprosmuncie.com` |
| `CRON_SECRET` | Random secret for cron auth | (generated above) |

Optional (for Google Indexing API):
| Variable | Description |
|----------|-------------|
| `GOOGLE_INDEXING_CLIENT_EMAIL` | Service account email |
| `GOOGLE_INDEXING_PRIVATE_KEY` | Service account private key (PEM) |

---

## 4. Vercel Deployment

### 4.1 Import Project

1. Go to https://vercel.com/new
2. Import the GitHub repository
3. Framework Preset: **Next.js**
4. Build Command: `next build` (default)
5. Output Directory: leave default

### 4.2 Configure Environment Variables

In Vercel project settings → Environment Variables, add ALL variables from `.env.local`.

**Important:** Set variables for **Production**, **Preview**, and **Development** environments.

### 4.3 Configure Cron

The `vercel.json` file already contains the cron schedule:
```json
{
  "crons": [{
    "path": "/api/cron/generate-blog",
    "schedule": "0 22 * * 0"
  }]
}
```

This runs every Sunday at 10:00 PM UTC (5:00 PM ET). Adjust the schedule as needed for the client's timezone.

**Cron schedule reference:**
- `0 22 * * 0` = Sunday 5:00 PM ET (10 PM UTC)
- `0 14 * * 0` = Sunday 10:00 AM ET (2 PM UTC)
- `0 22 * * 3` = Wednesday 5:00 PM ET

### 4.4 Configure Custom Domain

1. In Vercel project → Settings → Domains
2. Add: `blog.clientsite.com`
3. Vercel will provide DNS records (see Section 5)

### 4.5 Set Git Branch for Production

1. In Vercel project → Settings → Git
2. Production Branch: `main`
3. All blog posts push directly to `main` → Vercel auto-deploys

---

## 5. DNS / Subdomain Setup

See the detailed guide: [CNAME-DNS-SETUP.md](./CNAME-DNS-SETUP.md)

**Quick version:**

1. In client's DNS provider, add a CNAME record:
   - **Name:** `blog`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 300 (or Auto)

2. In Vercel, add the domain `blog.clientsite.com`
3. Vercel will auto-provision an SSL certificate
4. Verify: visit `https://blog.clientsite.com` — should load the blog

---

## 6. Google Indexing API Setup (Optional)

Enables automatic index pinging after each blog post is published. Posts get indexed within minutes instead of days.

### 6.1 Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project: `client-name-blog-indexing`
3. Enable the **Indexing API**: APIs & Services → Library → Search "Indexing API" → Enable

### 6.2 Create Service Account

1. APIs & Services → Credentials → Create Credentials → Service Account
2. Name: `blog-indexing`
3. Role: None needed (Indexing API uses Search Console verification)
4. Create a key: JSON format → Download

### 6.3 Add to Search Console

1. Go to Google Search Console for the blog domain
2. Settings → Users and permissions → Add user
3. Enter the service account email (e.g., `blog-indexing@project.iam.gserviceaccount.com`)
4. Permission: **Owner**

### 6.4 Configure Environment Variables

Add to `.env.local` and Vercel:
```
GOOGLE_INDEXING_CLIENT_EMAIL=blog-indexing@project.iam.gserviceaccount.com
GOOGLE_INDEXING_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Note:** If not configured, the system simply skips the indexing ping — it's non-blocking.

---

## 7. Client Customization Checklist

For each new client, update these files:

### 7.1 `lib/site-config.ts` — Critical
- [ ] Company name and legal name
- [ ] Main website URL
- [ ] Blog URL (subdomain)
- [ ] Phone number(s)
- [ ] Address (street, city, state, zip)
- [ ] Business hours
- [ ] Tagline and description
- [ ] **sameAs URLs** (Google Maps CID, Facebook, BBB, LinkedIn)
- [ ] **Neighborhoods** array for geo-anchor footer
- [ ] Service areas list
- [ ] All service page URLs (verify from sitemap!)
- [ ] All service subpage URLs
- [ ] Key page URLs (about, contact, gallery, testimonials)
- [ ] Social media links
- [ ] Weather-to-service mapping (adjust services per client)

### 7.2 `lib/weather.ts` — Location
- [ ] Update latitude/longitude for client's city
- [ ] Update NWS station ID (find at https://www.weather.gov/wrh/stationlookup)
- [ ] Update NWS User-Agent email
- [ ] Tip: Find coords at https://www.latlong.net

### 7.3 `tailwind.config.ts` — Brand Colors
- [ ] Primary brand color (replace `brand.orange`)
- [ ] Hover state color
- [ ] Light variant (for backgrounds)
- [ ] Dark color (headings, nav)
- [ ] Dark secondary
- [ ] Text color
- [ ] Font family (if client uses custom fonts)

### 7.4 `styles/globals.css` — Accent Styles
- [ ] Key takeaway border color
- [ ] AI Summary Box styling
- [ ] Link colors
- [ ] Blockquote border color
- [ ] Button colors

### 7.5 `components/Header.tsx` — Navigation
- [ ] Logo (replace PP placeholder with client logo)
- [ ] Navigation links to match client site
- [ ] Services dropdown items

### 7.6 `components/Footer.tsx` — Footer
- [ ] Company info matches client
- [ ] Service list matches
- [ ] Service areas match

### 7.7 `lib/content-generator.ts` — AI Prompts
- [ ] System prompt references correct company name
- [ ] External authority sources are relevant to client's industry
- [ ] Category enum matches client's services
- [ ] CTA uses correct phone number
- [ ] Geo-footer links use correct neighborhoods

### 7.8 `vercel.json` — Schedule
- [ ] Cron schedule appropriate for client's timezone

---

## 8. Testing the Pipeline

### 8.1 Local Test (No API Keys Needed for Weather)

```bash
# Install dependencies
npm install

# Test weather context build
npx tsx -e "
import { buildWeatherContext } from './lib/weather';
buildWeatherContext().then(ctx => {
  console.log('Mode:', ctx.mode);
  console.log('Week:', ctx.weekLabel);
  console.log('Hazard:', ctx.dominantHazard);
  console.log('Services:', ctx.affectedServices);
  console.log('Historical:', ctx.historicalSummary);
});
"
```

### 8.2 Full Local Test (Requires Anthropic API Key)

```bash
# Generate a blog post locally
npm run generate

# Check the output
ls content/posts/
cat content/posts/*.md | head -60
```

### 8.3 Test GitHub Push

```bash
# Generate and push directly to main
npm run generate:push

# Verify on GitHub — Vercel will auto-deploy
```

### 8.4 Test Cron Endpoint

After deploying to Vercel:
```bash
# Hit the cron endpoint manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://blog.clientsite.com/api/cron/generate-blog
```

### 8.5 End-to-End Verification

1. Trigger cron → blog auto-published to `main` branch
2. Vercel auto-deploys → blog post appears on live site
3. Google Indexing API pinged (if configured)
4. Check JSON-LD schemas with Google's Rich Results Test
5. Verify the "Immediate Action Summary" box renders correctly
6. Verify the Service Area Geo-Link Footer renders
7. Verify sitemap at `blog.clientsite.com/sitemap.xml`
8. Check the `sameAs` array in LocalBusiness schema

---

## 9. Scheduling & Automation

### How It Works (No Human-in-the-Loop)

The system is fully automated:

1. **Vercel Cron** fires every Sunday at 5:00 PM ET
2. **NWS API** is queried for historical (48h) + 7-day forecast data
3. **Weather Mode** is classified: `pre-event`, `post-event`, or `combined`
4. **Claude API** generates a mode-specific blog post
5. **GitHub API** pushes the markdown file directly to `main` branch
6. **Vercel** auto-deploys from `main` within ~60 seconds
7. **Google Indexing API** (optional) pings Google for immediate crawl

### Adjusting the Schedule

Edit `vercel.json` to change the cron schedule:
```json
{
  "crons": [{
    "path": "/api/cron/generate-blog",
    "schedule": "0 22 * * 0"
  }]
}
```

Common schedules:
- `0 22 * * 0` — Sunday 5PM ET (weekly, recommended)
- `0 22 * * 0,3` — Sunday + Wednesday 5PM ET (twice weekly)
- `0 14 * * 1` — Monday 10AM ET

### Manual Generation

You can also trigger generation manually at any time:

```bash
# Generate locally to review first
npm run generate

# Generate and push directly to main (auto-deploys)
npm run generate:push
```

### Connections Required

| Service | Purpose | Required? |
|---------|---------|-----------|
| NWS API | Weather data | Yes (free, no key) |
| Anthropic API | Blog generation | Yes |
| GitHub API | Push commits | Yes |
| Vercel | Hosting + Cron | Yes (Pro plan) |
| Google Indexing API | Fast indexing | Optional |

---

## 10. Ongoing Maintenance

### Automated Weekly Workflow
1. **Sunday 5 PM ET:** Cron fires → weather fetched → blog generated → pushed to main → deployed → indexed
2. **No human intervention needed** — system runs fully autonomously

### Monthly Tasks
- Review blog analytics (Google Search Console, GA4)
- Verify all internal links still work
- Check that weather API is returning data correctly
- Review generated content quality — adjust AI prompts if needed
- Verify `sameAs` URLs are still valid

### Quarterly Tasks
- Update service page URLs if client's site changes
- Review and update external authority sources
- Check for Next.js / dependency updates
- Review SEO performance and adjust keyword targeting
- Update neighborhood list if service area expands

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Cron not firing | Check Vercel dashboard → Cron Jobs tab. Verify `CRON_SECRET` matches. |
| Weather API error | NWS API occasionally has outages. Check https://api.weather.gov status. The cron will retry next week. |
| Blog content too short | Adjust word count range in `content-generator.ts` system prompt. |
| GitHub push fails | Verify `GITHUB_TOKEN` hasn't expired. Regenerate if needed. |
| Build fails on Vercel | Check build logs. Common issues: missing env vars, TypeScript errors in generated content. |
| SEO schemas not showing | Test with https://search.google.com/test/rich-results — check for JSON-LD errors. |
| Indexing API not working | Verify service account is added as Owner in Search Console. Check env vars. |
| Wrong weather mode | Check `determineWeatherMode()` thresholds in `lib/weather.ts`. |
