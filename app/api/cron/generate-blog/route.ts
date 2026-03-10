import { NextRequest, NextResponse } from "next/server";
import { fetchWeeklyForecast } from "@/lib/weather";
import { generateBlogPost } from "@/lib/content-generator";
import { pushBlogToDev } from "@/lib/github";

/**
 * Vercel Cron endpoint — triggers weekly blog generation.
 * Schedule: Every Sunday at 5:00 PM ET (configured in vercel.json)
 *
 * Flow:
 * 1. Fetch 7-day weather forecast from NWS API
 * 2. Generate blog post via Claude API
 * 3. Push draft to `dev` branch on GitHub
 * 4. Human reviews and merges to `main` → Vercel auto-deploys
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🌦️ Starting weekly blog generation...");

    // Step 1: Fetch weather
    console.log("📡 Fetching Muncie weather forecast...");
    const forecast = await fetchWeeklyForecast();
    console.log(
      `✅ Forecast fetched: ${forecast.summary.dominantCondition}, ${forecast.summary.highTemp}°F high`
    );

    // Step 2: Generate blog post
    console.log("✍️ Generating blog content via Claude...");
    const blog = await generateBlogPost(forecast);
    console.log(`✅ Blog generated: "${blog.frontmatter.title}"`);

    // Step 3: Push to dev branch
    console.log("📤 Pushing draft to dev branch...");
    const result = await pushBlogToDev(blog);
    console.log(`✅ Pushed to ${result.branch}: ${result.commitUrl}`);

    return NextResponse.json({
      success: true,
      blog: {
        title: blog.frontmatter.title,
        slug: blog.frontmatter.slug,
        category: blog.frontmatter.category,
        weatherWeek: blog.frontmatter.weatherWeek,
        weatherCondition: forecast.summary.dominantCondition,
      },
      git: {
        branch: result.branch,
        commitUrl: result.commitUrl,
        filePath: result.filePath,
      },
      message: `Blog draft pushed to '${result.branch}' branch. Review and merge to 'main' to publish.`,
    });
  } catch (error: unknown) {
    console.error("❌ Blog generation failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Vercel cron requires GET method
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for API calls
