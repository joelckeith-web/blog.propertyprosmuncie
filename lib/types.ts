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
  weatherWeek: string; // e.g. "March 10–16, 2026"
  featuredImage: string;
  schema: {
    type: "Article" | "BlogPosting";
    faqItems: FaqItem[];
  };
  status: "draft" | "approved" | "published";
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

/** Content generation types */
export interface GeneratedBlog {
  frontmatter: BlogFrontmatter;
  markdownContent: string;
  filePath: string;
}

/** Approval token payload */
export interface ApprovalTokenPayload {
  slug: string;
  action: "approve" | "reject";
  iat: number;
  exp: number;
}
