import type {
  WeeklyForecast,
  WeatherPeriod,
  WeatherAlert,
  WeatherSummary,
  WeatherContext,
  WeatherMode,
  HistoricalWeather,
  WeatherObservation,
} from "./types";

/**
 * Muncie, IN coordinates for NWS API.
 * Lat/Lon for Muncie city center.
 */
const MUNCIE_LAT = 40.1934;
const MUNCIE_LON = -85.3864;

/** KMIE — Delaware County Airport, closest NWS station to Muncie */
const MUNCIE_STATION = "KMIE";

const NWS_USER_AGENT = "PropertyProsBlog/1.0 (blog@propertyprosmuncie.com)";

// ─── Unit conversion helpers ──────────────────────────────
function celsiusToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}
function kphToMph(kph: number): number {
  return Math.round(kph * 0.621371);
}
function mmToInches(mm: number): number {
  return Math.round(mm / 25.4 * 100) / 100;
}

// ─── Severe weather keyword detection ─────────────────────
const SEVERE_KEYWORDS = [
  "tornado",
  "severe thunderstorm",
  "hail",
  "flood",
  "blizzard",
  "ice storm",
  "winter storm",
  "high wind warning",
  "damaging wind",
];

// ═══════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════

/**
 * Build full weather context combining:
 * 1. Historical observations (past 48 hours) — "Weather Lag" data
 * 2. 7-day forecast
 * 3. Mode classification (pre-event / post-event / combined)
 *
 * This is the single entry point the content generator calls.
 */
export async function buildWeatherContext(): Promise<WeatherContext> {
  // Fetch both in parallel
  const [historical, forecast] = await Promise.all([
    fetchHistoricalObservations(),
    fetchWeeklyForecast(),
  ]);

  const mode = determineWeatherMode(historical, forecast);

  // Build human-readable summaries for the content generator
  const historicalSummary = buildHistoricalSummary(historical);
  const forecastSummary = forecast.summary.weatherStory;

  // Determine the single dominant hazard + affected services
  const { dominantHazard, affectedServices } = classifyHazards(
    mode,
    historical,
    forecast
  );

  return {
    mode,
    historical,
    forecast,
    historicalSummary,
    forecastSummary,
    dominantHazard,
    affectedServices,
    weekLabel: forecast.weekRange,
  };
}

/** Re-export for backward compatibility */
export { fetchWeeklyForecast };

// ═══════════════════════════════════════════════════════════
//  HISTORICAL OBSERVATIONS  (past 48 hours from KMIE)
// ═══════════════════════════════════════════════════════════

async function fetchHistoricalObservations(): Promise<HistoricalWeather> {
  const headers: Record<string, string> = {
    "User-Agent": NWS_USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const res = await fetch(
      `https://api.weather.gov/stations/${MUNCIE_STATION}/observations?limit=96`,
      { headers }
    );

    if (!res.ok) {
      console.warn(
        `NWS Observations API error: ${res.status}. Falling back to empty historical.`
      );
      return emptyHistorical();
    }

    const data = await res.json();
    const features: Array<{ properties: Record<string, unknown> }> =
      data.features || [];

    // Parse the observations
    const observations: WeatherObservation[] = features
      .map((f) => {
        const p = f.properties;
        return {
          timestamp: (p.timestamp as string) || "",
          temperature: extractTemp(p),
          windSpeed: extractWindSpeed(p),
          windGust: extractWindGust(p),
          precipitationLastHour: extractPrecip(p),
          description: (p.textDescription as string) || "",
        };
      })
      .filter((o) => o.timestamp); // filter out empty

    // Aggregate into summary
    let totalPrecip = 0;
    let peakGust = 0;
    const severeEvents: string[] = [];

    for (const obs of observations) {
      if (obs.precipitationLastHour && obs.precipitationLastHour > 0) {
        totalPrecip += obs.precipitationLastHour;
      }
      if (obs.windGust && obs.windGust > peakGust) {
        peakGust = obs.windGust;
      }
      const desc = obs.description.toLowerCase();
      for (const kw of SEVERE_KEYWORDS) {
        if (desc.includes(kw) && !severeEvents.includes(kw)) {
          severeEvents.push(kw);
        }
      }
    }

    const hadSevere = severeEvents.length > 0 || peakGust > 50 || totalPrecip > 2;

    return {
      totalPrecipitation: Math.round(totalPrecip * 100) / 100,
      peakWindGust: Math.round(peakGust),
      hadSevereWeather: hadSevere,
      severeEvents,
      summary: buildHistoricalSummaryText(
        totalPrecip,
        peakGust,
        hadSevere,
        severeEvents,
        observations
      ),
    };
  } catch (err) {
    console.warn("Failed to fetch historical observations:", err);
    return emptyHistorical();
  }
}

function emptyHistorical(): HistoricalWeather {
  return {
    totalPrecipitation: 0,
    peakWindGust: 0,
    hadSevereWeather: false,
    severeEvents: [],
    summary: "No significant weather events in the past 48 hours in Muncie.",
  };
}

// ─── NWS observation field extractors ─────────────────────

function extractTemp(p: Record<string, unknown>): number | null {
  const t = p.temperature as { value: number | null } | null;
  if (!t || t.value === null) return null;
  return celsiusToF(t.value);
}

function extractWindSpeed(p: Record<string, unknown>): number | null {
  const w = p.windSpeed as { value: number | null } | null;
  if (!w || w.value === null) return null;
  return kphToMph(w.value);
}

