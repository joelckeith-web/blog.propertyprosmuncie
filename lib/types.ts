/** Weather mode — derived from historical + forecast analysis */
export type WeatherMode = "pre-event" | "post-event" | "combined";

/** Blog post frontmatter schema */
export interface BlogFrontmatter {
  title: string;
  slug: string;
  publishDate: string; // YYYY-MM-DD
  author: string;
  category:
    | "roofing"
    | "fencing"
    | "siding"
    | "gutters"
    | "decks"
    | "remodeling"
    | "construction"
    | "general";
  tags: string[];
  metaTitle: string; // 50-60 chars
  metaDescription: string; // 150-160 chars
  weatherTriggered: boolean;
  weatherMode: WeatherMode;
  weatherWeek: string; // e.g. "March 10–16, 2026"
  featuredImage: string;
  serviceAreaFooterLinks: ServiceAreaLink[];
  schema: {
    type: "Article" | "BlogPosting";
    faqItems: FaqItem[];
  };
  status: "draft" | "published";
}

export interface ServiceAreaLink {
  label: string; // e.g. "Roof Repair in Muncie's Near Northside"
  url: string; // verified service page URL
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  frontmatter: BlogFrontmatter;
  content: string;
  slug: string;
  readingTime: string;
}

/** NWS Weather API types */
export interface WeatherPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend: string | null;
  probabilityOfPrecipitation: {
    unitCode: string;
    value: number | null;
  };
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

/** NWS observation from past 48 hours */
export interface WeatherObservation {
  timestamp: string;
  temperature: number | null; // °F
  windSpeed: number | null; // mph
  windGust: number | null; // mph
  precipitationLastHour: number | null; // inches
  description: string;
}

/** Historical weather summary (past 48 hours) */
export interface HistoricalWeather {
  totalPrecipitation: number; // inches
  peakWindGust: number; // mph
  hadSevereWeather: boolean;
  severeEvents: string[];
  summary: string;
}

export interface WeeklyForecast {
  location: string;
  fetchedAt: string;
  weekRange: string;
  periods: WeatherPeriod[];
  alerts: WeatherAlert[];
  summary: WeatherSummary;
}

export interface WeatherAlert {
  event: string;
  headline: string;
  severity: string;
  description: string;
  onset: string;
  expires: string;
}

export interface WeatherSummary {
  dominantCondition: string;
  highTemp: number;
  lowTemp: number;
  precipitationDays: number;
  stormRisk: boolean;
  freezeRisk: boolean;
  hailRisk: boolean;
  highWindRisk: boolean;
  heavyRainRisk: boolean;
  relevantServices: string[];
  weatherStory: string;
}

/** Full weather context — combines historical + forecast + mode */
export interface WeatherContext {
  mode: WeatherMode;
  historical: HistoricalWeather;
  forecast: WeeklyForecast;
  historicalSummary: string;
  forecastSummary: string;
  dominantHazard: string;
  affectedServices: string[];
  weekLabel: string;
}

/** Content generation types */
export interface GeneratedBlog {
  frontmatter: BlogFrontmatter;
  markdownContent: string;
  filePath: string;
}
