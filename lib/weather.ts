import type {
  WeeklyForecast,
  WeatherPeriod,
  WeatherAlert,
  WeatherSummary,
} from "./types";

/**
 * Muncie, IN coordinates for NWS API.
 * Lat/Lon for Muncie city center.
 */
const MUNCIE_LAT = 40.1934;
const MUNCIE_LON = -85.3864;

const NWS_USER_AGENT = "PropertyProsBlog/1.0 (blog@propertyprosmuncie.com)";

/**
 * Fetch the 7-day forecast for Muncie, IN from the NWS API.
 * NWS API is free, no key required — just needs a User-Agent header.
 *
 * Flow: /points/{lat},{lon} → get forecast URL → /forecast
 */
export async function fetchWeeklyForecast(): Promise<WeeklyForecast> {
  const headers = {
    "User-Agent": NWS_USER_AGENT,
    Accept: "application/geo+json",
  };

  // Step 1: Get the forecast endpoint for Muncie's coordinates
  const pointsRes = await fetch(
    `https://api.weather.gov/points/${MUNCIE_LAT},${MUNCIE_LON}`,
    { headers }
  );

  if (!pointsRes.ok) {
    throw new Error(
      `NWS Points API error: ${pointsRes.status} ${pointsRes.statusText}`
    );
  }

  const pointsData = await pointsRes.json();
  const forecastUrl: string = pointsData.properties.forecast;
  const alertsZone: string = pointsData.properties.forecastZone;
  const zoneId = alertsZone.split("/").pop();

  // Step 2: Fetch the 7-day forecast
  const forecastRes = await fetch(forecastUrl, { headers });

  if (!forecastRes.ok) {
    throw new Error(
      `NWS Forecast API error: ${forecastRes.status} ${forecastRes.statusText}`
    );
  }

  const forecastData = await forecastRes.json();
  const periods: WeatherPeriod[] = forecastData.properties.periods;

  // Step 3: Fetch active alerts for the zone
  const alerts = await fetchAlerts(zoneId!, headers);

  // Step 4: Compute the week range string
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 6);
  const weekRange = `${formatDateShort(now)}–${formatDateShort(endOfWeek)}, ${now.getFullYear()}`;

  // Step 5: Analyze forecast into a summary
  const summary = analyzeWeather(periods, alerts);

  return {
    location: "Muncie, IN",
    fetchedAt: now.toISOString(),
    weekRange,
    periods,
    alerts,
    summary,
  };
}

async function fetchAlerts(
  zoneId: string,
  headers: Record<string, string>
): Promise<WeatherAlert[]> {
  try {
    const alertsRes = await fetch(
      `https://api.weather.gov/alerts/active?zone=${zoneId}`,
      { headers }
    );

    if (!alertsRes.ok) return [];

    const alertsData = await alertsRes.json();
    return (alertsData.features || []).map(
      (f: { properties: Record<string, string> }) => ({
        event: f.properties.event,
        headline: f.properties.headline,
        severity: f.properties.severity,
        description: (f.properties.description || "").substring(0, 500),
        onset: f.properties.onset,
        expires: f.properties.expires,
      })
    );
  } catch {
    // Alerts are non-critical — return empty if fetch fails
    return [];
  }
}

/**
 * Analyze forecast periods to determine the dominant weather story
 * and which services are most relevant.
 */
