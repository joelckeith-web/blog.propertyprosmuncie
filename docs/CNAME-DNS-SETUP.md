# CNAME / DNS Setup Guide — Blog Subdomain

**Purpose:** Configure the `blog.` subdomain to point to the Vercel-hosted blog so that SEO authority from the subdomain transfers to the main domain.

---

## Why a Subdomain?

Using `blog.clientsite.com` instead of a separate domain:

- **SEO benefit:** Search engines associate subdomains with the parent domain, transferring authority and trust signals
- **AEO benefit:** Answer Engine Optimization relies on domain authority — a subdomain inherits the parent domain's reputation
- **Brand consistency:** Visitors stay within the same domain family
- **SSL:** Vercel auto-provisions SSL certificates for custom domains

---

## Step-by-Step Setup

### Step 1: Get the Vercel DNS Target

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Domains**
3. Click **Add Domain**
4. Enter: `blog.clientsite.com`
5. Vercel will show you the required DNS record, typically:
   - **Type:** CNAME
   - **Value:** `cname.vercel-dns.com`

### Step 2: Add DNS Record at Client's Provider

Below are instructions for common DNS providers. In all cases, you're adding a CNAME record.

---

#### GoDaddy

1. Log in to GoDaddy → **My Products** → click **DNS** next to the domain
2. Click **Add Record**
3. Fill in:
   - **Type:** CNAME
   - **Name:** `blog`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 600 seconds (or 1 Hour)
4. Click **Save**

#### Cloudflare

1. Log in to Cloudflare → select the domain
2. Go to **DNS → Records**
3. Click **Add Record**
4. Fill in:
   - **Type:** CNAME
   - **Name:** `blog`
   - **Target:** `cname.vercel-dns.com`
   - **Proxy status:** **DNS only** (gray cloud) — important! Vercel handles SSL.
5. Click **Save**

**Cloudflare note:** If you want to use Cloudflare's proxy (orange cloud), you'll need to configure SSL settings to "Full (strict)" and may need additional configuration in Vercel.

#### Namecheap

1. Log in to Namecheap → **Domain List** → click **Manage** → **Advanced DNS**
2. Click **Add New Record**
3. Fill in:
   - **Type:** CNAME Record
   - **Host:** `blog`
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** Automatic
4. Click the checkmark to save

#### Google Domains / Squarespace Domains

1. Go to https://domains.google.com (now Squarespace Domains)
2. Select the domain → **DNS** → **Custom Records**
3. Click **Manage Custom Records**
4. Add:
   - **Host name:** `blog`
   - **Type:** CNAME
   - **TTL:** 3600
   - **Data:** `cname.vercel-dns.com`
5. Save

#### AWS Route 53

1. Go to Route 53 → **Hosted Zones** → select the domain
2. Click **Create Record**
3. Fill in:
   - **Record name:** `blog`
   - **Record type:** CNAME
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 300
4. Click **Create records**

---

### Step 3: Verify in Vercel

1. Go back to Vercel → **Settings → Domains**
2. The `blog.clientsite.com` entry should show a green checkmark after DNS propagation
3. If it shows a warning, wait 5-30 minutes for DNS propagation
4. Vercel will automatically provision an SSL certificate

### Step 4: Verify It Works

```bash
# Check DNS propagation
dig blog.clientsite.com CNAME

# Should return something like:
# blog.clientsite.com. 300 IN CNAME cname.vercel-dns.com.

# Test the site
curl -I https://blog.clientsite.com
# Should return HTTP/2 200
```

You can also use https://dnschecker.org to verify global DNS propagation.

### Step 5: SSL Verification

1. Visit `https://blog.clientsite.com` in a browser
2. Click the padlock icon → verify the SSL certificate is valid
3. Vercel auto-renews SSL certificates, so no manual renewal is needed

---

## SEO Configuration After DNS Setup

### Google Search Console

1. Go to https://search.google.com/search-console
2. Add property: `blog.clientsite.com` (URL prefix method)
3. Verify via DNS TXT record or HTML meta tag
4. Submit the sitemap: `https://blog.clientsite.com/sitemap.xml`

### Link from Main Site

For maximum SEO transfer, add a link from the main site to the blog:

- Add "Blog" to the main site's navigation menu linking to `https://blog.clientsite.com`
- Add a blog link in the footer of the main site
- This creates a clear topical relationship between the main domain and subdomain

### Cross-Linking Strategy

- Blog posts should link back to the main site's service pages (this is already built into the AI content generation prompts)
- Main site service pages can link to relevant blog posts
- This bidirectional linking strengthens both domains

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| DNS not propagating | Wait up to 48 hours (usually 5-30 min). Use https://dnschecker.org to check. |
| SSL certificate error | Ensure Cloudflare proxy is OFF (gray cloud) if using Cloudflare. Otherwise, wait for Vercel to provision. |
| "Domain not configured" in Vercel | Verify the CNAME record points exactly to `cname.vercel-dns.com` (no trailing dot in some providers). |
| Redirect loop | Check if the DNS provider is forcing HTTPS redirect — Vercel handles this already. |
| Subdomain shows different site | Clear browser cache. Verify CNAME doesn't point to old hosting. |

---

## DNS Record Summary

For quick reference, the only record needed:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `blog` | `cname.vercel-dns.com` | 300 |

That's it. Vercel handles everything else (SSL, routing, CDN).
