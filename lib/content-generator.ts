import Anthropic from "@anthropic-ai/sdk";
import type {
  WeatherContext,
  WeatherMode,
  BlogFrontmatter,
  GeneratedBlog,
  ServiceAreaLink,
} from "./types";
import { siteConfig } from "./site-config";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate a weather-triggered blog post from the full weather context.
 * Enforces ASP Branding Core Content Creation SOP requirements.
 *
 * Now supports three modes:
 * - pre-event:  Preparation-focused ("storms are coming, protect your home")
 * - post-event: Recovery-focused  ("storms hit, here's what to do now")
 * - combined:   Both past damage AND more weather incoming
 */
export async function generateBlogPost(
  context: WeatherContext
): Promise<GeneratedBlog> {
  const primaryService = context.affectedServices[0];

  // Build verified internal links + geo-anchor footer links
  const internalLinks = buildInternalLinksContext();
  const geoFooterLinks = buildGeoFooterLinks(primaryService);

  // Build mode-specific prompts
  const systemPrompt = buildSystemPrompt(context.mode);
  const userPrompt = buildUserPrompt(context, internalLinks, geoFooterLinks);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawContent =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse the structured response
  const parsed = parseGeneratedContent(rawContent, context, primaryService, geoFooterLinks);

  return parsed;
}

// ═══════════════════════════════════════════════════════════
//  SYSTEM PROMPT — mode-aware
// ═══════════════════════════════════════════════════════════

function buildSystemPrompt(mode: WeatherMode): string {
  const modeInstructions = getModeInstructions(mode);

  return `You are a professional SEO content writer for ${siteConfig.name}, a premier general contractor in ${siteConfig.address.city}, ${siteConfig.address.state}. You write weather-triggered blog posts that connect real local weather conditions to home maintenance and improvement services.

CONTENT MODE: ${mode.toUpperCase()}
${modeInstructions}

STRICT CONTENT RULES (ASP Branding Core Content Creation SOP):
1. Write exactly 1,500–2,200 words of verified, substantive content. No filler.
2. Include the primary keyword in the H1 title and within the first 100 words.
3. Introduce the business entity "${siteConfig.name}" in the first paragraph.
4. Include 4 or more internal links to verified service pages (provided below).
5. Include 2 or more external Tier 1 links — ONLY to .gov, .edu, or established industry authorities (e.g., NRCA.net for roofing, EPA.gov, Energy.gov, FEMA.gov).
6. Add "Key Takeaway" callout blocks after every 2–3 H2 sections.
7. Include 6 or more FAQ items at the end, structured for FAQPage schema.
8. Do NOT fabricate statistics, credentials, certifications, or customer stories.
9. Reference ${siteConfig.address.city}, ${siteConfig.address.state} and service areas by name.
10. Reference the ACTUAL weather data (historical and/or forecast) with specific dates.
11. Include a CTA paragraph at the end with phone number ${siteConfig.phone}.
12. Write in a professional but approachable tone — like a knowledgeable neighbor.

CRITICAL — IMMEDIATE ACTION SUMMARY BOX:
Your FIRST content after the intro paragraph MUST be a summary box block formatted EXACTLY like this:

> **Immediate Action Summary for Muncie Homeowners**
> [Write a 75–100 word summary that directly answers the implied search query. This text must be self-contained, factual, and parseable by AI Overview systems. Include the business name, city, specific weather condition, and recommended action. Do NOT use marketing fluff — write like a factual advisory.]

This summary box is critical for AI Overview / Answer Engine Optimization (AEO). It must appear within the first 2 scroll-lengths of the page.

OUTPUT FORMAT — respond with EXACTLY this structure (use the delimiters precisely):

===TITLE===
[SEO-optimized H1 title, 50-70 characters]
===META_TITLE===
[Title tag, 50-60 characters]
===META_DESCRIPTION===
[Meta description, 150-160 characters]
===CATEGORY===
[One of: roofing, fencing, siding, gutters, decks, remodeling, construction, general]
===TAGS===
[Comma-separated tags]
===FAQ_JSON===
[JSON array of {question, answer} objects — minimum 6 items]
===CONTENT===
[Full Markdown blog post content starting with intro paragraph, NOT the H1]`;
}