function analyzeWeather(
  periods: WeatherPeriod[],
  alerts: WeatherAlert[]
): WeatherSummary {
  const daytimePeriods = periods.filter((p) => p.isDaytime);
  const allTemps = periods.map((p) => p.temperature);
  const highTemp = Math.max(...allTemps);
  const lowTemp = Math.min(...allTemps);

  // Analyze precipitation
  const precipDays = daytimePeriods.filter((p) => {
    const forecast = p.shortForecast.toLowerCase();
    return (
      forecast.includes("rain") ||
      forecast.includes("snow") ||
      forecast.includes("storm") ||
      forecast.includes("shower") ||
      (p.probabilityOfPrecipitation?.value ?? 0) > 30
    );
  }).length;

  // Detect specific weather risks
  const allForecasts = periods
    .map((p) => p.detailedForecast.toLowerCase())
    .join(" ");
  const allShort = periods
    .map((p) => p.shortForecast.toLowerCase())
    .join(" ");

  const stormRisk =
    allForecasts.includes("thunderstorm") ||
    allForecasts.includes("severe") ||
    alerts.some((a) =>
      a.event.toLowerCase().includes("thunderstorm")
    );

  const hailRisk =
    allForecasts.includes("hail") ||
    alerts.some((a) => a.event.toLowerCase().includes("hail"));

  const highWindRisk =
    allForecasts.includes("high wind") ||
    allForecasts.includes("wind advisory") ||
    periods.some((p) => {
      const speed = parseInt(p.windSpeed);
      return speed > 25;
    });

  const freezeRisk =
    lowTemp <= 32 ||
    allForecasts.includes("freeze") ||
    allForecasts.includes("frost");

  const heavyRainRisk =
    allForecasts.includes("heavy rain") ||
    allForecasts.includes("flood") ||
    precipDays >= 4;

  // Determine dominant condition and relevant services
  let dominantCondition: string;
  let relevantServices: string[];

  if (stormRisk || hailRisk) {
    dominantCondition = hailRisk ? "hail" : "storm";
    relevantServices = ["roofing", "siding", "gutters"];
  } else if (highWindRisk) {
    dominantCondition = "high_wind";
    relevantServices = ["roofing", "siding", "fencing"];
  } else if (freezeRisk && precipDays > 0) {
    dominantCondition = "freeze_thaw";
    relevantServices = ["roofing", "fencing", "construction"];
  } else if (heavyRainRisk) {
    dominantCondition = "heavy_rain";
    relevantServices = ["gutters", "roofing"];
  } else if (
    allShort.includes("snow") ||
    allShort.includes("ice")
  ) {
    dominantCondition = "snow_ice";
    relevantServices = ["roofing", "gutters"];
  } else if (highTemp > 90) {
    dominantCondition = "extreme_heat";
    relevantServices = ["roofing", "siding"];
  } else {
    dominantCondition = "mild";
    relevantServices = ["remodeling", "fencing", "construction"];
  }

  // Build a human-readable weather story
  const weatherStory = buildWeatherStory(
    dominantCondition,
    highTemp,
    lowTemp,
    precipDays,
    periods
  );

  return {
    dominantCondition,
    highTemp,
    lowTemp,
    precipitationDays: precipDays,
    stormRisk,
    freezeRisk,
    hailRisk,
    highWindRisk,
    heavyRainRisk,
    relevantServices,
    weatherStory,
  };
}

function buildWeatherStory(
  condition: string,
  high: number,
  low: number,
  precipDays: number,
  periods: WeatherPeriod[]
): string {
  const dayNames = periods
    .filter((p) => p.isDaytime)
    .slice(0, 7)
    .map((p) => p.name);

  const storyMap: Record<string, string> = {
    storm: `Severe weather is expected this week in Muncie with thunderstorms forecast. Temperatures range from ${low}°F to ${high}°F with ${precipDays} days of precipitation expected. Homeowners should inspect roofing, siding, and gutters before the storms arrive.`,
    hail: `Hail is in the forecast for Muncie this week. With temperatures between ${low}°F and ${high}°F, hail damage to roofing and siding is a real concern. Now is the time to schedule inspections.`,
    high_wind: `High winds are expected in the Muncie area this week, with temperatures from ${low}°F to ${high}°F. Wind can damage roofing, loosen siding, and knock down fencing.`,
    freeze_thaw: `Freeze-thaw cycles are in play this week in Muncie with lows near ${low}°F and highs reaching ${high}°F. This temperature swing can cause cracking in exposed materials and stress on roofing and fencing.`,
    heavy_rain: `Heavy rain is expected in Muncie this week with ${precipDays} days of precipitation. Temperatures range from ${low}°F to ${high}°F. Gutters and drainage systems will be put to the test.`,
    snow_ice: `Snow and ice are in the forecast for Muncie this week. Temperatures will range from ${low}°F to ${high}°F. Ice buildup can stress gutters and roofing systems.`,
    extreme_heat: `Extreme heat is expected in Muncie this week with highs near ${high}°F. Prolonged heat can damage roofing materials and cause siding to warp.`,
    mild: `Mild weather is expected in Muncie this week with temperatures from ${low}°F to ${high}°F. This is ideal weather for scheduling home improvement projects like remodeling, fencing, or construction work.`,
  };

  return storyMap[condition] || storyMap.mild;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}
