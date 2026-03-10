#!/usr/bin/env tsx
/**
 * Manual blog generation script.
 * Run: npm run generate
 *
 * Fetches historical weather + forecast, classifies mode, generates blog,
 * and either:
 * - Saves locally to content/posts/ (default)
 * - Pushes directly to GitHub main branch (with --push flag)
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { buildWeatherContext } from "../lib/weather";
import { generateBlogPost } from "../lib/content-generator";
import { pushBlogToMain } from "../lib/github";
import { notifyGoogleIndexing } from "../lib/google-indexing";

const PUSH_TO_GIT = process.argv.includes("--push");

async function main() {
  console.log("🌦️  Property Pros Blog Generator");
  console.log("================================\n");

  // Step 1: Build full weather context
  console.log("📡 Fetching Muncie, IN weather data (historical + forecast)...");
  const context = await buildWeatherContext();
  console.log(`   Mode: ${context.mode}`);
  console.log(`   Week: ${context.weekLabel}`);
  console.log(`   Dominant hazard: ${context.dominantHazard}`);
  console.log(`   Affected services: ${context.affectedServices.join(", ")}`);
  console.log(`   Historical: ${context.historicalSummary}`);
  console.log(`   Forecast: ${context.forecastSummary}`);
  if (context.forecast.alerts.length > 0) {
    console.log(`   ⚠️ Active alerts: ${context.forecast.alerts.map((a) => a.event).join(", ")}`);
  }
  console.log();

  // Step 2: Generate blog with mode-specific prompts
  console.log(`✍️  Generating ${context.mode} blog content via Claude API...`);
  const blog = await generateBlogPost(context);
  console.log(`   Title: ${blog.frontmatter.title}`);
  console.log(`   Category: ${blog.frontmatter.category}`);
  console.log(`   Weather mode: ${blog.frontmatter.weatherMode}`);
  console.log(`   Slug: ${blog.frontmatter.slug}`);
  console.log(`   Tags: ${blog.frontmatter.tags.join(", ")}`);
  console.log(`   FAQs: ${blog.frontmatter.schema.faqItems.length}`);
  console.log(`   Geo links: ${blog.frontmatter.serviceAreaFooterLinks.length}`);
  console.log();

  if (PUSH_TO_GIT) {
    // Push directly to main branch
    console.log("📤 Pushing to GitHub main branch (auto-deploy)...");
    const result = await pushBlogToMain(blog);
    console.log(`   Branch: ${result.branch}`);
    console.log(`   File: ${result.filePath}`);
    console.log(`   Commit: ${result.commitUrl}`);

    // Ping Google Indexing API
    const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://blog.propertyprosmuncie.com"}/${blog.frontmatter.slug}`;
    console.log(`\n🔍 Pinging Google Indexing API for: ${blogUrl}`);
    const indexResult = await notifyGoogleIndexing(blogUrl);
    if (indexResult.success) {
      console.log("   ✅ Google notified — expect indexing within minutes.");
    } else {
      console.log(`   ℹ️ ${indexResult.error}`);
    }

    console.log(`\n✅ Done! Blog auto-published to '${result.branch}'. Vercel will deploy automatically.`);
  } else {
    // Save locally
    const postsDir = path.join(process.cwd(), "content/posts");
    fs.mkdirSync(postsDir, { recursive: true });

    const filePath = path.join(process.cwd(), blog.filePath);
    fs.writeFileSync(filePath, blog.markdownContent, "utf-8");
    console.log(`💾 Saved locally: ${blog.filePath}`);
    console.log(`\n✅ Done! Review the post, then run 'npm run generate:push' to push to GitHub main.`);
  }
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message || error);
  process.exit(1);
});
