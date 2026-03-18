/**
 * Pexels API integration for fetching featured images.
 * Gracefully returns empty string on any failure so the cron job is never blocked.
 */

const PEXELS_API_URL = "https://api.pexels.com/v1/search";

const categorySearchTerms: Record<string, string> = {
  roofing: "roof repair",
  siding: "house siding",
  gutters: "rain gutter",
  fencing: "fence installation",
  remodeling: "home remodeling",
  construction: "home construction",
  decks: "wood deck",
  general: "home improvement",
};

export async function fetchFeaturedImage(
  category: string,
  hazard: string
): Promise<string> {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      console.log("⚠️ PEXELS_API_KEY not set, skipping featured image fetch");
      return "";
    }

    const categoryTerm = categorySearchTerms[category] || category.replace(/-/g, " ");
    const query = `${categoryTerm} ${hazard}`;

    const url = new URL(PEXELS_API_URL);
    url.searchParams.set("query", query);
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("per_page", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      console.log(`⚠️ Pexels API returned ${response.status}, skipping featured image`);
      return "";
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
      console.log("⚠️ No Pexels results for query:", query);
      return "";
    }

    const photo = data.photos[0];
    const imageUrl = photo.src.large2x || photo.src.landscape || "";

    if (imageUrl) {
      console.log(`✅ Featured image fetched from Pexels for: "${query}"`);
    }

    return imageUrl;
  } catch (error) {
    console.log("⚠️ Pexels API error, skipping featured image:", error instanceof Error ? error.message : error);
    return "";
  }
}