function extractWindGust(p: Record<string, unknown>): number | null {
  const g = p.windGust as { value: number | null } | null;
  if (!g || g.value === null) return null;
  return kphToMph(g.value);
}

function extractPrecip(p: Record<string, unknown>): number | null {
  const pr = p.precipitationLastHour as { value: number | null } | null;
  if (!pr || pr.value === null) return null;
  return mmToInches(pr.value);
}

function buildHistoricalSummaryText(
  precip: number,
  gust: number,
  severe: boolean,
  events: string[],
  observations: WeatherObservation[]
): string {
  const parts: string[] = [];

  if (severe && events.length > 0) {
    parts.push(
      `Severe weather hit Muncie in the past 48 hours: ${events.join(", ")}.`
    );
  }

  if (precip > 0.5) {
    parts.push(
      `${precip.toFixed(2)} inches of precipitation recorded.`
    );
  }

  if (gust > 35) {
    parts.push(`Wind gusts peaked at ${gust} mph.`);
  }

  if (parts.length === 0) {
    // Build a gentle summary from recent conditions
    const recentDescs = observations
      .slice(0, 6)
      .map((o) => o.description)
      .filter(Boolean);
    const unique = [...new Set(recentDescs)];
    parts.push(
      `Recent conditions in Muncie: ${unique.join(", ") || "clear skies"}.`
    );
  }

  return parts.join(" ");
}

// ═══════════════════════════════════════════════════════════
//  MODE CLASSIFICATION
// ═══════════════════════════════════════════════════════════

/**
 * Determine content mode based on historical + forecast data.
 *
 * post-event  — significant weather in past 48h → focus on damage recovery
 * pre-event   — significant weather in upcoming forecast → focus on preparation
 * combined    — both past damage AND more coming → address both
 */
function determineWeatherMode(
  historical: HistoricalWeather,
  forecast: WeeklyForecast
): WeatherMode {
  const pastSignificant =
    historical.totalPrecipitation > 1 ||
    historical.peakWindGust > 35 ||
    historical.hadSevereWeather;

  const forecastSignificant =
    forecast.summary.stormRisk ||
    forecast.summary.hailRisk ||
    forecast.summary.highWindRisk ||
    forecast.summary.heavyRainRisk ||
    forecast.summary.freezeRisk;

  if (pastSignificant && forecastSignificant) return "combined";
  if (pastSignificant) return "post-event";
  return "pre-event"; // default to preparation-focused content
}

// ═══════════════════════════════════════════════════════════
//  HAZARD CLASSIFICATION
// ═══════════════════════════════════════════════════════════

function classifyHazards(
  mode: WeatherMode,
  historical: HistoricalWeather,
  forecast: WeeklyForecast
): { dominantHazard: string; affectedServices: string[] } {
  // For post-event, prioritize what already happened
  if (mode === "post-event") {
    if (historical.severeEvents.length > 0) {
      const event = historical.severeEvents[0];
      if (event.includes("hail"))
        return { dominantHazard: "hail_damage", affectedServices: ["roofing", "siding", "gutters"] };
      if (event.includes("tornado") || event.includes("wind"))
        return { dominantHazard: "wind_damage", affectedServices: ["roofing", "siding", "fencing"] };
      if (event.includes("flood") || event.includes("storm"))
        return { dominantHazard: "storm_damage", affectedServices: ["roofing", "gutters", "siding"] };
    }
    if (historical.peakWindGust > 50)
      return { dominantHazard: "wind_damage", affectedServices: ["roofing", "siding", "fencing"] };
    if (historical.totalPrecipitation > 2)
      return { dominantHazard: "water_damage", affectedServices: ["gutters", "roofing"] };
    return { dominantHazard: "storm_damage", affectedServices: ["roofing", "siding", "gutters"] };
  }

  // For pre-event or combined, use forecast analysis
  return {
    dominantHazard: forecast.summary.dominantCondition,
    affectedServices: forecast.summary.relevantServices,
  };
}

// ═══════════════════════════════════════════════════════════
//  HELPER: human-readable historical summary for prompts
// ═══════════════════════════════════════════════════════════

function buildHistoricalSummary(historical: HistoricalWeather): string {
  if (
    historical.totalPrecipitation === 0 &&
    historical.peakWindGust === 0 &&
    !historical.hadSevereWeather
  ) {
    return "No significant weather events have occurred in the Muncie area over the past 48 hours.";
  }

  return historical.summary;
}

// ═══════════════════════════════════════════════════════════
//  7-DAY FORECAST  (existing logic preserved)
// ═══════════════════════════════════════════════════════════

async function fetchWeeklyForecast(): Promise<WeeklyForecast> {
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

  const allForecasts = periods
    .map((p) => p.detailedForecast.toLowerCase())
    .join(" ");

  const stormRisk =
    allForecasts.includes("thunderstorm") ||
    allForecasts.includes("severe") ||
    alerts.some((a) => a.event.toLowerCase().includes("thunderstorm"));

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
    periods.map((p) => p.shortForecast.toLowerCase()).join(" ").includes("snow") ||
    periods.map((p) => p.shortForecast.toLowerCase()).join(" ").includes("ice")
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

  const weatherStory = buildWeatherStory(
    dominantCondition,
    highTemp,
    lowTemp,
    precipDays,
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
): string {
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
