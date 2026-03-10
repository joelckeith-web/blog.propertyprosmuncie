# Weather-Triggered Blog System — Setup SOP

**Version:** 1.0
**Last Updated:** March 2026
**Purpose:** Step-by-step instructions for deploying this automated blog system for a new client.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Vercel Deployment](#4-vercel-deployment)
5. [DNS / Subdomain Setup](#5-dns--subdomain-setup)
6. [Client Customization Checklist](#6-client-customization-checklist)
7. [Testing the Pipeline](#7-testing-the-pipeline)
8. [Ongoing Maintenance](#8-ongoing-maintenance)

---

## 1. Prerequisites

Before you begin, ensure you have the following:

- **GitHub account** with ability to create repos and generate Personal Access Tokens
- **Vercel Pro account** (required for Cron Jobs)
- **Anthropic API key** — sign up at https://console.anthropic.com
- **Access to client's DNS provider** (GoDaddy, Cloudflare, Namecheap, etc.)
- **Client website audit complete** — you need:
  - Brand colors (hex codes)
  - Service page URLs (verified from sitemap)
  - Contact info (phone, address, hours)
  - Social media links
  - Service areas list

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
# Create new repo on GitHub
gh repo create client-name-blog --private --source=. --push

# Create the dev branch
git checkout -b dev
git push -u origin dev
git checkout main
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
| `GITHUB_OWNER` | GitHub username or org | `your-org` |
| `GITHUB_REPO` | Repository name | `client-name-blog` |
| `GITHUB_BRANCH` | Draft branch name | `dev` |
| `NEXT_PUBLIC_SITE_URL` | Blog subdomain URL | `https://blog.clientsite.com` |
| `NEXT_PUBLIC_MAIN_SITE_URL` | Client's main site | `https://www.clientsite.com` |
| `CRON_SECRET` | Random secret for cron auth | (generated above) |

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
3. This ensures only merged (approved) content goes live

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

## 6. Client Customization Checklist

For each new client, update these files:

### 6.1 `lib/site-config.ts` — Critical
- [ ] Company name and legal name
- [ ] Main website URL
- [ ] Blog URL (subdomain)
- [ ] Phone number(s)
- [ ] Address (street, city, state, zip)
- [ ] Business hours
- [ ] Tagline and description
- [ ] Service areas list
- [ ] All service page URLs (verify from sitemap!)
- [ ] All service subpage URLs
- [ ] Key page URLs (about, contact, gallery, testimonials)
- [ ] Social media links
- [ ] Weather-to-service mapping (adjust services per client)

### 6.2 `lib/weather.ts` — Location
- [ ] Update latitude/longitude for client's city
- [ ] Update NWS User-Agent email
- [ ] Tip: Find coords at https://www.latlong.net

### 6.3 `tailwind.config.ts` — Brand Colors
- [ ] Primary brand color (replace `brand.orange`)
- [ ] Hover state color
- [ ] Light variant (for backgrounds)
- [ ] Dark color (headings, nav)
- [ ] Dark secondary
- [ ] Text color
- [ ] Font family (if client uses custom fonts)

### 6.4 `styles/globals.css` — Accent Styles
- [ ] Key takeaway border color
- [ ] Link colors
- [ ] Blockquote border color
- [ ] Button colors

### 6.5 `components/Header.tsx` — Navigation
- [ ] Logo (replace PP placeholder with client logo)
- [ ] Navigation links to match client site
- [ ] Services dropdown items

### 6.6 `components/Footer.tsx` — Footer
- [ ] Company info matches client
- [ ] Service list matches
- [ ] Service areas match

### 6.7 `lib/content-generator.ts` — AI Prompts
- [ ] System prompt references correct company name
- [ ] External authority sources are relevant to client's industry
- [ ] Category enum matches client's services
- [ ] CTA uses correct phone number

### 6.8 `vercel.json` — Schedule
- [ ] Cron schedule appropriate for client's timezone

---

## 7. Testing the Pipeline

### 7.1 Local Test (No API Keys Needed for Weather)

```bash
# Install dependencies
npm install

# Test weather fetch only
npx tsx -e "
import { fetchWeeklyForecast } from './lib/weather';
fetchWeeklyForecast().then(f => {
  console.log('Week:', f.weekRange);
  console.log('Condition:', f.summary.dominantCondition);
  console.log('Services:', f.summary.relevantServices);
});
"
```

### 7.2 Full Local Test (Requires Anthropic API Key)

```bash
# Generate a blog post locally
npm run generate

# Check the output
ls content/posts/drafts/
cat content/posts/drafts/*.md | head -50
```

### 7.3 Test GitHub Push

```bash
# Generate and push to dev branch
npm run generate:push

# Verify on GitHub
gh pr list  # or check the dev branch on github.com
```

### 7.4 Test Cron Endpoint

After deploying to Vercel:
```bash
# Hit the cron endpoint manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://blog.clientsite.com/api/cron/generate-blog
```

### 7.5 End-to-End Verification

1. Trigger cron → blog draft appears on `dev` branch
2. Review the draft on GitHub
3. Create a PR from `dev` → `main`
4. Merge the PR
5. Vercel auto-deploys → blog post appears on live site
6. Check JSON-LD schemas with Google's Rich Results Test
7. Verify sitemap at `blog.clientsite.com/sitemap.xml`

---

## 8. Ongoing Maintenance

### Weekly Workflow
1. **Sunday 5 PM:** Cron auto-generates blog draft → pushes to `dev`
2. **Monday morning:** Human reviews draft on GitHub
3. **If approved:** Merge `dev` → `main` → auto-deploys
4. **If needs edits:** Edit the markdown file on `dev`, then merge

### Monthly Tasks
- Review blog analytics (Google Search Console, GA4)
- Verify all internal links still work
- Check that weather API is returning data correctly
- Review generated content quality — adjust AI prompts if needed

### Quarterly Tasks
- Update service page URLs if client's site changes
- Review and update external authority sources
- Check for Next.js / dependency updates
- Review SEO performance and adjust keyword targeting

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Cron not firing | Check Vercel dashboard → Cron Jobs tab. Verify `CRON_SECRET` matches. |
| Weather API error | NWS API occasionally has outages. Check https://api.weather.gov status. The cron will retry next week. |
| Blog content too short | Adjust word count range in `content-generator.ts` system prompt. |
| GitHub push fails | Verify `GITHUB_TOKEN` hasn't expired. Regenerate if needed. |
| Build fails on Vercel | Check build logs. Common issues: missing env vars, TypeScript errors in generated content. |
| SEO schemas not showing | Test with https://search.google.com/test/rich-results — check for JSON-LD errors. |
