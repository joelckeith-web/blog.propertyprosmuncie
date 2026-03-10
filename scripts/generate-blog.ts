#!/usr/bin/env tsx
/**
 * Manual blog generation script.
 * Run: npm run generate
 *
 * Fetches weather, generates blog content, and either:
 * - Saves locally to content/posts/drafts/ (default)
 * - Pushes to GitHub dev branch (with --push flag)
 */

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { fetchWeeklyForecast } from "../lib/weather";
import { generateBlogPost } from "../lib/content-generator";
import { pushBlogToDev } from "../lib/github";

const PUSH_TO_GIT = process.argv.includes("--push");

async function main() {
  console.log("🌦️  Property Pros Blog Generator");
  console.log("================================\n");

  // Step 1: Fetch weather
  console.log("📡 Fetching Muncie, IN weather forecast...");
  const forecast = await fetchWeeklyForecast();
  console.log(`   Week: ${forecast.weekRange}`);
  console.log(`   Condition: ${forecast.summary.dominantCondition}`);
  console.log(`   Temps: ${forecast.summary.lowTemp}°F – ${forecast.summary.highTemp}°F`);
  console.log(`   Precip days: ${forecast.summary.precipitationDays}`);
  console.log(`   Services: ${forecast.summary.relevantServices.join(", ")}`);
  if (forecast.alerts.length > 0) {
    console.log(`   ⚠️ Active alerts: ${forecast.alerts.map((a) => a.event).join(", ")}`);
  }
  console.log();

  // Step 2: Generate blog
  console.log("✍️  Generating blog content via Claude API...");
  const blog = await generateBlogPost(forecast);
  console.log(`   Title: ${blog.frontmatter.title}`);
  console.log(`   Category: ${blog.frontmatter.category}`);
  console.log(`   Slug: ${blog.frontmatter.slug}`);
  console.log(`   Tags: ${blog.frontmatter.tags.join(", ")}`);
  console.log(`   FAQs: ${blog.frontmatter.schema.faqItems.length}`);
  console.log();

  if (PUSH_TO_GIT) {
    // Push to GitHub dev branch
    console.log("📤 Pushing to GitHub dev branch...");
    const result = await pushBlogToDev(blog);
    console.log(`   Branch: ${result.branch}`);
    console.log(`   File: ${result.filePath}`);
    console.log(`   Commit: ${result.commitUrl}`);
    console.log(`\n✅ Done! Review the draft on the '${result.branch}' branch and merge to 'main' to publish.`);
  } else {
    // Save locally
    const draftsDir = path.join(process.cwd(), "content/posts/drafts");
    fs.mkdirSync(draftsDir, { recursive: true });

    const filePath = path.join(process.cwd(), blog.filePath);
    fs.writeFileSync(filePath, blog.markdownContent, "utf-8");
    console.log(`💾 Saved locally: ${blog.filePath}`);
    console.log(`\n✅ Done! Review the draft, then run 'npm run generate -- --push' to push to GitHub.`);
  }
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message || error);
  process.exit(1);
});