function getModeInstructions(mode: WeatherMode): string {
  switch (mode) {
    case "post-event":
      return `POST-EVENT MODE: Significant weather has ALREADY occurred in the past 48 hours.
- Lead with what happened: reference the actual historical weather data (precipitation totals, wind gusts, severe events).
- Focus on DAMAGE ASSESSMENT and RECOVERY — what should homeowners check NOW?
- Use urgency: "If you experienced [weather], your [roof/siding/gutters] may already be compromised."
- Frame Property Pros as the immediate solution — "Call today before damage worsens."
- Still reference the upcoming forecast if relevant weather continues.
- Post-event content typically converts higher because homeowners are actively searching for help.`;

    case "combined":
      return `COMBINED MODE: Significant weather ALREADY hit AND more is coming.
- Open by acknowledging recent damage: reference historical weather data.
- Pivot to urgency: "And there's more on the way this week."
- Structure: (1) What happened → (2) What to check now → (3) What's coming → (4) How to prepare.
- This is the highest-urgency content mode. Homeowners need immediate action AND preparation.
- Frame Property Pros as the urgent-response partner.`;

    case "pre-event":
    default:
      return `PRE-EVENT MODE: No significant recent weather, but the forecast shows conditions ahead.
- Focus on PREPARATION and PREVENTION.
- Reference specific forecast data: what's coming and when.
- Guide homeowners on what to inspect, repair, or reinforce BEFORE the weather arrives.
- Frame Property Pros as the proactive partner — "Don't wait until after the storm."
- Seasonal maintenance angles work well in this mode.`;
  }
}

// ═══════════════════════════════════════════════════════════
//  USER PROMPT — includes historical + forecast + geo links
// ═══════════════════════════════════════════════════════════

function buildUserPrompt(
  context: WeatherContext,
  internalLinks: string,
  geoFooterLinks: ServiceAreaLink[]
): string {
  const { mode, historical, forecast } = context;

  // Build forecast day-by-day details
  const forecastDetails = forecast.periods
    .filter((p) => p.isDaytime)
    .slice(0, 7)
    .map(
      (p) =>
        `${p.name}: ${p.temperature}°${p.temperatureUnit}, ${p.shortForecast}, Wind ${p.windSpeed} ${p.windDirection}`
    )
    .join("\n");

  const alertsText =
    forecast.alerts.length > 0
      ? forecast.alerts
          .map((a) => `⚠️ ${a.event}: ${a.headline}`)
          .join("\n")
      : "No active weather alerts.";

  // Build geo-footer instructions
  const geoFooterText = geoFooterLinks
    .map((link) => `- [${link.label}](${link.url})`)
    .join("\n");

  // Historical weather section (for post-event / combined modes)
  const historicalSection =
    mode === "pre-event"
      ? ""
      : `
HISTORICAL WEATHER (PAST 48 HOURS):
- Total precipitation: ${historical.totalPrecipitation} inches
- Peak wind gust: ${historical.peakWindGust} mph
- Severe weather occurred: ${historical.hadSevereWeather ? "YES" : "No"}
${historical.severeEvents.length > 0 ? `- Severe events: ${historical.severeEvents.join(", ")}` : ""}
- Summary: ${historical.summary}

⚠️ You MUST reference these historical weather facts in the opening paragraphs. This is real data.
`;

  return `Write a ${mode.toUpperCase()} weather-triggered blog post for the week of ${context.weekLabel}.

CONTENT MODE: ${mode}
${historicalSection}
7-DAY FORECAST FOR MUNCIE, IN:
${forecastDetails}

FORECAST SUMMARY:
- Dominant condition: ${forecast.summary.dominantCondition}
- Temperature range: ${forecast.summary.lowTemp}°F to ${forecast.summary.highTemp}°F
- Precipitation days: ${forecast.summary.precipitationDays}
- Storm risk: ${forecast.summary.stormRisk}
- Freeze risk: ${forecast.summary.freezeRisk}
- Hail risk: ${forecast.summary.hailRisk}
- High wind risk: ${forecast.summary.highWindRisk}
- Heavy rain risk: ${forecast.summary.heavyRainRisk}

DOMINANT HAZARD: ${context.dominantHazard}

ACTIVE ALERTS:
${alertsText}

WEATHER STORY:
${context.forecastSummary}

PRIMARY SERVICE FOCUS: ${context.affectedServices[0]}
SECONDARY SERVICES: ${context.affectedServices.slice(1).join(", ")}

VERIFIED INTERNAL LINKS (use 4+ of these — ONLY these URLs):
${internalLinks}

VERIFIED EXTERNAL AUTHORITY SOURCES (use 2+ from this type):
- NRCA (National Roofing Contractors Association): https://www.nrca.net
- FEMA: https://www.fema.gov
- EPA: https://www.epa.gov
- Energy.gov: https://www.energy.gov
- NOAA/Weather.gov: https://www.weather.gov
- Indiana DNR: https://www.in.gov/dnr/
- ICC (International Code Council): https://www.iccsafe.org

BUSINESS INFO:
- Name: ${siteConfig.name}
- Phone: ${siteConfig.phone}
- Address: ${siteConfig.address.street}, ${siteConfig.address.city}, ${siteConfig.address.state} ${siteConfig.address.zip}
- Service areas: ${siteConfig.serviceAreas.join(", ")}
- Contact page: ${siteConfig.pages.contact}

SERVICE AREA GEO-LINK FOOTER — Include this EXACTLY at the end of the post, before the FAQ section:

### Serving Muncie & Surrounding Communities
${geoFooterText}

Generate the blog post now following all SOP rules and the exact output format specified.`;
}

// ═══════════════════════════════════════════════════════════
//  GEO-ANCHOR FOOTER LINKS
// ═══════════════════════════════════════════════════════════

