import Anthropic from "@anthropic-ai/sdk";
import type { WeeklyForecast, BlogFrontmatter, GeneratedBlog } from "./types";
import { siteConfig } from "./site-config";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate a weather-triggered blog post from the weekly forecast.
 * Enforces ASP Branding Core Content Creation SOP requirements.
 */
export async function generateBlogPost(
  forecast: WeeklyForecast
): Promise<GeneratedBlog> {
  const { summary } = forecast;
  const primaryService = summary.relevantServices[0];
  const serviceConfig =
    siteConfig.services[primaryService as keyof typeof siteConfig.services];

  // Build the list of verified internal links the AI can use
  const internalLinks = buildInternalLinksContext();

  // Build the prompt enforcing all SOP rules
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(forecast, internalLinks);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawContent =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse the structured response
  const parsed = parseGeneratedContent(rawContent, forecast, primaryService);

  return parsed;
}

function buildSystemPrompt(): string {
  return `You are a professional SEO content writer for ${siteConfig.name}, a premier general contractor in ${siteConfig.address.city}, ${siteConfig.address.state}. You write weather-triggered blog posts that connect real local weather conditions to home maintenance and improvement services.

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
10. Reference the ACTUAL forecast for the specific week with specific dates.
11. Include a CTA paragraph at the end with phone number ${siteConfig.phone}.
12. Write in a professional but approachable tone — like a knowledgeable neighbor.

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

function buildUserPrompt(
  forecast: WeeklyForecast,
  internalLinks: string
): string {
  const { summary, weekRange, periods } = forecast;

  // Build a readable forecast summary
  const forecastDetails = periods
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

  return `Write a weather-triggered blog post for the week of ${weekRange}.

WEATHER FORECAST FOR MUNCIE, IN:
${forecastDetails}

WEATHER SUMMARY:
- Dominant condition: ${summary.dominantCondition}
- Temperature range: ${summary.lowTemp}°F to ${summary.highTemp}°F
- Precipitation days: ${summary.precipitationDays}
- Storm risk: ${summary.stormRisk}
- Freeze risk: ${summary.freezeRisk}
- Hail risk: ${summary.hailRisk}
- High wind risk: ${summary.highWindRisk}
- Heavy rain risk: ${summary.heavyRainRisk}

ACTIVE ALERTS:
${alertsText}

WEATHER STORY:
${summary.weatherStory}

PRIMARY SERVICE FOCUS: ${summary.relevantServices[0]}
SECONDARY SERVICES: ${summary.relevantServices.slice(1).join(", ")}

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

Generate the blog post now following all SOP rules and the exact output format specified.`;
}

function buildInternalLinksContext(): string {
  const links: string[] = [];

  // Add all main service pages
  for (const [key, service] of Object.entries(siteConfig.services)) {
    links.push(`- ${service.label}: ${service.url}`);
    // Add subpages
    for (const [subKey, subUrl] of Object.entries(service.subpages)) {
      links.push(`  - ${subKey}: ${subUrl}`);
    }
  }

  // Add key pages
  links.push(`- About Us: ${siteConfig.pages.about}`);
  links.push(`- Services Overview: ${siteConfig.pages.services}`);
  links.push(`- Gallery: ${siteConfig.pages.gallery}`);
  links.push(`- Testimonials: ${siteConfig.pages.testimonials}`);
  links.push(`- Contact Us: ${siteConfig.pages.contact}`);

  return links.join("\n");
}

/**
 * Parse the AI's structured response into frontmatter + content.
 */
function parseGeneratedContent(
  raw: string,
  forecast: WeeklyForecast,
  primaryService: string
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
    weatherWeek: forecast.weekRange,
    featuredImage: "",
    schema: {
      type: "Article",
      faqItems,
    },
    status: "draft",
  };

  // Compose the full Markdown file
  const frontmatterYaml = composeFrontmatterYaml(frontmatter);
  const markdownContent = `${frontmatterYaml}\n\n${content}`;

  const fileName = `${dateStr}-${slug}.md`;
  const filePath = `content/posts/drafts/${fileName}`;

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
weatherWeek: "${fm.weatherWeek}"
featuredImage: "${fm.featuredImage}"
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
