import { NextRequest, NextResponse } from "next/server";
import { buildWeatherContext } from "@/lib/weather";
import { generateBlogPost } from "@/lib/content-generator";
import { pushBlogToMain } from "@/lib/github";
import { notifyGoogleIndexing } from "@/lib/google-indexing";
import { siteConfig } from "@/lib/site-config";

/**
 * Vercel Cron endpoint — triggers weekly blog generation.
 * Schedule: Every Sunday at 5:00 PM ET (configured in vercel.json)
 *
 * Flow:
 * 1. Fetch historical weather (past 48h) + 7-day forecast from NWS API
 * 2. Classify weather mode (pre-event / post-event / combined)
 * 3. Generate blog post via Claude API with mode-specific prompts
 * 4. Push directly to `main` branch on GitHub → Vercel auto-deploys
 * 5. Ping Google Indexing API for fast crawl (if configured)
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

    // Step 1: Build full weather context (historical + forecast + mode)
    console.log("📡 Fetching Muncie weather data (historical + forecast)...");
    const weatherContext = await buildWeatherContext();
    console.log(
      `✅ Weather context built: mode=${weatherContext.mode}, hazard=${weatherContext.dominantHazard}`
    );
    console.log(`   Historical: ${weatherContext.historicalSummary}`);
    console.log(`   Forecast: ${weatherContext.forecastSummary}`);

    // Step 2: Generate blog post with mode-specific content
    console.log(`✍️ Generating ${weatherContext.mode} blog content via Claude...`);
    const blog = await generateBlogPost(weatherContext);
    console.log(`✅ Blog generated: "${blog.frontmatter.title}"`);

    // Step 3: Push directly to main branch
    console.log("📤 Pushing to main branch (auto-deploy)...");
    const result = await pushBlogToMain(blog);
    console.log(`✅ Pushed to ${result.branch}: ${result.commitUrl}`);

    // Step 4: Ping Google Indexing API (optional — skips if not configured)
    const pageUrl = `${siteConfig.blogUrl}/${blog.frontmatter.slug}`;
    console.log(`🔍 Pinging Google Indexing API for: ${pageUrl}`);
    const indexResult = await notifyGoogleIndexing(pageUrl);
    if (indexResult.success) {
      console.log("✅ Google Indexing API notified successfully");
    } else {
      console.log(`ℹ️ Google Indexing: ${indexResult.error}`);
    }

    return NextResponse.json({
      success: true,
      blog: {
        title: blog.frontmatter.title,
        slug: blog.frontmatter.slug,
        category: blog.frontmatter.category,
        weatherMode: weatherContext.mode,
        weatherWeek: blog.frontmatter.weatherWeek,
        dominantHazard: weatherContext.dominantHazard,
      },
      git: {
        branch: result.branch,
        commitUrl: result.commitUrl,
        filePath: result.filePath,
      },
      indexing: indexResult,
      message: `Blog auto-published to '${result.branch}'. Vercel will deploy automatically.`,
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