function buildGeoFooterLinks(primaryService: string): ServiceAreaLink[] {
  const serviceConfig =
    siteConfig.services[primaryService as keyof typeof siteConfig.services];
  const serviceLabel = serviceConfig?.label || "Home Services";
  const serviceUrl = serviceConfig?.url || siteConfig.pages.services;

  return siteConfig.neighborhoods.map((n) => ({
    label: `${serviceLabel} in ${n.city === "Muncie" ? `Muncie's ${n.name}` : n.name}`,
    url: serviceUrl,
  }));
}

// ═══════════════════════════════════════════════════════════
//  INTERNAL LINKS CONTEXT
// ═══════════════════════════════════════════════════════════

function buildInternalLinksContext(): string {
  const links: string[] = [];

  for (const [, service] of Object.entries(siteConfig.services)) {
    links.push(`- ${service.label}: ${service.url}`);
    for (const [subKey, subUrl] of Object.entries(service.subpages)) {
      links.push(`  - ${subKey}: ${subUrl}`);
    }
  }

  links.push(`- About Us: ${siteConfig.pages.about}`);
  links.push(`- Services Overview: ${siteConfig.pages.services}`);
  links.push(`- Gallery: ${siteConfig.pages.gallery}`);
  links.push(`- Testimonials: ${siteConfig.pages.testimonials}`);
  links.push(`- Contact Us: ${siteConfig.pages.contact}`);

  return links.join("\n");
}

// ═══════════════════════════════════════════════════════════
//  RESPONSE PARSER
// ═══════════════════════════════════════════════════════════

function parseGeneratedContent(
  raw: string,
  context: WeatherContext,
  primaryService: string,
  geoFooterLinks: ServiceAreaLink[]
): GeneratedBlog {
  const extract = (tag: string): string => {
    const regex = new RegExp(`===${tag}===\\s*([\\s\\S]*?)(?====\\w|$)`);
    const match = raw.match(regex);
    return (match?.[1] || "").trim();
  };

  const title = extract("TITLE");
  const metaTitle = extract("META_TITLE") || title.substring(0, 60);
  const metaDescription = extract("META_DESCRIPTION");
  const category = extract("CATEGORY") as BlogFrontmatter["category"];
  const tags = extract("TAGS")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let faqItems: { question: string; answer: string }[] = [];
  try {
    const faqRaw = extract("FAQ_JSON");
    faqItems = JSON.parse(faqRaw);
  } catch {
    faqItems = [];
  }

  const content = extract("CONTENT");

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  const frontmatter: BlogFrontmatter = {
    title,
    slug,
    publishDate: dateStr,
    author: siteConfig.name,
    category: category || (primaryService as BlogFrontmatter["category"]),
    tags,
    metaTitle: metaTitle.substring(0, 60),
    metaDescription: metaDescription.substring(0, 160),
    weatherTriggered: true,
    weatherMode: context.mode,
    weatherWeek: context.weekLabel,
    featuredImage: "",
    serviceAreaFooterLinks: geoFooterLinks.slice(0, 10), // Top 10 for frontmatter
    schema: {
      type: "Article",
      faqItems,
    },
    status: "published", // Direct to main — no draft stage
  };

  // Compose the full Markdown file
  const frontmatterYaml = composeFrontmatterYaml(frontmatter);
  const markdownContent = `${frontmatterYaml}\n\n${content}`;

  const fileName = `${dateStr}-${slug}.md`;
  const filePath = `content/posts/${fileName}`;

  return {
    frontmatter,
    markdownContent,
    filePath,
  };
}

function composeFrontmatterYaml(fm: BlogFrontmatter): string {
  const faqYaml = fm.schema.faqItems
    .map(
      (item) =>
        `    - question: "${escapeYaml(item.question)}"\n      answer: "${escapeYaml(item.answer)}"`
    )
    .join("\n");

  const geoLinksYaml = fm.serviceAreaFooterLinks
    .map(
      (link) =>
        `  - label: "${escapeYaml(link.label)}"\n    url: "${link.url}"`
    )
    .join("\n");

  return `---
title: "${escapeYaml(fm.title)}"
slug: "${fm.slug}"
publishDate: "${fm.publishDate}"
author: "${fm.author}"
category: "${fm.category}"
tags: [${fm.tags.map((t) => `"${escapeYaml(t)}"`).join(", ")}]
metaTitle: "${escapeYaml(fm.metaTitle)}"
metaDescription: "${escapeYaml(fm.metaDescription)}"
weatherTriggered: ${fm.weatherTriggered}
weatherMode: "${fm.weatherMode}"
weatherWeek: "${fm.weatherWeek}"
featuredImage: "${fm.featuredImage}"
serviceAreaFooterLinks:
${geoLinksYaml}
schema:
  type: "${fm.schema.type}"
  faqItems:
${faqYaml}
status: "${fm.status}"
---`;
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\n/g, " ");
}
